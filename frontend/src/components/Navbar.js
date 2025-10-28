import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      // Clear any cached user data
      window.localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
      // Force page reload to ensure clean state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, navigate to login
      window.location.href = '/login';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
          IDS Research Platform
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/experiments">Experiments</Link>
        <Link to="/comparisons">Comparisons</Link>
        {user && (
          <span className="navbar-user">
            {user.email}
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

