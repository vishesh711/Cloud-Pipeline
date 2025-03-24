// This is a placeholder for AWS Amplify configuration
// Replace these values with the actual outputs from your CDK deployment

const awsconfig = {
  Auth: {
    region: 'us-east-1', // Change to your region
    userPoolId: 'us-east-1_EXAMPLE', // Replace with your User Pool ID
    userPoolWebClientId: 'abcdefghijklmnopqrstuvwxyz', // Replace with your App Client ID
  },
  API: {
    endpoints: [
      {
        name: 'fileProcessingApi',
        endpoint: 'https://example.execute-api.us-east-1.amazonaws.com/prod', // Replace with your API Gateway URL
      },
    ],
  },
};

export default awsconfig; 