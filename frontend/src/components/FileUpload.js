import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from 'aws-amplify';
import '../styles/FileUpload.css';

const FileUpload = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
    }
  };

  const simulateProgress = () => {
    // Simulate progress updates
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 90) {
        clearInterval(interval);
        setUploadProgress(90); // We'll set it to 100 when the upload is complete
      } else {
        setUploadProgress(progress);
      }
    }, 500);
    return interval;
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);
      
      // Start progress simulation
      const progressInterval = simulateProgress();
      
      // Read file as base64
      const fileContent = await readFileAsBase64(selectedFile);
      
      // Prepare upload data
      const uploadData = {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        userId: user.username,
        fileContent
      };
      
      // Call API to upload file
      const response = await API.post('fileProcessingApi', '/files', {
        body: uploadData
      });
      
      // Clear progress simulation and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Set success state and reset form
      setSuccess(true);
      
      // Navigate to file list after short delay
      setTimeout(() => {
        navigate('/files');
      }, 2000);
      
    } catch (err) {
      setError('Error uploading file: ' + (err.message || 'Unknown error'));
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="file-upload">
      <div className="file-upload-header">
        <h2>Upload File</h2>
        <p>Upload files for processing. Files over 5MB will be processed by EC2 instances.</p>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          File uploaded successfully! Redirecting to file list...
        </div>
      )}
      
      <div 
        className={`upload-area ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-input" 
          onChange={handleFileChange} 
          className="file-input"
        />
        
        {!selectedFile ? (
          <div className="upload-prompt">
            <div className="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p>Drag and drop a file here, or <label htmlFor="file-input" className="browse-link">browse</label></p>
            <p className="upload-hint">Supported file types: Images, PDF, Word, Excel, and more</p>
          </div>
        ) : (
          <div className="file-details">
            <div className="file-info">
              <div className="file-name-section">
                <span className="file-icon">
                  {selectedFile.type.includes('image') ? '🖼️' : 
                   selectedFile.type.includes('pdf') ? '📄' :
                   selectedFile.type.includes('spreadsheet') || selectedFile.type.includes('excel') ? '📊' :
                   selectedFile.type.includes('word') || selectedFile.type.includes('document') ? '📝' : '📁'}
                </span>
                <div className="file-name-size">
                  <div className="selected-filename">{selectedFile.name}</div>
                  <div className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</div>
                </div>
              </div>
              
              <div className="processing-type">
                {selectedFile.size > 5000000 ? (
                  <span className="heavy-processing">Heavy Processing (EC2)</span>
                ) : (
                  <span className="light-processing">Light Processing (Lambda)</span>
                )}
              </div>
            </div>
            
            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{Math.round(uploadProgress)}%</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="upload-actions">
        {selectedFile && !success && (
          <button 
            className="btn btn-danger cancel-button" 
            onClick={handleCancel}
            disabled={uploading}
          >
            Cancel
          </button>
        )}
        
        <button 
          className="btn btn-primary upload-button" 
          onClick={handleUpload}
          disabled={!selectedFile || uploading || success}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      
      <div className="upload-info-cards">
        <div className="info-card">
          <h3>Light Processing</h3>
          <p>Files under 5MB are processed directly by AWS Lambda functions.</p>
          <ul>
            <li>Fast processing</li>
            <li>Automatic scaling</li>
            <li>Suitable for small files</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>Heavy Processing</h3>
          <p>Files over 5MB are processed by dedicated EC2 instances.</p>
          <ul>
            <li>Powerful compute resources</li>
            <li>Handles large files efficiently</li>
            <li>Optimized for intensive processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 