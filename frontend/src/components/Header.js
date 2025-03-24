import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import '../styles/Header.css';

const Header = ({ isAuthenticated, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  // Close menus when clicking outside
  const closeMenus = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  // Check if a nav link is active
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="logo">
            <i className="fas fa-cloud-upload-alt"></i>
            <span>File Processing</span>
          </Link>
        </div>

        {isAuthenticated ? (
          // Authenticated header
          <>
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>

            <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
              <ul className="nav-links">
                <li>
                  <Link 
                    to="/dashboard" 
                    className={isActive('/dashboard') ? 'active' : ''}
                    onClick={closeMenus}
                  >
                    <i className="fas fa-tachometer-alt"></i>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/upload" 
                    className={isActive('/upload') ? 'active' : ''}
                    onClick={closeMenus}
                  >
                    <i className="fas fa-upload"></i>
                    Upload
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/files" 
                    className={isActive('/files') ? 'active' : ''}
                    onClick={closeMenus}
                  >
                    <i className="fas fa-file-alt"></i>
                    Files
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="user-container">
              <button 
                className="user-button" 
                onClick={toggleUserMenu}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  {user && user.attributes && user.attributes.given_name 
                    ? user.attributes.given_name.charAt(0) + (user.attributes.family_name ? user.attributes.family_name.charAt(0) : '')
                    : 'U'
                  }
                </div>
                <div className="user-name">
                  {user && user.attributes 
                    ? `${user.attributes.given_name || ''} ${user.attributes.family_name || ''}`
                    : 'User'
                  }
                </div>
                <i className={`fas fa-chevron-${userMenuOpen ? 'up' : 'down'}`}></i>
              </button>

              <div className={`user-menu ${userMenuOpen ? 'open' : ''}`}>
                <div className="user-info">
                  <div className="user-avatar large">
                    {user && user.attributes && user.attributes.given_name 
                      ? user.attributes.given_name.charAt(0) + (user.attributes.family_name ? user.attributes.family_name.charAt(0) : '')
                      : 'U'
                    }
                  </div>
                  <div>
                    <div className="user-name">
                      {user && user.attributes 
                        ? `${user.attributes.given_name || ''} ${user.attributes.family_name || ''}`
                        : 'User'
                      }
                    </div>
                    <div className="user-email">
                      {user && user.attributes ? user.attributes.email : 'user@example.com'}
                    </div>
                  </div>
                </div>
                <ul className="user-menu-items">
                  <li>
                    <Link to="/settings" onClick={closeMenus}>
                      <i className="fas fa-cog"></i>
                      Settings
                    </Link>
                  </li>
                  <li className="divider"></li>
                  <li>
                    <button onClick={handleSignOut} className="sign-out-button">
                      <i className="fas fa-sign-out-alt"></i>
                      Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          // Non-authenticated header
          <div className="auth-links">
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
            <Link to="/signup" className="auth-button">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 