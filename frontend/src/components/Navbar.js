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
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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

