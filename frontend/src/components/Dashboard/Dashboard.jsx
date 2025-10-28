import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'

export default function Dashboard() {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedForComparison, setSelectedForComparison] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadExperiments()
  }, [])

  const loadExperiments = async () => {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExperiments(data || [])
    } catch (error) {
      console.error('Error loading experiments:', error)
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const toggleSelection = (experimentId) => {
    setSelectedForComparison(prev => {
      if (prev.includes(experimentId)) {
        return prev.filter(id => id !== experimentId)
      } else {
        return [...prev, experimentId]
      }
    })
  }

  const handleCompare = () => {
    if (selectedForComparison.length < 2) {
      alert('Please select at least 2 experiments to compare')
      return
    }
    navigate(`/experiments/compare?ids=${selectedForComparison.join(',')}`)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Experiments</h2>
            <div className="flex space-x-3">
              {selectedForComparison.length > 0 && (
                <button
                  onClick={handleCompare}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Compare Selected ({selectedForComparison.length})
                </button>
              )}
              <button
                onClick={() => navigate('/experiments/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Create New Experiment
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : experiments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No experiments yet. Create your first experiment to get started!</p>
            </div>
          ) : (
            <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-700">
                {experiments.map((experiment) => (
                  <li
                    key={experiment.id}
                    className="hover:bg-gray-700 transition duration-150"
                  >
                    <div className="px-4 py-4 sm:px-6 flex items-start">
                      {/* Checkbox for comparison */}
                      {experiment.status === 'completed' && (
                        <div className="mr-4 flex items-center h-full pt-1">
                          <input
                            type="checkbox"
                            checked={selectedForComparison.includes(experiment.id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleSelection(experiment.id)
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                          />
                        </div>
                      )}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/experiments/${experiment.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium text-white truncate">
                              {experiment.name}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              {experiment.description || 'No description'}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                                experiment.status
                              )}`}
                            >
                              {experiment.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex space-x-4">
                            <p className="text-sm text-gray-400">
                              Dataset: {experiment.dataset_name}
                            </p>
                            <p className="text-sm text-gray-400">
                              Split: {(experiment.train_size * 100).toFixed(0)}% / {(experiment.test_size * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="mt-2 text-sm text-gray-400 sm:mt-0">
                            Created: {formatDate(experiment.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
