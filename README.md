# CloudPipeline: Event-Driven Serverless Document Processing Platform

A scalable, event-driven web application built using AWS services with infrastructure defined as code through AWS CDK in TypeScript.

## What Problem Does This Solve?

In today's digital world, businesses and individuals frequently need to process large files - whether they're videos, images, documents, or datasets. Processing these files can be:

- **Time-consuming**: Large files require significant computing power
- **Expensive**: Running powerful servers 24/7 is costly
- **Complex**: Building a system that scales with demand is challenging
- **Unreliable**: Without proper architecture, processing can fail or slow down

This project solves these problems by creating a cloud-based file processing system that's scalable, cost-effective, and reliable.

## How It Works

Our solution works through these simple steps:

1. **User uploads a file**: Through an easy-to-use web interface
2. **File is stored securely**: In Amazon S3 cloud storage
3. **System analyzes the file**: Determines how much processing power is needed
4. **Processing begins automatically**: 
   - Small files are processed immediately using serverless functions
   - Large files trigger specialized computing resources that shut down when done
5. **User receives updates**: Real-time status updates show processing progress
6. **Results are available**: Processed files can be accessed through the same interface

This approach means you only pay for the computing power you actually use, the system can handle many files at once, and everything happens automatically.

## Architecture Overview

This project demonstrates a modern cloud architecture with several key components:

- **Frontend**: React-based SPA for user interface and file uploads
- **Backend**: Serverless functions using AWS Lambda
- **API Layer**: REST API with API Gateway
- **Storage**: S3 for file storage, DynamoDB for metadata
- **Event-Driven Processing**: DynamoDB Streams to trigger additional processing
- **Compute Layer**: EC2 instances for intensive compute operations
- **Authentication**: Secure user management with Amazon Cognito

## Key Features

- Secure file upload and processing
- Real-time status updates
- Scalable event-driven architecture
- Dynamic allocation of computing resources based on workload
- Infrastructure as Code (IaC) deployment

## Project Structure

```
/
├── cdk/                # Infrastructure as Code (AWS CDK)
├── backend/            # Lambda functions and backend code
├── frontend/           # React application
└── scripts/            # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- AWS CLI configured with appropriate permissions
- AWS CDK installed globally
- An AWS account

### Step-by-Step Installation Guide

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/Full-Stack-AWS-Project.git
   cd Full-Stack-AWS-Project
   ```

2. **Set up AWS credentials**
   
   If you haven't configured AWS CLI yet:
   ```
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, default region (e.g., us-east-1), and output format (json).

3. **Install dependencies for each component**

   ```
   # Install CDK dependencies
   cd cdk
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Create the AWS configuration file**
   
   Create a file at `frontend/src/aws-exports.js` with the following content (you'll update this after deploying the backend):
   ```javascript
   const awsconfig = {
     Auth: {
       region: 'us-east-1', // Update with your region
       userPoolId: 'YOUR_USER_POOL_ID', // Will be updated after deployment
       userPoolWebClientId: 'YOUR_CLIENT_ID', // Will be updated after deployment
     },
     API: {
       endpoints: [
         {
           name: 'fileProcessingApi',
           endpoint: 'YOUR_API_ENDPOINT', // Will be updated after deployment
         },
       ],
     },
   };
   
   export default awsconfig;
   ```

5. **Deploy the backend infrastructure**
   ```
   cd cdk
   cdk bootstrap  # Only needed first time using CDK in an account/region
   cdk deploy
   ```
   
   This will create all necessary AWS resources and output the following values that you'll need:
   - User Pool ID
   - User Pool Client ID
   - API Gateway endpoint URL

6. **Update the frontend configuration**
   
   Update the `frontend/src/aws-exports.js` file with the values from the previous step.

7. **Start the frontend application for local development**
   ```
   cd frontend
   npm start
   ```
   
   This will open the application in your browser at http://localhost:3000

8. **Create a user account**
   - Go to the application
   - Click "Sign Up" and create an account
   - Verify your email address with the code sent to you

9. **Start using the application**
   - Upload files
   - View processing status
   - Download processed results

### Deploying to Production

For a production deployment, build the frontend and deploy it to an S3 bucket with CloudFront:

```
cd frontend
npm run build

# Deploy the built assets (requires additional CloudFront/S3 setup in CDK)
cd ../cdk
cdk deploy --context stage=prod
```

## Development

- **CDK**: Define and deploy AWS infrastructure
- **Backend**: Implement Lambda functions for file processing
- **Frontend**: Develop the React application for user interaction

## Architecture Diagram

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│            │     │            │     │            │
│   React    │────▶│    API     │────▶│   Lambda   │
│  Frontend  │     │  Gateway   │     │ Functions  │
│            │     │            │     │            │
└────────────┘     └────────────┘     └────────────┘
                                           │
                     ┌────────────┐       │
                     │            │       │
                     │     S3     │◀──────┘
                     │            │       │
                     └────────────┘       │
                                          ▼
┌────────────┐     ┌────────────┐     ┌────────────┐
│            │     │            │     │            │
│    EC2     │◀───▶│  DynamoDB  │◀────│  DynamoDB  │
│ Processing │     │            │     │  Streams   │
│            │     │            │     │            │
└────────────┘     └────────────┘     └────────────┘
```

## Troubleshooting

- **AWS Deployment Issues**: Check the CloudFormation console for error messages
- **Frontend Connection Errors**: Verify your AWS configuration in aws-exports.js
- **File Upload Problems**: Check the S3 bucket permissions
- **Processing Errors**: Check the CloudWatch logs for the Lambda functions and EC2 instances

## License

MIT
