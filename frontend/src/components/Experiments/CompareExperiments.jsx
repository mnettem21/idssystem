import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CompareExperiments() {
  const [searchParams] = useSearchParams()
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [attackTypes, setAttackTypes] = useState([])

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',') || []
    if (ids.length > 0) {
      loadExperiments(ids)
    }
    loadAttackTypes()
  }, [searchParams])

  const loadExperiments = async (ids) => {
    try {
      const comparisons = []

      for (const id of ids) {
        const { data: expData, error: expError } = await supabase
          .from('experiments')
          .select('*')
          .eq('id', id)
          .single()

        if (expError) continue

        const { data: resultsData, error: resultsError } = await supabase
          .from('experiment_results')
          .select('*')
          .eq('experiment_id', id)

        if (resultsError) continue

        comparisons.push({
          experiment: expData,
          results: resultsData || [],
        })
      }

      setExperiments(comparisons)
    } catch (error) {
      console.error('Error loading experiments:', error)
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

  const prepareChartData = () => {
    const metrics = ['accuracy', 'precision', 'recall', 'f1_score']
    const chartData = []

    for (const metric of metrics) {
      const dataPoint = { metric: metric.charAt(0).toUpperCase() + metric.slice(1).replace('_', ' ') }

      experiments.forEach((exp, index) => {
        exp.results.forEach((result) => {
          const key = `${exp.experiment.name} - ${result.model_name}`
          dataPoint[key] = result[metric] * 100
        })
      })

      chartData.push(dataPoint)
    }

    return chartData
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

  const chartData = prepareChartData()

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-white mb-6">Compare Experiments</h2>

          {experiments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No experiments selected for comparison
            </div>
          ) : (
            <>
              {/* Performance Comparison Chart */}
              <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Performance Metrics Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="metric" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.375rem',
                      }}
                    />
                    <Legend />
                    {experiments.flatMap((exp, expIndex) =>
                      exp.results.map((result, resIndex) => {
                        const colors = [
                          '#3B82F6',
                          '#10B981',
                          '#F59E0B',
                          '#EF4444',
                          '#8B5CF6',
                          '#EC4899',
                        ]
                        const colorIndex = (expIndex * exp.results.length + resIndex) % colors.length
                        return (
                          <Bar
                            key={`${exp.experiment.id}-${result.model_name}`}
                            dataKey={`${exp.experiment.name} - ${result.model_name}`}
                            fill={colors[colorIndex]}
                          />
                        )
                      })
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Comparison Table */}
              <div className="bg-gray-800 shadow rounded-lg p-6 overflow-x-auto">
                <h3 className="text-lg font-medium text-white mb-4">Detailed Comparison</h3>
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Experiment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Accuracy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Precision
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Recall
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        F1 Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Training Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {experiments.flatMap((exp) =>
                      exp.results.map((result, index) => (
                        <tr key={`${exp.experiment.id}-${result.id}`}>
                          {index === 0 && (
                            <td
                              rowSpan={exp.results.length}
                              className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white"
                            >
                              {exp.experiment.name}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 uppercase">
                            {result.model_name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {(result.accuracy * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {(result.precision * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {(result.recall * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {(result.f1_score * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {result.training_time.toFixed(2)}s
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Configuration Comparison */}
              <div className="bg-gray-800 shadow rounded-lg p-6 mt-6">
                <h3 className="text-lg font-medium text-white mb-4">Configuration Comparison</h3>
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Experiment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Dataset
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Train/Test Split
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Random State
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        SMOTE
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {experiments.map((exp) => (
                      <tr key={exp.experiment.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {exp.experiment.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {exp.experiment.dataset_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {(exp.experiment.train_size * 100).toFixed(0)}% / {(exp.experiment.test_size * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {exp.experiment.random_state}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {exp.experiment.smote_enabled ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
