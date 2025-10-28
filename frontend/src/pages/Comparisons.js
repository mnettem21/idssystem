import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Comparisons = () => {
  const { user } = useAuth();
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComparisons();
    }
  }, [user]);

  const fetchComparisons = async () => {
    try {
      const response = await axios.get(`${API_URL}/comparisons`);
      setComparisons(response.data.comparisons || []);
    } catch (error) {
      console.error('Error fetching comparisons:', error);
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
        <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Comparisons</h1>

        {comparisons.length === 0 ? (
          <div className="card">
            <p>No comparisons yet. Compare your experiments to see performance differences!</p>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Comparison Name</th>
                  <th>Baseline</th>
                  <th>Comparison</th>
                  <th>Improvement</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(comparison => {
                  const metrics = comparison.comparison_metrics || {};
                  const improvement = metrics.improvement || {};
                  
                  return (
                    <tr key={comparison.id}>
                      <td>{comparison.name}</td>
                      <td>Experiment #{comparison.baseline_experiment_id.substring(0, 8)}</td>
                      <td>Experiment #{comparison.comparison_experiment_id.substring(0, 8)}</td>
                      <td>
                        {improvement.accuracy && (
                          <span style={{ color: improvement.accuracy >= 0 ? '#27ae60' : '#e74c3c' }}>
                            {improvement.accuracy >= 0 ? '+' : ''}{improvement.accuracy.toFixed(4)}
                          </span>
                        )}
                      </td>
                      <td>{new Date(comparison.created_at).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/comparisons/${comparison.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Comparisons;

