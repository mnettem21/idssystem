import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'

export default function ExperimentHistory() {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAlgorithm, setFilterAlgorithm] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadExperiments()
  }, [])

  const loadExperiments = async () => {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select(`
          *,
          experiment_results (
            model_name,
            accuracy,
            precision,
            recall,
            f1_score,
            training_time
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExperiments(data || [])
    } catch (error) {
      console.error('Error loading experiments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || exp.status === filterStatus
    const matchesAlgorithm = filterAlgorithm === 'all' || exp.algorithm === filterAlgorithm
    return matchesSearch && matchesStatus && matchesAlgorithm
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A'
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const seconds = Math.floor((end - start) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getBestMetrics = (results) => {
    if (!results || results.length === 0) return null
    const best = results.reduce((best, current) => {
      return current.f1_score > best.f1_score ? current : best
    }, results[0])
    return {
      accuracy: best.accuracy,
      precision: best.precision,
      recall: best.recall,
      f1_score: best.f1_score,
      model: best.model_name,
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

  const getAlgorithmDisplay = (algorithm) => {
    if (algorithm === 'lccde') return { icon: '', name: 'LCCDE' }
    if (algorithm === 'mth') return { icon: '', name: 'MTH-IDS' }
    if (algorithm === 'tree-based') return { icon: '', name: 'Tree-Based' }
    return { icon: '', name: 'LCCDE' }
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white">Experiment History</h2>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Algorithm</label>
                <select
                  value={filterAlgorithm}
                  onChange={(e) => setFilterAlgorithm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Algorithms</option>
                  <option value="lccde">LCCDE</option>
                  <option value="mth">MTH-IDS</option>
                  <option value="tree-based">Tree-Based</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Metrics</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Runtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredExperiments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                        No experiments found
                      </td>
                    </tr>
                  ) : (
                    filteredExperiments.map((experiment) => {
                      const algo = getAlgorithmDisplay(experiment.algorithm)
                      const bestMetrics = getBestMetrics(experiment.experiment_results)
                      return (
                        <tr
                          key={experiment.id}
                          className="hover:bg-gray-750 cursor-pointer"
                          onClick={() => navigate(`/experiments/${experiment.id}`, { state: { fromHistory: true } })}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {experiment.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{experiment.name}</div>
                            {experiment.description && (
                              <div className="text-xs text-gray-400 truncate max-w-xs">{experiment.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-300">{algo.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(experiment.status)}`}>
                              {experiment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {bestMetrics ? (
                              <div className="text-sm text-gray-300">
                                <div>F1: {(bestMetrics.f1_score * 100).toFixed(2)}%</div>
                                <div className="text-xs text-gray-400">Acc: {(bestMetrics.accuracy * 100).toFixed(2)}%</div>
                                <div className="text-xs text-gray-500">{bestMetrics.model}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDuration(experiment.started_at, experiment.completed_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(experiment.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/experiments/${experiment.id}`, { state: { fromHistory: true } })
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                View
                              </button>
                              {(() => {
                                const originalIdMatch = experiment.description?.match(/Original ID: ([a-f0-9-]+)/)
                                if (originalIdMatch && (experiment.status === 'completed' || experiment.status === 'failed')) {
                                  return (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/experiments/compare?ids=${originalIdMatch[1]},${experiment.id}`)
                                      }}
                                      className="text-purple-400 hover:text-purple-300"
                                      title="Compare with Original"
                                    >
                                      Compare
                                    </button>
                                  )
                                }
                                return null
                              })()}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredExperiments.length} of {experiments.length} experiments
          </div>
        </div>
      </div>
    </div>
  )
}

