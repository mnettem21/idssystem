import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import '../App.css';

const ExperimentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [baselineId] = useState('');

  const fetchExperiment = React.useCallback(async () => {
    try {
      const response = await api.get(`/experiments/${id}`);
      setExperiment(response.data.experiment);
    } catch (error) {
      console.error('Error fetching experiment:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExperiment();
  }, [fetchExperiment]);

  const handleCompare = async () => {
    try {
      const response = await api.post('/comparisons', {
        name: `Comparison: ${experiment.name} vs Baseline`,
        description: 'Automatic comparison',
        baseline_experiment_id: baselineId,
        comparison_experiment_id: id
      });
      
      navigate(`/comparisons/${response.data.comparison.id}`);
    } catch (error) {
      console.error('Error creating comparison:', error);
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

  if (!experiment) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="alert alert-error">Experiment not found</div>
        </div>
      </>
    );
  }

  const result = experiment.result;

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link to="/experiments" className="btn btn-secondary">← Back to Experiments</Link>
          <span className={`status-badge status-${experiment.status}`}>
            {experiment.status}
          </span>
        </div>

        <div className="card">
          <h1>{experiment.name}</h1>
          <p>{experiment.description}</p>
          <p><strong>Algorithm:</strong> {experiment.algorithm}</p>
          <p><strong>Created:</strong> {new Date(experiment.created_at).toLocaleString()}</p>
        </div>

        {experiment.status === 'completed' && result && (
          <>
            <div className="card">
              <h2>Results</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: '#3498db', margin: 0 }}>{result.accuracy?.toFixed(4)}</h3>
                  <p style={{ margin: '0.5rem 0 0 0' }}>Accuracy</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: '#27ae60', margin: 0 }}>{result.f1_weighted?.toFixed(4)}</h3>
                  <p style={{ margin: '0.5rem 0 0 0' }}>F1 Score</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: '#e74c3c', margin: 0 }}>{result.precision_weighted?.toFixed(4)}</h3>
                  <p style={{ margin: '0.5rem 0 0 0' }}>Precision</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: '#f39c12', margin: 0 }}>{result.recall_weighted?.toFixed(4)}</h3>
                  <p style={{ margin: '0.5rem 0 0 0' }}>Recall</p>
                </div>
              </div>
              <p><strong>Execution Time:</strong> {result.execution_time_seconds?.toFixed(2)} seconds</p>
            </div>

            {!comparisonMode ? (
              <button 
                className="btn btn-primary"
                onClick={() => setComparisonMode(true)}
              >
                Compare with Another Experiment
              </button>
            ) : (
              <div className="card">
                <h2>Select Baseline Experiment</h2>
                <p>Select another experiment to compare with this one.</p>
                {/* In a real implementation, you'd fetch available experiments here */}
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCompare}
                    disabled={!baselineId}
                  >
                    Compare
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setComparisonMode(false)}
                    style={{ marginLeft: '1rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {experiment.status === 'failed' && (
          <div className="alert alert-error">
            Experiment failed. Please check the logs for details.
          </div>
        )}
      </div>
    </>
  );
};

export default ExperimentDetail;

