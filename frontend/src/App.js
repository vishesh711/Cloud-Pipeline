import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Auth } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';
import awsconfig from './aws-exports';

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FileDetails from './components/FileDetails';
import Settings from './components/Settings';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';

// Styles
import './styles/App.css';

// Configure Amplify
Amplify.configure(awsconfig);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthState();

    // Listen for auth events
    const listener = Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          setIsAuthenticated(true);
          setUser(data);
          break;
        case 'signOut':
          setIsAuthenticated(false);
          setUser(null);
          break;
        case 'customOAuthState':
          console.log('customOAuthState', data);
          break;
        default:
          break;
      }
    });

    return () => listener();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setIsAuthenticated(true);
      setUser(currentUser);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Route protection component
  const ProtectedRoute = ({ children }) => {
    if (isAuthLoading) {
      return <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="app">
        <Header isAuthenticated={isAuthenticated} user={user} />
        
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/upload" element={
              <ProtectedRoute>
                <FileUpload />
              </ProtectedRoute>
            } />
            
            <Route path="/files" element={
              <ProtectedRoute>
                <FileList />
              </ProtectedRoute>
            } />
            
            <Route path="/files/:fileId" element={
              <ProtectedRoute>
                <FileDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* Redirect root to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            
            {/* 404 - Redirect to dashboard if authenticated, otherwise to login */}
            <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} File Processing System. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App; 