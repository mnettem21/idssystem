import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Experiments from './pages/Experiments';
import ExperimentDetail from './pages/ExperimentDetail';
import NewExperiment from './pages/NewExperiment';
import Comparisons from './pages/Comparisons';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/experiments" 
            element={
              <ProtectedRoute>
                <Experiments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/experiments/new" 
            element={
              <ProtectedRoute>
                <NewExperiment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/experiments/:id" 
            element={
              <ProtectedRoute>
                <ExperimentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/comparisons" 
            element={
              <ProtectedRoute>
                <Comparisons />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
