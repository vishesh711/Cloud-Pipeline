import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import '../styles/Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleVerificationChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Amplify Auth
      await Auth.signUp({
        username: formData.email,
        password: formData.password,
        attributes: {
          email: formData.email,
          given_name: formData.firstName,
          family_name: formData.lastName
        }
      });

      // Set verification sent flag to true
      setVerificationSent(true);
      setLoading(false);
    } catch (err) {
      console.error('Error signing up:', err);
      
      // Handle different error types
      if (err.code === 'UsernameExistsException') {
        setError('An account with this email already exists.');
      } else if (err.code === 'InvalidPasswordException') {
        setError('Password does not meet the requirements. It must contain at least 8 characters, including numbers, special characters, uppercase and lowercase letters.');
      } else {
        setError('Failed to sign up. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setVerificationError(null);
    setVerificationLoading(true);

    try {
      // Confirm sign up with verification code
      await Auth.confirmSignUp(formData.email, verificationCode);
      
      // Sign in user after successful verification
      await Auth.signIn(formData.email, formData.password);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error verifying account:', err);
      
      // Handle different error types
      if (err.code === 'CodeMismatchException') {
        setVerificationError('Invalid verification code. Please try again.');
      } else if (err.code === 'ExpiredCodeException') {
        setVerificationError('Verification code has expired. Please request a new one.');
      } else {
        setVerificationError('Failed to verify account. Please try again.');
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      await Auth.resendSignUp(formData.email);
      alert('Verification code has been resent to your email.');
    } catch (err) {
      console.error('Error resending code:', err);
      setVerificationError('Failed to resend verification code. Please try again.');
    }
  };

  if (verificationSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Verify Your Account</h2>
            <p>We have sent a verification code to your email. Please enter it below.</p>
          </div>

          {verificationError && (
            <div className="auth-error">
              <i className="fas fa-exclamation-circle"></i>
              <p>{verificationError}</p>
            </div>
          )}

          <form onSubmit={handleVerification}>
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={handleVerificationChange}
                required
                placeholder="Enter verification code"
              />
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={verificationLoading}
            >
              {verificationLoading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Didn't receive a code? <a href="#" onClick={resendVerificationCode}>Resend code</a>
            </p>
            <p>
              <Link to="/login">Back to login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create an Account</h2>
          <p>Sign up to start processing your files</p>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Enter your last name"
              />
            </div>
          </div>

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
              placeholder="Create a password"
              minLength="8"
            />
            <small>Password must be at least 8 characters long</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

      <div className="auth-info">
        <h3>Why Join Our Platform?</h3>
        <ul>
          <li><i className="fas fa-check-circle"></i> Fast and efficient file processing</li>
          <li><i className="fas fa-check-circle"></i> Secure cloud storage with AWS</li>
          <li><i className="fas fa-check-circle"></i> Advanced analytics and processing capabilities</li>
          <li><i className="fas fa-check-circle"></i> Easy sharing and collaboration</li>
        </ul>
      </div>
    </div>
  );
};

export default Signup; 