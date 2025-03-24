import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '@aws-amplify/api';
import '../styles/FileList.css';

const FileList = ({ user }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFiles();
    
    // Set up polling for status updates every 10 seconds
    const interval = setInterval(() => {
      fetchFiles(false);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchFiles = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await API.get('fileProcessingApi', '/files', {
        queryStringParameters: {
          userId: user.username
        }
      });
      
      if (response && response.files) {
        setFiles(response.files);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching files:', err);
      if (showLoading) {
        setError('Failed to load files. Please try again.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter files based on status and search term
  const filteredFiles = files.filter(file => {
    const matchesStatus = filter === 'all' || file.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.fileType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Sort filtered files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let result = 0;
    
    switch (sortBy) {
      case 'date':
        result = new Date(a.uploadDate) - new Date(b.uploadDate);
        break;
      case 'name':
        result = a.fileName.localeCompare(b.fileName);
        break;
      case 'size':
        result = a.fileSize - b.fileSize;
        break;
      case 'type':
        result = a.fileType.localeCompare(b.fileType);
        break;
      default:
        result = 0;
    }
    
    return sortOrder === 'asc' ? result : -result;
  });

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  // Get file type icon
  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) {
      return '🖼️';
    } else if (fileType.includes('pdf')) {
      return '📄';
    } else if (
      fileType.includes('spreadsheet') || 
      fileType.includes('excel') || 
      fileType.includes('csv')
    ) {
      return '📊';
    } else if (
      fileType.includes('document') || 
      fileType.includes('word')
    ) {
      return '📝';
    } else {
      return '📁';
    }
  };

  if (loading) {
    return (
      <div className="file-list-container loading">
        <div className="loading-spinner"></div>
        <p>Loading files...</p>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header-section">
        <h2>Your Files</h2>
        <p>Manage and view all your uploaded files</p>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <div className="file-list-actions">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="filter-sort">
          <div className="filter-control">
            <label htmlFor="filter">Status:</label>
            <select 
              id="filter" 
              value={filter} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="sort-control">
            <label htmlFor="sort">Sort by:</label>
            <select 
              id="sort" 
              value={sortBy} 
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
            
            <button 
              className="sort-order-btn"
              onClick={toggleSortOrder}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <button 
            className="refresh-btn"
            onClick={() => fetchFiles()}
            title="Refresh file list"
          >
            ↻
          </button>
        </div>
      </div>
      
      {files.length === 0 ? (
        <div className="no-files">
          <p>You haven't uploaded any files yet.</p>
          <Link to="/upload" className="btn btn-primary">Upload Your First File</Link>
        </div>
      ) : sortedFiles.length === 0 ? (
        <div className="no-results">
          <p>No files match your search criteria.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setFilter('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="file-list">
          <div className="file-table-header">
            <div className="file-cell icon-cell"></div>
            <div className="file-cell name-cell">Name</div>
            <div className="file-cell type-cell">Type</div>
            <div className="file-cell size-cell">Size</div>
            <div className="file-cell date-cell">Upload Date</div>
            <div className="file-cell status-cell">Status</div>
            <div className="file-cell actions-cell"></div>
          </div>
          
          {sortedFiles.map(file => (
            <div key={file.fileId} className="file-row">
              <div className="file-cell icon-cell">
                <span className="file-icon">{getFileIcon(file.fileType)}</span>
              </div>
              
              <div className="file-cell name-cell" title={file.fileName}>
                {file.fileName}
              </div>
              
              <div className="file-cell type-cell">
                {file.fileType.split('/').pop()}
              </div>
              
              <div className="file-cell size-cell">
                {formatFileSize(file.fileSize)}
              </div>
              
              <div className="file-cell date-cell">
                {new Date(file.uploadDate).toLocaleString()}
              </div>
              
              <div className="file-cell status-cell">
                <span className={`status-badge ${file.status.toLowerCase()}`}>
                  {file.status}
                  {file.status === 'PROCESSING' && <span className="processing-indicator"></span>}
                </span>
              </div>
              
              <div className="file-cell actions-cell">
                <Link 
                  to={`/files/${file.fileId}`} 
                  className="view-details-btn"
                  title="View details"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="file-list-footer">
        <div className="file-stats">
          <span>Total: {files.length} files</span>
          {filteredFiles.length !== files.length && (
            <span>Filtered: {filteredFiles.length} files</span>
          )}
        </div>
        
        <Link to="/upload" className="btn btn-primary">Upload New File</Link>
      </div>
    </div>
  );
};

export default FileList; 