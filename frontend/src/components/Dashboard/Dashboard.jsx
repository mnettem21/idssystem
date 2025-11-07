import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'

export default function Dashboard() {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedForComparison, setSelectedForComparison] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, running: 0, pending: 0, failed: 0 })
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
      
      // Calculate stats
      const total = data?.length || 0
      const completed = data?.filter(e => e.status === 'completed').length || 0
      const running = data?.filter(e => e.status === 'running').length || 0
      const pending = data?.filter(e => e.status === 'pending').length || 0
      const failed = data?.filter(e => e.status === 'failed').length || 0
      
      setStats({ total, completed, running, pending, failed })
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

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Experiments List */}
        <div className="w-96 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <h3 className="text-lg font-semibold text-white mb-3">Your Experiments</h3>
            {selectedForComparison.length > 0 && (
              <button
                onClick={handleCompare}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md font-medium text-sm mb-2"
              >
                Compare Selected ({selectedForComparison.length})
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : experiments.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p className="mb-4">No experiments yet.</p>
              <button
                onClick={() => navigate('/experiments/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm"
              >
                Create First Experiment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {experiments.map((experiment) => (
                <div
                  key={experiment.id}
                  className="p-4 hover:bg-gray-750 transition duration-150 cursor-pointer"
                  onClick={() => navigate(`/experiments/${experiment.id}`)}
                >
                  <div className="flex items-start space-x-3">
                    {experiment.status === 'completed' && (
                      <input
                        type="checkbox"
                        checked={selectedForComparison.includes(experiment.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelection(experiment.id)
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {experiment.name}
                        </p>
                        <span
                          className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadge(
                            experiment.status
                          )}`}
                        >
                          {experiment.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        {experiment.algorithm === 'lccde' && '🔷 LCCDE'}
                        {experiment.algorithm === 'mth' && '🔶 MTH-IDS'}
                        {experiment.algorithm === 'tree-based' && '🌲 Tree-Based'}
                        {!experiment.algorithm && '🔷 LCCDE'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(experiment.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Dashboard</h2>
              <button
                onClick={() => navigate('/experiments/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg"
              >
                + New Experiment
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Total Experiments</div>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-green-900 bg-opacity-30 rounded-lg p-4 border border-green-700">
                <div className="text-green-300 text-sm mb-1">Completed</div>
                <div className="text-3xl font-bold text-green-200">{stats.completed}</div>
              </div>
              <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
                <div className="text-blue-300 text-sm mb-1">Running</div>
                <div className="text-3xl font-bold text-blue-200">{stats.running}</div>
              </div>
              <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-4 border border-yellow-700">
                <div className="text-yellow-300 text-sm mb-1">Pending</div>
                <div className="text-3xl font-bold text-yellow-200">{stats.pending}</div>
              </div>
              <div className="bg-red-900 bg-opacity-30 rounded-lg p-4 border border-red-700">
                <div className="text-red-300 text-sm mb-1">Failed</div>
                <div className="text-3xl font-bold text-red-200">{stats.failed}</div>
              </div>
            </div>

            {/* Quick Start Guide */}
            {experiments.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">🚀 Quick Start Guide</h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <p>Click "<strong>New Experiment</strong>" to create your first IDS experiment</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <p>Choose an algorithm (LCCDE, MTH-IDS, or Tree-Based)</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <p>Configure dataset, parameters, and feature selection</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <p>Run the experiment and view beautiful visualizations!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Algorithms Overview */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">🤖 Available Algorithms</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* LCCDE */}
                <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🔷</span>
                    <h4 className="font-semibold text-white">LCCDE</h4>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Leader Class & Confidence Decision Ensemble
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>✓ LightGBM, XGBoost, CatBoost</li>
                    <li>✓ Leader model per class</li>
                    <li>✓ Confidence-based decisions</li>
                  </ul>
                </div>

                {/* MTH-IDS */}
                <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🔶</span>
                    <h4 className="font-semibold text-white">MTH-IDS</h4>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Multi-Tiered Hybrid IDS
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>✓ DT, RF, ET, XGBoost</li>
                    <li>✓ Information Gain selection</li>
                    <li>✓ Stacking ensemble</li>
                  </ul>
                </div>

                {/* Tree-Based */}
                <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🌲</span>
                    <h4 className="font-semibold text-white">Tree-Based</h4>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Feature Importance & Stacking
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>✓ DT, RF, ET, XGBoost</li>
                    <li>✓ Average importance selection</li>
                    <li>✓ Feature importance charts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {experiments.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Recent Activity</h3>
                <div className="space-y-3">
                  {experiments.slice(0, 5).map((exp) => (
                    <div
                      key={exp.id}
                      onClick={() => navigate(`/experiments/${exp.id}`)}
                      className="flex items-center justify-between p-3 bg-gray-750 rounded-lg hover:bg-gray-700 cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(exp.status)}`}>
                          {exp.status}
                        </span>
                        <div>
                          <p className="text-white font-medium">{exp.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(exp.created_at)}</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-900 bg-opacity-20 rounded-lg p-6 border border-blue-700">
              <h3 className="text-lg font-semibold text-blue-200 mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li>• Use <strong>feature selection</strong> for MTH-IDS and Tree-Based algorithms to improve performance</li>
                <li>• <strong>Compare experiments</strong> by selecting multiple completed experiments in the sidebar</li>
                <li>• Adjust <strong>SMOTE parameters</strong> to balance minority classes in your dataset</li>
                <li>• All experiments include <strong>beautiful visualizations</strong> like confusion matrices and performance charts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
