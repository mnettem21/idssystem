import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NewExperiment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataset_id: '',
    algorithm: 'LCCDE',
    parameters: {}
  });

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await axios.get(`${API_URL}/datasets`);
      setDatasets(response.data.datasets || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/experiments`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        navigate(`/experiments/${response.data.experiment.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (param, value) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value
      }
    }));
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Create New Experiment</h1>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Basic Information</h2>
            
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Experiment Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dataset_id">Dataset *</label>
              <select
                id="dataset_id"
                value={formData.dataset_id}
                onChange={(e) => setFormData({ ...formData, dataset_id: e.target.value })}
                required
              >
                <option value="">Select a dataset</option>
                {datasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="algorithm">Algorithm *</label>
              <select
                id="algorithm"
                value={formData.algorithm}
                onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
                required
              >
                <option value="LCCDE">LCCDE (Recommended)</option>
                <option value="XGBoost">XGBoost</option>
                <option value="LightGBM">LightGBM</option>
                <option value="CatBoost">CatBoost</option>
              </select>
            </div>
          </div>

          {formData.algorithm === 'LCCDE' && (
            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>LCCDE Parameters</h2>
              
              <div className="form-group">
                <label htmlFor="train_size">Train Size</label>
                <input
                  id="train_size"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.parameters.train_size || 0.8}
                  onChange={(e) => handleParameterChange('train_size', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="random_state">Random State</label>
                <input
                  id="random_state"
                  type="number"
                  value={formData.parameters.random_state || 0}
                  onChange={(e) => handleParameterChange('random_state', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Experiment'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/experiments')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default NewExperiment;

