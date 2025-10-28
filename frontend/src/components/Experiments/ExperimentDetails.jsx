import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'
import axios from 'axios'

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
              <h3 className="text-lg font-medium text-white mb-4">Results</h3>

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
