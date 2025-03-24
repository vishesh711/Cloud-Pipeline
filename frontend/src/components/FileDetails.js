import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API } from '@aws-amplify/api';
import '../styles/FileDetails.css';

const FileDetails = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  useEffect(() => {
    fetchFileDetails();
    
    // Set up polling for status updates if the file is in processing state
    let intervalId;
    if (file && file.status === 'processing') {
      intervalId = setInterval(fetchFileDetails, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fileId, file?.status]);
  
  const fetchFileDetails = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      const response = await API.get('fileProcessingApi', `/files/${fileId}`);
      setFile(response);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching file details:', err);
      setError('Unable to load file details. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleDeleteFile = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    try {
      setLoading(true);
      // Replace with actual API call
      await API.del('fileProcessingApi', `/files/${fileId}`);
      navigate('/files');
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Unable to delete file. Please try again later.');
      setLoading(false);
      setConfirmDelete(false);
    }
  };
  
  const cancelDelete = () => {
    setConfirmDelete(false);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getFileTypeIcon = (fileType) => {
    // Return icon class based on file type
    if (fileType.includes('image')) return 'fa-file-image';
    if (fileType.includes('video')) return 'fa-file-video';
    if (fileType.includes('audio')) return 'fa-file-audio';
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
    if (fileType.includes('zip') || fileType.includes('compressed')) return 'fa-file-archive';
    return 'fa-file';
  };
  
  if (loading && !file) {
    return (
      <div className="file-details-container loading">
        <div className="loading-spinner"></div>
        <p>Loading file details...</p>
      </div>
    );
  }
  
  if (error && !file) {
    return (
      <div className="file-details-container error">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Error</h3>
          <p>{error}</p>
          <Link to="/files" className="back-btn">
            <i className="fas fa-arrow-left"></i> Back to Files
          </Link>
        </div>
      </div>
    );
  }
  
  if (!file) {
    return (
      <div className="file-details-container not-found">
        <div className="not-found-message">
          <i className="fas fa-search"></i>
          <h3>File Not Found</h3>
          <p>The requested file could not be found or may have been deleted.</p>
          <Link to="/files" className="back-btn">
            <i className="fas fa-arrow-left"></i> Back to Files
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="file-details-container">
      <div className="file-details-header">
        <Link to="/files" className="back-btn">
          <i className="fas fa-arrow-left"></i> Back to Files
        </Link>
        <div className="file-actions">
          {confirmDelete ? (
            <div className="confirm-delete">
              <span>Are you sure?</span>
              <button onClick={handleDeleteFile} className="confirm-btn">Yes, Delete</button>
              <button onClick={cancelDelete} className="cancel-btn">Cancel</button>
            </div>
          ) : (
            <button onClick={handleDeleteFile} className="delete-btn">
              <i className="fas fa-trash-alt"></i> Delete File
            </button>
          )}
        </div>
      </div>
      
      <div className="file-details-card">
        <div className="file-details-main">
          <div className="file-icon-large">
            <i className={`fas ${getFileTypeIcon(file.fileType)}`}></i>
          </div>
          <div className="file-info-main">
            <h2 className="file-name">{file.fileName}</h2>
            <div className={`status-badge ${file.status}`}>
              {file.status === 'processing' ? (
                <>
                  <span className="processing-indicator"></span>
                  Processing
                </>
              ) : file.status}
            </div>
          </div>
        </div>
        
        <div className="file-details-grid">
          <div className="detail-item">
            <span className="detail-label">File ID</span>
            <span className="detail-value">{file.fileId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">File Type</span>
            <span className="detail-value">{file.fileType}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Size</span>
            <span className="detail-value">{formatFileSize(file.fileSize)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Uploaded</span>
            <span className="detail-value">{formatDate(file.uploadDate)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last Updated</span>
            <span className="detail-value">{formatDate(file.lastUpdated)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Processing Level</span>
            <span className="detail-value">{file.fileSize > 5 * 1024 * 1024 ? 'Heavy Processing' : 'Light Processing'}</span>
          </div>
        </div>
        
        {file.status === 'completed' && (
          <div className="file-preview-section">
            <h3>File Preview</h3>
            <div className="preview-container">
              {file.fileType.includes('image') ? (
                <img src={file.previewUrl || file.url} alt={file.fileName} className="file-preview-image" />
              ) : (
                <div className="no-preview">
                  <i className="fas fa-eye-slash"></i>
                  <p>No preview available for this file type</p>
                </div>
              )}
            </div>
            <a href={file.url} download={file.fileName} className="download-btn">
              <i className="fas fa-download"></i> Download File
            </a>
          </div>
        )}
        
        {file.status === 'error' && (
          <div className="error-details">
            <h3>Error Details</h3>
            <div className="error-message-details">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{file.errorMessage || 'An unknown error occurred during file processing.'}</p>
            </div>
            <div className="error-actions">
              <button className="retry-btn">
                <i className="fas fa-redo"></i> Retry Processing
              </button>
            </div>
          </div>
        )}
        
        {file.status === 'processing' && (
          <div className="processing-details">
            <h3>Processing Information</h3>
            <div className="processing-progress">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${file.processingProgress || 0}%` }}
                ></div>
              </div>
              <span className="progress-text">{file.processingProgress || 0}% Complete</span>
            </div>
            <p className="processing-message">
              Your file is currently being processed. This may take a few minutes depending on the file size and complexity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDetails; 