import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'
import axios from 'axios'

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
  const [experiment, setExperiment] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [attackTypes, setAttackTypes] = useState([])

  useEffect(() => {
    loadExperiment()
    loadAttackTypes()
  }, [id])

  const loadExperiment = async () => {
    try {
      const { data: expData, error: expError } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', id)
        .single()

      if (expError) throw expError
      setExperiment(expData)

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

  const handleRunExperiment = async () => {
    setRunning(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.post(
        `http://localhost:5001/api/experiments/${id}/run`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      // Poll for updates
      const interval = setInterval(async () => {
        const { data, error } = await supabase
          .from('experiments')
          .select('status')
          .eq('id', id)
          .single()

        if (error) {
          clearInterval(interval)
          setRunning(false)
          return
        }

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
          setRunning(false)
          loadExperiment()
        }
      }, 2000)
    } catch (error) {
      console.error('Error running experiment:', error)
      setRunning(false)
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
      navigate('/dashboard')
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
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{experiment.name}</h2>
                <p className="mt-1 text-sm text-gray-400">{experiment.description}</p>
              </div>
              <div className="flex space-x-3">
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                    experiment.status
                  )}`}
                >
                  {experiment.status}
                </span>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              {experiment.status === 'pending' && (
                <button
                  onClick={handleRunExperiment}
                  disabled={running}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {running ? 'Running...' : 'Run Experiment'}
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Configuration</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
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
            </dl>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Results</h3>
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

                    {/* Confusion Matrix */}
                    {result.confusion_matrix && (
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
