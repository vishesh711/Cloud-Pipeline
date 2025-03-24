const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ec2 = new AWS.EC2();

// Simple in-memory tracking for demo purposes (use a proper queue in production)
const activeInstances = new Set();
const MAX_INSTANCES = 5;

exports.handler = async (event) => {
  try {
    console.log('Received DynamoDB Stream event:', JSON.stringify(event, null, 2));
    
    // Process each record from the DynamoDB stream
    for (const record of event.Records) {
      // Only process new items or modifications
      if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
        continue;
      }
      
      // Get the new image (the current state of the item)
      const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      
      // Check if this item requires heavy processing
      if (newImage.status === 'UPLOADED' && newImage.processingRequired === 'HEAVY') {
        console.log(`File ${newImage.fileId} requires heavy processing, launching EC2 instance`);
        
        // Update status to PROCESSING
        await updateFileStatus(newImage.fileId, newImage.uploadDate, 'PROCESSING');
        
        // Check if we need to launch a new EC2 instance
        if (activeInstances.size < MAX_INSTANCES) {
          // Launch a new EC2 instance for processing
          await launchProcessingInstance(newImage.fileId);
        } else {
          console.log('Maximum number of processing instances already running');
          // In a real system, you would queue this task for when an instance becomes available
        }
      } else if (newImage.status === 'UPLOADED' && newImage.processingRequired === 'LIGHT') {
        console.log(`File ${newImage.fileId} requires light processing, handling in Lambda`);
        
        // Update status to PROCESSING
        await updateFileStatus(newImage.fileId, newImage.uploadDate, 'PROCESSING');
        
        // For light processing, we'll just simulate processing and update status to COMPLETED
        // In a real app, this could invoke another Lambda for actual processing
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
        
        await updateFileStatus(newImage.fileId, newImage.uploadDate, 'COMPLETED');
      }
    }
    
    return { status: 'SUCCESS' };
  } catch (error) {
    console.error('Error processing DynamoDB stream event:', error);
    return { status: 'ERROR', error: error.message };
  }
};

/**
 * Update the status of a file in DynamoDB
 */
async function updateFileStatus(fileId, uploadDate, status) {
  try {
    await dynamoDB.update({
      TableName: process.env.FILE_METADATA_TABLE,
      Key: { 
        fileId,
        uploadDate
      },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    }).promise();
    
    console.log(`Updated status for file ${fileId} to ${status}`);
  } catch (error) {
    console.error(`Error updating status for file ${fileId}:`, error);
    throw error;
  }
}

/**
 * Launch an EC2 instance to process a file
 */
async function launchProcessingInstance(fileId) {
  try {
    // Prepare EC2 launch parameters
    const params = {
      LaunchTemplate: {
        LaunchTemplateId: process.env.LAUNCH_TEMPLATE_ID
      },
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            {
              Key: 'Name',
              Value: `File-Processor-${fileId}`
            },
            {
              Key: 'ProcessingFile',
              Value: fileId
            }
          ]
        }
      ]
    };
    
    // Launch the EC2 instance
    const result = await ec2.runInstances(params).promise();
    const instanceId = result.Instances[0].InstanceId;
    
    console.log(`Launched EC2 instance ${instanceId} for file ${fileId}`);
    
    // Add to tracking set
    activeInstances.add(instanceId);
    
    // In a real system, you would implement a proper tracking mechanism
    // For demo purposes, we'll remove from tracking after a fixed time
    setTimeout(() => {
      activeInstances.delete(instanceId);
      console.log(`Removed instance ${instanceId} from tracking`);
    }, 5 * 60 * 1000); // 5 minutes
    
    return instanceId;
  } catch (error) {
    console.error('Error launching EC2 instance:', error);
    throw error;
  }
} 