import React, { useState, useEffect } from 'react';
import { Auth, API } from 'aws-amplify';
import '../styles/Settings.css';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form states
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    processingComplete: true,
    weeklyReports: false,
    errorAlerts: true
  });
  
  const [storagePreference, setStoragePreference] = useState('standard');
  const [autoDeleteDays, setAutoDeleteDays] = useState(30);
  
  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Get current authenticated user
      const currentUser = await Auth.currentAuthenticatedUser();
      
      // Get user attributes
      const userAttributes = await Auth.userAttributes(currentUser);
      
      // Convert attributes array to object
      const attributesObject = {};
      userAttributes.forEach(attribute => {
        attributesObject[attribute.Name] = attribute.Value;
      });
      
      setUser({
        username: currentUser.username,
        ...attributesObject
      });
      
      // Set profile form with user data
      setProfile({
        firstName: attributesObject.given_name || '',
        lastName: attributesObject.family_name || '',
        email: attributesObject.email || '',
        phone: attributesObject.phone_number || ''
      });
      
      // Fetch user preferences (This would be a real API call in a production environment)
      // Here we're just simulating with the default values
      try {
        const userPreferences = await API.get('fileProcessingApi', '/user/preferences');
        setNotifications(userPreferences.notifications);
        setStoragePreference(userPreferences.storagePreference);
        setAutoDeleteDays(userPreferences.autoDeleteDays);
      } catch (prefError) {
        console.log('Using default preference values');
        // Keep using default values if the API is not available
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Unable to load user data. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setChangePassword(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleStoragePreferenceChange = (e) => {
    setStoragePreference(e.target.value);
  };
  
  const handleAutoDeleteChange = (e) => {
    setAutoDeleteDays(parseInt(e.target.value));
  };
  
  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Update user attributes in Cognito
      const user = await Auth.currentAuthenticatedUser();
      
      const result = await Auth.updateUserAttributes(user, {
        'given_name': profile.firstName,
        'family_name': profile.lastName,
        'phone_number': profile.phone
      });
      
      // Email updates typically require verification in Cognito, so we'll skip that here
      
      setSuccess('Profile updated successfully!');
      setLoading(false);
      
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile: ' + err.message);
      setLoading(false);
    }
  };
  
  const updatePassword = async (e) => {
    e.preventDefault();
    
    if (changePassword.newPassword !== changePassword.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const user = await Auth.currentAuthenticatedUser();
      
      await Auth.changePassword(
        user,
        changePassword.currentPassword,
        changePassword.newPassword
      );
      
      setSuccess('Password updated successfully!');
      
      // Clear the password fields
      setChangePassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setLoading(false);
      
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to update password: ' + err.message);
      setLoading(false);
    }
  };
  
  const updatePreferences = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Save user preferences (This would be a real API call in a production environment)
      await API.put('fileProcessingApi', '/user/preferences', {
        body: {
          notifications,
          storagePreference,
          autoDeleteDays
        }
      });
      
      setSuccess('Preferences updated successfully!');
      setLoading(false);
      
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences: ' + err.message);
      setLoading(false);
    }
  };
  
  if (loading && !user) {
    return (
      <div className="settings-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your account settings...</p>
      </div>
    );
  }
  
  if (error && !user) {
    return (
      <div className="settings-container error">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your profile, security settings, and application preferences</p>
      </div>
      
      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <p>{success}</p>
        </div>
      )}
      
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      <div className="settings-grid">
        <div className="settings-card">
          <div className="card-header">
            <h2>
              <i className="fas fa-user"></i>
              Profile Information
            </h2>
            <p>Update your personal information</p>
          </div>
          
          <form onSubmit={updateProfile}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                disabled
                className="disabled-input"
              />
              <small>Email address cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                placeholder="+1234567890"
              />
            </div>
            
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
        
        <div className="settings-card">
          <div className="card-header">
            <h2>
              <i className="fas fa-lock"></i>
              Password & Security
            </h2>
            <p>Update your password</p>
          </div>
          
          <form onSubmit={updatePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={changePassword.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={changePassword.newPassword}
                onChange={handlePasswordChange}
                required
                minLength="8"
              />
              <small>Password must be at least 8 characters long</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={changePassword.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength="8"
              />
            </div>
            
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
        
        <div className="settings-card">
          <div className="card-header">
            <h2>
              <i className="fas fa-bell"></i>
              Notification Preferences
            </h2>
            <p>Control how and when you receive notifications</p>
          </div>
          
          <form onSubmit={updatePreferences}>
            <div className="toggle-section">
              <div className="toggle-group">
                <label htmlFor="emailNotifications" className="toggle-label">
                  Email Notifications
                  <small>Master control for all email notifications</small>
                </label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={notifications.emailNotifications}
                    onChange={handleNotificationChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-group">
                <label htmlFor="processingComplete" className="toggle-label">
                  Processing Complete Notifications
                  <small>Get notified when file processing completes</small>
                </label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="processingComplete"
                    name="processingComplete"
                    checked={notifications.processingComplete}
                    onChange={handleNotificationChange}
                    disabled={!notifications.emailNotifications}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-group">
                <label htmlFor="weeklyReports" className="toggle-label">
                  Weekly Activity Reports
                  <small>Receive a summary of your activity each week</small>
                </label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="weeklyReports"
                    name="weeklyReports"
                    checked={notifications.weeklyReports}
                    onChange={handleNotificationChange}
                    disabled={!notifications.emailNotifications}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-group">
                <label htmlFor="errorAlerts" className="toggle-label">
                  Error Alerts
                  <small>Get notified when there are processing errors</small>
                </label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="errorAlerts"
                    name="errorAlerts"
                    checked={notifications.errorAlerts}
                    onChange={handleNotificationChange}
                    disabled={!notifications.emailNotifications}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="storagePreference">Storage Preference</label>
              <select
                id="storagePreference"
                name="storagePreference"
                value={storagePreference}
                onChange={handleStoragePreferenceChange}
              >
                <option value="standard">Standard (Default)</option>
                <option value="reduced-redundancy">Reduced Redundancy (Lower Cost)</option>
                <option value="glacier">Archive Storage (Lowest Cost, Slow Retrieval)</option>
              </select>
              <small>Controls how your files are stored in the cloud</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="autoDeleteDays">Auto-Delete Files After</label>
              <select
                id="autoDeleteDays"
                name="autoDeleteDays"
                value={autoDeleteDays}
                onChange={handleAutoDeleteChange}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days (Default)</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="0">Never (keep indefinitely)</option>
              </select>
              <small>Automatically delete processed files after this period</small>
            </div>
            
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 