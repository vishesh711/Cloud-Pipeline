import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@aws-amplify/auth';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 for email entry, 2 for code verification
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await Auth.forgotPassword(email);
      setStep(2);
    } catch (err) {
      console.error('Error requesting password reset:', err);
      
      if (err.code === 'UserNotFoundException') {
        setError('No account found with this email address.');
      } else if (err.code === 'LimitExceededException') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Failed to request password reset. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      await Auth.forgotPasswordSubmit(email, verificationCode, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error resetting password:', err);
      
      if (err.code === 'CodeMismatchException') {
        setError('Invalid verification code. Please try again.');
      } else if (err.code === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
        setStep(1);
      } else if (err.code === 'InvalidPasswordException') {
        setError('Password does not meet the requirements. It must contain at least 8 characters, including numbers, special characters, uppercase and lowercase letters.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Password Reset Successful</h2>
            <p>Your password has been reset successfully.</p>
          </div>
          <div className="auth-success">
            <i className="fas fa-check-circle"></i>
            <p>You will be redirected to the login page in a few seconds...</p>
          </div>
          <div className="auth-footer">
            <p>
              <Link to="/login">Go to Login</Link>
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
          <h2>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
          <p>
            {step === 1
              ? 'Enter your email to receive a verification code'
              : 'Enter the verification code and your new password'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                required
                placeholder="Enter verification code"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={handleNewPasswordChange}
                required
                placeholder="Enter new password"
                minLength="8"
              />
              <small>Password must be at least 8 characters long</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {step === 2 && (
            <p>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setStep(1);
              }}>
                Request a new code
              </a>
            </p>
          )}
          <p>Remember your password? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 