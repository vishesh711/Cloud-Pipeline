import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@aws-amplify/auth';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign in with Amplify Auth
      await Auth.signIn(formData.email, formData.password);
      
      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      console.error('Error signing in:', err);
      
      // Handle different error types
      if (err.code === 'UserNotConfirmedException') {
        setError('Please confirm your account through the verification email.');
      } else if (err.code === 'PasswordResetRequiredException') {
        setError('You need to reset your password. Please check your email.');
        navigate('/forgot-password');
      } else if (err.code === 'NotAuthorizedException') {
        setError('Incorrect email or password.');
      } else if (err.code === 'UserNotFoundException') {
        setError('User does not exist.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Sign In</h2>
          <p>Sign in to your account to manage your files</p>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </div>

      <div className="auth-info">
        <h3>File Processing System</h3>
        <ul>
          <li><i className="fas fa-check-circle"></i> Upload and process files securely</li>
          <li><i className="fas fa-check-circle"></i> Track the status of your file processing</li>
          <li><i className="fas fa-check-circle"></i> Advanced file management features</li>
          <li><i className="fas fa-check-circle"></i> Secure cloud storage with AWS</li>
        </ul>
      </div>
    </div>
  );
};

export default Login; 