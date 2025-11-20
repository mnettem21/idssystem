import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

// Confusion Matrix Component
function ConfusionMatrix({ matrix, attackTypes }) {
  if (!matrix || !matrix.length) return null

  const maxValue = Math.max(...matrix.flat())

  const getColor = (value) => {
    const intensity = value / maxValue
    const r = Math.round(255 * (1 - intensity))
    const g = Math.round(255 * (1 - intensity))
    const b = 255
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div className="overflow-x-auto">
      <div className="text-xs text-gray-400 mb-2">Rows: Actual | Columns: Predicted</div>
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-600 px-2 py-1 text-xs text-gray-400"></th>
            {matrix[0].map((_, index) => {
              const attackType = attackTypes.find((at) => at.label === index)
              return (
                <th key={index} className="border border-gray-600 px-2 py-1 text-xs text-gray-300">
                  {attackType?.name || `L${index}`}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIndex) => {
            const attackType = attackTypes.find((at) => at.label === rowIndex)
            return (
              <tr key={rowIndex}>
                <th className="border border-gray-600 px-2 py-1 text-xs text-gray-300">
                  {attackType?.name || `L${rowIndex}`}
                </th>
                {row.map((value, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-600 px-2 py-1 text-center text-xs font-medium text-white"
                    style={{
                      backgroundColor: getColor(value),
                    }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ExperimentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if we came from the history page
  const cameFromHistory = location.state?.fromHistory === true
  const [experiment, setExperiment] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [attackTypes, setAttackTypes] = useState([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [parentExperiment, setParentExperiment] = useState(null)
  const [parentResults, setParentResults] = useState([])
  const [originalExperimentId, setOriginalExperimentId] = useState(null)

  useEffect(() => {
    loadExperiment()
    loadAttackTypes()
    
    // Cleanup timer on unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [id])

  // Note: parent_experiment_id column doesn't exist in schema, so parent experiment loading is disabled
  // useEffect(() => {
  //   // Load parent experiment if this is a rerun
  //   if (experiment?.parent_experiment_id) {
  //     loadParentExperiment(experiment.parent_experiment_id)
  //   }
  // }, [experiment?.parent_experiment_id])

  useEffect(() => {
    // Start/stop timer based on experiment status or running state
    if (experiment?.status === 'running' || running) {
      // Use started_at if available, otherwise use current time
      const startTime = experiment?.started_at 
        ? new Date(experiment.started_at).getTime() 
        : Date.now()
      
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
      
      setTimerInterval(interval)
      
      return () => {
        clearInterval(interval)
      }
    } else {
      if (timerInterval) {
        clearInterval(timerInterval)
        setTimerInterval(null)
      }
      if (experiment?.completed_at && experiment?.started_at) {
        const startTime = new Date(experiment.started_at).getTime()
        const endTime = new Date(experiment.completed_at).getTime()
        setElapsedTime(Math.floor((endTime - startTime) / 1000))
      } else if (!experiment?.status || experiment?.status === 'pending') {
        setElapsedTime(0)
      }
    }
  }, [experiment?.status, experiment?.started_at, experiment?.completed_at, running])

  const loadExperiment = async () => {
    try {
      const { data: expData, error: expError } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', id)
        .single()

      if (expError) throw expError
      setExperiment(expData)

      // Check if this is a rerun and extract original experiment ID
      const originalIdMatch = expData.description?.match(/Original ID: ([a-f0-9-]+)/)
      if (originalIdMatch) {
        const originalId = originalIdMatch[1]
        setOriginalExperimentId(originalId)
        // Load original experiment for comparison
        loadOriginalExperiment(originalId)
      }

      const { data: resultsData, error: resultsError } = await supabase
        .from('experiment_results')
        .select('*')
        .eq('experiment_id', id)

      if (resultsError) throw resultsError
      setResults(resultsData || [])
    } catch (error) {
      console.error('Error loading experiment:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOriginalExperiment = async (originalId) => {
    try {
      const { data: expData, error: expError } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', originalId)
        .single()

      if (expError) {
        console.warn('Original experiment not found:', expError)
        return
      }
      setParentExperiment(expData)

      const { data: resultsData, error: resultsError } = await supabase
        .from('experiment_results')
        .select('*')
        .eq('experiment_id', originalId)

      if (resultsError) {
        console.warn('Original experiment results not found:', resultsError)
        return
      }
      setParentResults(resultsData || [])
    } catch (error) {
      console.error('Error loading original experiment:', error)
    }
  }

  const loadAttackTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('attack_types')
        .select('*')
        .order('label')

      if (error) throw error
      setAttackTypes(data || [])
    } catch (error) {
      console.error('Error loading attack types:', error)
    }
  }

  // Note: This function is kept for backward compatibility but may not be used
  const loadParentExperiment = async (parentId) => {
    await loadOriginalExperiment(parentId)
  }

  const prepareComparisonData = () => {
    if (!parentResults.length || !results.length) return null

    const comparisonData = []
    const modelNames = [...new Set([...results.map(r => r.model_name), ...parentResults.map(r => r.model_name)])]

    modelNames.forEach(modelName => {
      const currentResult = results.find(r => r.model_name === modelName)
      const parentResult = parentResults.find(r => r.model_name === modelName)

      if (currentResult && parentResult) {
        comparisonData.push({
          model: modelName,
          'Current Accuracy': currentResult.accuracy * 100,
          'Previous Accuracy': parentResult.accuracy * 100,
          'Current Precision': currentResult.precision * 100,
          'Previous Precision': parentResult.precision * 100,
          'Current Recall': currentResult.recall * 100,
          'Previous Recall': parentResult.recall * 100,
          'Current F1': currentResult.f1_score * 100,
          'Previous F1': parentResult.f1_score * 100,
        })
      }
    })

    return comparisonData
  }

  const prepareMetricsChartData = () => {
    if (!results.length) return []

    return results.map(result => ({
      model: result.model_name,
      Accuracy: result.accuracy * 100,
      Precision: result.precision * 100,
      Recall: result.recall * 100,
      'F1 Score': result.f1_score * 100,
    }))
  }

  const handleRunExperiment = async () => {
    setRunning(true)
    try {
      // Get current session
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        alert('Authentication error: ' + sessionError.message)
        setRunning(false)
        return
      }

      // If session expired, try to refresh it
      if (!session || !session.access_token) {
        console.log('No session found, attempting to refresh...')
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !newSession) {
          console.error('Failed to refresh session:', refreshError)
          alert('Your session has expired. Please log in again.')
          setRunning(false)
          return
        }
        session = newSession
      }

      if (!session || !session.access_token) {
        console.error('No session or access token after refresh')
        alert('You must be logged in to run experiments. Please refresh the page and try again.')
        setRunning(false)
        return
      }

      console.log('Sending request with token:', session.access_token.substring(0, 20) + '...')
      console.log('Token length:', session.access_token.length)
      console.log('User ID:', session.user?.id)

      const response = await axios.post(
        `http://localhost:5001/api/experiments/${id}/run`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('Run experiment response:', response.data)

      // Reset timer and start counting
      setElapsedTime(0)

      // Poll for updates and reload full experiment data
      const interval = setInterval(async () => {
        const { data, error } = await supabase
          .from('experiments')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Polling error:', error)
          clearInterval(interval)
          setRunning(false)
          return
        }

        // Update experiment state to trigger timer updates
        setExperiment(data)

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
          setRunning(false)
          // Reload full experiment with results
          loadExperiment()
        }
      }, 2000)
    } catch (error) {
      console.error('Error running experiment:', error)
      if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data?.error || error.response.data?.message || 'Unknown error'
        alert('Failed to run experiment: ' + errorMsg)
        console.error('Error response:', error.response.data)
      } else if (error.request) {
        // Request made but no response
        alert('Failed to connect to server. Please check if the backend is running.')
        console.error('No response received:', error.request)
      } else {
        // Something else happened
        alert('Error: ' + error.message)
        console.error('Error:', error.message)
      }
      setRunning(false)
    }
  }

  const handleRerunExperiment = async () => {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Extract original experiment ID from description if this is already a rerun
      const originalIdMatch = experiment.description?.match(/Original ID: ([a-f0-9-]+)/)
      const originalExperimentId = originalIdMatch ? originalIdMatch[1] : experiment.id

      // Create a new experiment with the same parameters
      const newExperimentData = {
        user_id: user.id,
        name: `${experiment.name.replace(' (Rerun)', '')} (Rerun)`,
        description: `Rerun of: ${experiment.description || experiment.name}\nOriginal ID: ${originalExperimentId}`,
        algorithm: experiment.algorithm,
        dataset_name: experiment.dataset_name,
        train_size: experiment.train_size,
        test_size: experiment.test_size,
        random_state: experiment.random_state,
        smote_enabled: experiment.smote_enabled,
        smote_sampling_strategy: experiment.smote_sampling_strategy,
        feature_selection_enabled: experiment.feature_selection_enabled,
        lightgbm_params: experiment.lightgbm_params,
        xgboost_params: experiment.xgboost_params,
        catboost_params: experiment.catboost_params,
        status: 'pending',
      }

      const { data, error } = await supabase
        .from('experiments')
        .insert([newExperimentData])
        .select()

      if (error) throw error

      // Navigate to the new experiment, preserving history state if we came from history
      navigate(`/experiments/${data[0].id}`, { state: { fromHistory: cameFromHistory } })
    } catch (error) {
      console.error('Error rerunning experiment:', error)
      alert('Failed to rerun experiment: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this experiment?')) return

    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Navigate back appropriately
      if (cameFromHistory) {
        navigate('/experiments/history')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting experiment:', error)
    }
  }

  const exportToJSON = () => {
    const exportData = {
      experiment: {
        name: experiment.name,
        description: experiment.description,
        dataset_name: experiment.dataset_name,
        train_size: experiment.train_size,
        test_size: experiment.test_size,
        random_state: experiment.random_state,
        smote_enabled: experiment.smote_enabled,
        smote_sampling_strategy: experiment.smote_sampling_strategy,
        status: experiment.status,
        created_at: experiment.created_at,
        completed_at: experiment.completed_at,
      },
      results: results.map(r => ({
        model_name: r.model_name,
        accuracy: r.accuracy,
        precision: r.precision,
        recall: r.recall,
        f1_score: r.f1_score,
        f1_scores_per_class: r.f1_scores_per_class,
        confusion_matrix: r.confusion_matrix,
        training_time: r.training_time,
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${experiment.name.replace(/\s+/g, '_')}_results.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const headers = ['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'Training Time (s)']
    const rows = results.map(r => [
      r.model_name,
      (r.accuracy * 100).toFixed(4),
      (r.precision * 100).toFixed(4),
      (r.recall * 100).toFixed(4),
      (r.f1_score * 100).toFixed(4),
      r.training_time.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${experiment.name.replace(/\s+/g, '_')}_results.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 py-8">Loading...</div>
        </div>
      </div>
    )
  }

  if (!experiment) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 py-8">Experiment not found</div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-900 text-yellow-200',
      running: 'bg-blue-900 text-blue-200',
      completed: 'bg-green-900 text-green-200',
      failed: 'bg-red-900 text-red-200',
    }
    return badges[status] || 'bg-gray-900 text-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with Back Button */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => {
                  if (cameFromHistory) {
                    navigate('/experiments/history')
                  } else {
                    navigate('/dashboard')
                  }
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white">{experiment.name}</h2>
              <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                  experiment.status
                )}`}
              >
                {experiment.status}
              </span>
            </div>
            <div className="ml-10">
              <p className="text-sm text-gray-400">{experiment.description}</p>
            </div>

            <div className="mt-4 ml-10 flex items-center space-x-3">
              {experiment.status === 'pending' && (
                <button
                  onClick={handleRunExperiment}
                  disabled={running}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {running ? 'Running...' : 'Run Experiment'}
                </button>
              )}
              {(experiment.status === 'running' || running) && (
                <div className="flex items-center space-x-2 bg-blue-900 bg-opacity-50 px-4 py-2 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-white font-medium">Running</span>
                  <span className="text-blue-200 font-mono text-lg font-bold">
                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              {experiment.status === 'completed' && experiment.started_at && experiment.completed_at && (
                <div className="text-sm text-gray-400">
                  Runtime: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
              )}
              {(experiment.status === 'completed' || experiment.status === 'failed') && (
                <>
                  <button
                    onClick={handleRerunExperiment}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Rerun Experiment
                  </button>
                  {originalExperimentId && (
                    <button
                      onClick={() => navigate(`/experiments/compare?ids=${originalExperimentId},${id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      Compare with Original
                    </button>
                  )}
                </>
              )}
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Delete Experiment
              </button>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Configuration</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Algorithm</dt>
                <dd className="mt-1 text-sm text-white">
                  {experiment.algorithm === 'lccde' && 'LCCDE - Leader Class & Confidence Decision Ensemble'}
                  {experiment.algorithm === 'mth' && 'MTH-IDS - Multi-Tiered Hybrid IDS'}
                  {experiment.algorithm === 'tree-based' && 'Tree-Based IDS - Feature Importance & Stacking'}
                  {!experiment.algorithm && 'LCCDE (default)'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Dataset</dt>
                <dd className="mt-1 text-sm text-white">{experiment.dataset_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Train/Test Split</dt>
                <dd className="mt-1 text-sm text-white">
                  {(experiment.train_size * 100).toFixed(0)}% / {(experiment.test_size * 100).toFixed(0)}%
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Random State</dt>
                <dd className="mt-1 text-sm text-white">{experiment.random_state}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">SMOTE Enabled</dt>
                <dd className="mt-1 text-sm text-white">{experiment.smote_enabled ? 'Yes' : 'No'}</dd>
              </div>
              {(experiment.algorithm === 'mth' || experiment.algorithm === 'tree-based') && (
                <div>
                  <dt className="text-sm font-medium text-gray-400">Feature Selection</dt>
                  <dd className="mt-1 text-sm text-white">{experiment.feature_selection_enabled ? 'Enabled' : 'Disabled'}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Old vs New Comparison */}
          {parentExperiment && results.length > 0 && parentResults.length > 0 && (
            <div className="bg-gray-800 shadow rounded-lg p-6 mb-6 border-2 border-purple-600">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                Comparison: Old vs New
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Comparing with parent experiment: <span className="text-purple-400">{parentExperiment.name}</span>
              </p>

              {prepareComparisonData() && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-300 mb-3">Performance Comparison</h4>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="model" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => value.toFixed(1) + '%'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.375rem',
                        }}
                        formatter={(value) => value.toFixed(2) + '%'}
                      />
                      <Legend />
                      <Bar dataKey="Current Accuracy" fill="#10B981" />
                      <Bar dataKey="Previous Accuracy" fill="#6B7280" />
                      <Bar dataKey="Current Precision" fill="#3B82F6" />
                      <Bar dataKey="Previous Precision" fill="#6B7280" />
                      <Bar dataKey="Current Recall" fill="#F59E0B" />
                      <Bar dataKey="Previous Recall" fill="#6B7280" />
                      <Bar dataKey="Current F1" fill="#EF4444" />
                      <Bar dataKey="Previous F1" fill="#6B7280" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Previous Experiment</h5>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Created: {new Date(parentExperiment.created_at).toLocaleString()}</div>
                    {parentExperiment.completed_at && (
                      <div>Completed: {new Date(parentExperiment.completed_at).toLocaleString()}</div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      {parentResults.map(r => (
                        <div key={r.id} className="flex justify-between">
                          <span className="text-gray-300">{r.model_name}:</span>
                          <span className="text-white">{(r.f1_score * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Current Experiment</h5>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Created: {new Date(experiment.created_at).toLocaleString()}</div>
                    {experiment.completed_at && (
                      <div>Completed: {new Date(experiment.completed_at).toLocaleString()}</div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      {results.map(r => (
                        <div key={r.id} className="flex justify-between">
                          <span className="text-gray-300">{r.model_name}:</span>
                          <span className="text-white">{(r.f1_score * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Chart */}
          {results.length > 0 && (
            <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Model Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareMetricsChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="model" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => value.toFixed(0) + '%'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem',
                    }}
                    formatter={(value) => value.toFixed(2) + '%'}
                  />
                  <Legend />
                  <Bar dataKey="Accuracy" fill="#10B981" />
                  <Bar dataKey="Precision" fill="#3B82F6" />
                  <Bar dataKey="Recall" fill="#F59E0B" />
                  <Bar dataKey="F1 Score" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Visualizations */}
          {experiment.visualizations && (
            <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Visualizations</h3>
              
              {/* Model Performance Comparison */}
              {experiment.visualizations.comparison_plot && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-300 mb-3">Model Performance Comparison</h4>
                  <div className="bg-white rounded-lg p-4">
                    <img 
                      src={`data:image/png;base64,${experiment.visualizations.comparison_plot}`} 
                      alt="Model Performance Comparison"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Feature Importance (for Tree-Based) */}
              {experiment.visualizations.feature_importance && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-300 mb-3">Top 20 Most Important Features</h4>
                  <div className="bg-white rounded-lg p-4">
                    <img 
                      src={`data:image/png;base64,${experiment.visualizations.feature_importance}`} 
                      alt="Feature Importance"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visual Results Section */}
          {results.length > 0 && (
            <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Visual Results</h3>
              
              {/* F1 Scores per Class Chart */}
              {results[0]?.f1_scores_per_class && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-300 mb-3">F1 Scores by Attack Type</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={results[0].f1_scores_per_class.map((score, index) => {
                        const attackType = attackTypes.find((at) => at.label === index)
                        return {
                          attackType: attackType?.name || `Label ${index}`,
                          'F1 Score': score * 100,
                        }
                      })}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="attackType" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => value.toFixed(0) + '%'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.375rem',
                        }}
                        formatter={(value) => value.toFixed(2) + '%'}
                      />
                      <Bar dataKey="F1 Score" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Training Time Comparison */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-300 mb-3">Training Time Comparison</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={results.map(r => ({
                      model: r.model_name,
                      'Training Time (s)': r.training_time,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="model" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.375rem',
                      }}
                      formatter={(value) => value.toFixed(2) + 's'}
                    />
                    <Bar dataKey="Training Time (s)" fill="#EC4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Detailed Results</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={exportToCSV}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    Export JSON
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {results.map((result) => (
                  <div key={result.id} className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-white mb-3 uppercase">{result.model_name}</h4>

                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-400">Accuracy</dt>
                        <dd className="mt-1 text-lg font-semibold text-white">
                          {(result.accuracy * 100).toFixed(2)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-400">Precision</dt>
                        <dd className="mt-1 text-lg font-semibold text-white">
                          {(result.precision * 100).toFixed(2)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-400">Recall</dt>
                        <dd className="mt-1 text-lg font-semibold text-white">
                          {(result.recall * 100).toFixed(2)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-400">F1 Score</dt>
                        <dd className="mt-1 text-lg font-semibold text-white">
                          {(result.f1_score * 100).toFixed(2)}%
                        </dd>
                      </div>
                    </dl>

                    {/* F1 Scores per Attack Type */}
                    {result.f1_scores_per_class && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-400 mb-2">F1 Scores by Attack Type</h5>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {result.f1_scores_per_class.map((score, index) => {
                            const attackType = attackTypes.find((at) => at.label === index)
                            return (
                              <div key={index} className="bg-gray-700 rounded px-3 py-2">
                                <div className="text-xs text-gray-400">
                                  {attackType?.name || `Label ${index}`}
                                </div>
                                <div className="text-sm font-medium text-white">
                                  {(score * 100).toFixed(2)}%
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Confusion Matrix Plot (if available) */}
                    {result.confusion_matrix_plot && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-400 mb-2">Confusion Matrix Heatmap</h5>
                        <div className="bg-white rounded-lg p-4">
                          <img 
                            src={`data:image/png;base64,${result.confusion_matrix_plot}`} 
                            alt={`Confusion Matrix - ${result.model_name}`}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}

                    {/* Confusion Matrix Table (fallback if no plot) */}
                    {result.confusion_matrix && !result.confusion_matrix_plot && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-400 mb-2">Confusion Matrix</h5>
                        <ConfusionMatrix matrix={result.confusion_matrix} attackTypes={attackTypes} />
                      </div>
                    )}

                    <div className="mt-4">
                      <dt className="text-sm font-medium text-gray-400">Training Time</dt>
                      <dd className="mt-1 text-sm text-white">{result.training_time.toFixed(2)} seconds</dd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experiment.status === 'failed' && experiment.error_message && (
            <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 mt-6">
              <h3 className="text-lg font-medium text-red-200 mb-2">Error</h3>
              <p className="text-sm text-red-200">{experiment.error_message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
