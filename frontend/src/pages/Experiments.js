import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Experiments = () => {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExperiments();
    }
  }, [user]);

  const fetchExperiments = async () => {
    try {
      // Simplified - in production use proper auth
      const response = await axios.get(`${API_URL}/experiments`);
      setExperiments(response.data.experiments || []);
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>Experiments</h1>
          <Link to="/experiments/new" className="btn btn-primary">
            New Experiment
          </Link>
        </div>

        {experiments.length === 0 ? (
          <div className="card">
            <p>No experiments yet. Create your first experiment!</p>
            <Link to="/experiments/new" className="btn btn-primary">
              Create Experiment
            </Link>
          </div>
        ) : (
          <div className="card">
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
                {experiments.map(experiment => (
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
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Experiments;

