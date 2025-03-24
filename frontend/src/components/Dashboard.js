import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from 'aws-amplify';
import '../styles/Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    uploaded: 0,
    processing: 0,
    completed: 0,
    error: 0
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's files
        const response = await API.get('fileProcessingApi', '/files', {
          queryStringParameters: {
            userId: user.username
          }
        });
        
        if (response && response.files) {
          // Calculate stats
          const totalFiles = response.files.length;
          const uploaded = response.files.filter(file => file.status === 'UPLOADED').length;
          const processing = response.files.filter(file => file.status === 'PROCESSING').length;
          const completed = response.files.filter(file => file.status === 'COMPLETED').length;
          const error = response.files.filter(file => file.status === 'ERROR').length;
          
          setStats({
            totalFiles,
            uploaded,
            processing,
            completed,
            error
          });
          
          // Get 5 most recent files
          const sorted = [...response.files].sort((a, b) => 
            new Date(b.uploadDate) - new Date(a.uploadDate)
          );
          setRecentFiles(sorted.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user.username]);

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="alert alert-danger">
          {error}
        </div>
        <div className="action-buttons">
          <Link to="/upload" className="btn btn-primary">Upload New File</Link>
          <Link to="/files" className="btn btn-secondary">View All Files</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {user.attributes?.given_name || user.username}!</p>
      </div>
      
      <div className="stats-cards">
        <div className="stat-card">
          <h3>{stats.totalFiles}</h3>
          <p>Total Files</p>
        </div>
        <div className="stat-card uploaded">
          <h3>{stats.uploaded}</h3>
          <p>Uploaded</p>
        </div>
        <div className="stat-card processing">
          <h3>{stats.processing}</h3>
          <p>Processing</p>
        </div>
        <div className="stat-card completed">
          <h3>{stats.completed}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card error">
          <h3>{stats.error}</h3>
          <p>Error</p>
        </div>
      </div>
      
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Recent Files</h3>
          <Link to="/files" className="view-all">View All</Link>
        </div>
        
        {recentFiles.length === 0 ? (
          <div className="no-files">
            <p>No files uploaded yet. Upload your first file to get started!</p>
            <Link to="/upload" className="btn btn-primary">Upload File</Link>
          </div>
        ) : (
          <div className="recent-files">
            <div className="file-list-header">
              <div className="file-name">File Name</div>
              <div className="file-date">Uploaded</div>
              <div className="file-status">Status</div>
            </div>
            
            {recentFiles.map(file => (
              <Link to={`/files/${file.fileId}`} className="file-item" key={file.fileId}>
                <div className="file-name">{file.fileName}</div>
                <div className="file-date">{new Date(file.uploadDate).toLocaleString()}</div>
                <div className={`file-status status-${file.status.toLowerCase()}`}>
                  {file.status}
                  {file.status === 'PROCESSING' && <div className="processing-spinner"></div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <div className="action-buttons">
        <Link to="/upload" className="btn btn-primary">Upload New File</Link>
        <Link to="/files" className="btn btn-secondary">View All Files</Link>
      </div>
    </div>
  );
};

export default Dashboard; 