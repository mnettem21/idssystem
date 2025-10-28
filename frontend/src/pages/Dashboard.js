import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import '../App.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    pending: 0,
    failed: 0
  });

  useEffect(() => {
    if (user) {
      fetchExperiments();
    }
  }, [user]);

  const fetchExperiments = async () => {
    try {
      const response = await api.get('/experiments');
      
      setExperiments(response.data.experiments || []);
      
      // Calculate stats
      const total = response.data.experiments.length;
      const completed = response.data.experiments.filter(e => e.status === 'completed').length;
      const running = response.data.experiments.filter(e => e.status === 'running').length;
      const pending = response.data.experiments.filter(e => e.status === 'pending').length;
      const failed = response.data.experiments.filter(e => e.status === 'failed').length;
      
      setStats({ total, completed, running, pending, failed });
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentExperiments = () => {
    return experiments.slice(0, 5);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="spinner"></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#3498db' }}>{stats.total}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Total Experiments</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#27ae60' }}>{stats.completed}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Completed</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#3498db' }}>{stats.running}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Running</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#f39c12' }}>{stats.pending}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>Pending</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2>Quick Actions</h2>
          <Link to="/experiments/new" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Create New Experiment
          </Link>
          <Link to="/experiments" className="btn btn-secondary">
            View All Experiments
          </Link>
        </div>

        {/* Recent Experiments */}
        <div className="card">
          <h2>Recent Experiments</h2>
          {getRecentExperiments().length === 0 ? (
            <p>No experiments yet. Create your first experiment!</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Algorithm</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getRecentExperiments().map(experiment => (
                  <tr key={experiment.id}>
                    <td>{experiment.name}</td>
                    <td>{experiment.algorithm}</td>
                    <td>
                      <span className={`status-badge status-${experiment.status}`}>
                        {experiment.status}
                      </span>
                    </td>
                    <td>{new Date(experiment.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/experiments/${experiment.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

