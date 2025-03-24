const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Get HTTP method and path parameters
    const httpMethod = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const queryParameters = event.queryStringParameters || {};
    
    // Get user ID from the query parameters or from Cognito authorizer
    const userId = queryParameters.userId || 
      (event.requestContext.authorizer?.claims?.sub || 
       event.requestContext.authorizer?.claims?.['cognito:username']);
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'User ID is required' 
        })
      };
    }
    
    // Handle based on HTTP method and path
    if (httpMethod === 'GET') {
      // If fileId is provided in path, get a specific file
      if (pathParameters.fileId) {
        return await getFileMetadata(pathParameters.fileId);
      } 
      // Otherwise list files for the user
      else {
        return await listUserFiles(userId);
      }
    }
    
    // Default response for unsupported methods
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Method not allowed' 
      })
    };
  } catch (error) {
    console.error('Error processing metadata request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error processing metadata request',
        error: error.message
      })
    };
  }
};

/**
 * Get metadata for a specific file
 */
async function getFileMetadata(fileId) {
  const result = await dynamoDB.query({
    TableName: process.env.FILE_METADATA_TABLE,
    KeyConditionExpression: 'fileId = :fileId',
    ExpressionAttributeValues: {
      ':fileId': fileId
    },
    Limit: 1
  }).promise();
  
  if (result.Items && result.Items.length > 0) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: result.Items[0]
      })
    };
  } else {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'File not found'
      })
    };
  }
}

/**
 * List files for a specific user
 */
async function listUserFiles(userId) {
  // Query the GSI to efficiently get files by user
  const result = await dynamoDB.query({
    TableName: process.env.FILE_METADATA_TABLE,
    IndexName: 'userIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }).promise();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: result.Items || []
    })
  };
} 