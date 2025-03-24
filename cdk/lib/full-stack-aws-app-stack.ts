import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';

export class FullStackAwsAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for frontend hosting
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 bucket for file storage
    const storageBucket = new s3.Bucket(this, 'StorageBucket', {
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB table for file metadata
    const fileMetadataTable = new dynamodb.Table(this, 'FileMetadataTable', {
      partitionKey: { name: 'fileId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'uploadDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create indexes for efficient queries
    fileMetadataTable.addGlobalSecondaryIndex({
      indexName: 'userIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'uploadDate', type: dynamodb.AttributeType.STRING },
    });

    // DynamoDB table for processing results
    const processingResultsTable = new dynamodb.Table(this, 'ProcessingResultsTable', {
      partitionKey: { name: 'fileId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool for authentication
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // VPC for EC2 instances
    const vpc = new ec2.Vpc(this, 'ProcessingVpc', {
      maxAzs: 2,
      natGateways: 0, // Cost saving for dev, use NAT gateways in production
    });

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Allow HTTP(S) outbound traffic',
      allowAllOutbound: true,
    });

    // EC2 instance role
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
      ],
    });

    // EC2 launch template for processing instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'ProcessingInstanceTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.custom(`#!/bin/bash
        yum update -y
        amazon-linux-extras install docker -y
        service docker start
        systemctl enable docker
        # Add script to poll for processing tasks
        cat > /home/ec2-user/process-files.sh << 'EOF'
#!/bin/bash
while true; do
  # Check DynamoDB for tasks
  # Process file from S3
  # Update results in DynamoDB
  sleep 10
done
EOF
        chmod +x /home/ec2-user/process-files.sh
        /home/ec2-user/process-files.sh &
      `),
    });

    // Lambda for file upload handling
    const fileUploadLambda = new lambda.Function(this, 'FileUploadFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'fileUpload.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src')),
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
        FILE_METADATA_TABLE: fileMetadataTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda for metadata processing
    const metadataProcessorLambda = new lambda.Function(this, 'MetadataProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'metadataProcessor.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src')),
      environment: {
        FILE_METADATA_TABLE: fileMetadataTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda for EC2 processing trigger
    const processingTriggerLambda = new lambda.Function(this, 'ProcessingTriggerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'processingTrigger.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src')),
      environment: {
        LAUNCH_TEMPLATE_ID: launchTemplate.launchTemplateId || '',
        VPC_ID: vpc.vpcId,
        SUBNET_ID: vpc.privateSubnets.length > 0 ? vpc.privateSubnets[0].subnetId : '',
        SECURITY_GROUP_ID: ec2SecurityGroup.securityGroupId,
        FILE_METADATA_TABLE: fileMetadataTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda for notifications
    const notificationLambda = new lambda.Function(this, 'NotificationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'notification.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src')),
      environment: {
        FILE_METADATA_TABLE: fileMetadataTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Connect DynamoDB stream to processing trigger Lambda
    fileMetadataTable.grantStreamRead(processingTriggerLambda);
    const eventSource = new lambdaEventSources.DynamoEventSource(fileMetadataTable, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 5,
      retryAttempts: 3,
    });
    processingTriggerLambda.addEventSource(eventSource);

    // Grant permissions to Lambdas
    storageBucket.grantReadWrite(fileUploadLambda);
    fileMetadataTable.grantReadWriteData(fileUploadLambda);
    fileMetadataTable.grantReadWriteData(metadataProcessorLambda);
    processingResultsTable.grantReadWriteData(notificationLambda);

    // Grant EC2 launch permissions to processing trigger Lambda
    processingTriggerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ec2:RunInstances', 'ec2:CreateTags'],
        resources: ['*'],
      })
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'FileProcessingApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Cognito authorizer for API Gateway
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // API Gateway routes
    const filesResource = api.root.addResource('files');
    
    // POST /files - Upload file
    filesResource.addMethod('POST', new apigateway.LambdaIntegration(fileUploadLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    
    // GET /files - List files
    filesResource.addMethod('GET', new apigateway.LambdaIntegration(metadataProcessorLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Single file resource
    const fileResource = filesResource.addResource('{fileId}');

    // GET /files/{fileId} - Get file details
    fileResource.addMethod('GET', new apigateway.LambdaIntegration(metadataProcessorLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Deploy React app to S3 (this will be enabled later when we have a build)
    /*
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/build'))],
      destinationBucket: frontendBucket,
    });
    */

    // Outputs
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: frontendBucket.bucketWebsiteUrl,
      description: 'URL for the frontend website',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: storageBucket.bucketName,
      description: 'S3 Bucket for file storage',
    });
  }
}
