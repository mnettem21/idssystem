import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function RerunModal({ isOpen, onClose, onSelectExperiment }) {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadExperiments()
    }
  }, [isOpen])

  const loadExperiments = async () => {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExperiments(data || [])
    } catch (error) {
      console.error('Error loading experiments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExperiments = experiments.filter(exp =>
    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.algorithm?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getAlgorithmDisplay = (algorithm) => {
    if (algorithm === 'lccde') return 'LCCDE'
    if (algorithm === 'mth') return 'MTH-IDS'
    if (algorithm === 'tree-based') return 'Tree-Based'
    return 'LCCDE'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Rerun Experiment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">Select a completed experiment to rerun with the same parameters</p>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search experiments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading experiments...</div>
          ) : filteredExperiments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchTerm ? 'No experiments found matching your search' : 'No completed experiments found'}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {filteredExperiments.map((experiment) => (
                  <div
                    key={experiment.id}
                    onClick={() => {
                      onSelectExperiment(experiment)
                      onClose()
                    }}
                    className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white font-medium">{experiment.name}</span>
                          <span className="text-xs text-gray-400">{getAlgorithmDisplay(experiment.algorithm)}</span>
                        </div>
                        {experiment.description && (
                          <p className="text-sm text-gray-400 mb-2">{experiment.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Dataset: {experiment.dataset_name}</span>
                          <span>Created: {formatDate(experiment.created_at)}</span>
                          {experiment.completed_at && (
                            <span>Completed: {formatDate(experiment.completed_at)}</span>
                          )}
                        </div>
                      </div>
                      <button className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Rerun
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

