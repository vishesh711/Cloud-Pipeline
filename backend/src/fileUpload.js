const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Parse the incoming request
    const requestBody = JSON.parse(event.body);
    const { fileName, fileType, fileSize, userId, fileContent } = requestBody;
    
    // Validate required fields
    if (!fileName || !fileType || !userId || !fileContent) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Missing required fields' 
        })
      };
    }
    
    // Generate unique ID for the file
    const fileId = uuidv4();
    const uploadDate = new Date().toISOString();
    
    // Decode base64 content
    const decodedFile = Buffer.from(
      fileContent.replace(/^data:.*?;base64,/, ''),
      'base64'
    );
    
    // Upload to S3
    const s3Key = `uploads/${userId}/${fileId}-${fileName}`;
    await s3.putObject({
      Bucket: process.env.STORAGE_BUCKET_NAME,
      Key: s3Key,
      Body: decodedFile,
      ContentType: fileType
    }).promise();
    
    // Store metadata in DynamoDB
    const metadataItem = {
      fileId,
      userId,
      fileName,
      fileType,
      fileSize: fileSize || decodedFile.length,
      s3Key,
      uploadDate,
      status: 'UPLOADED',
      processingRequired: fileSize > 5000000 ? 'HEAVY' : 'LIGHT', // Determine processing needs
    };
    
    await dynamoDB.put({
      TableName: process.env.FILE_METADATA_TABLE,
      Item: metadataItem
    }).promise();
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'File uploaded successfully',
        fileId,
        s3Key,
        status: 'UPLOADED'
      })
    };
  } catch (error) {
    console.error('Error processing file upload:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error processing file upload',
        error: error.message
      })
    };
  }
}; 