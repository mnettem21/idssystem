import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CompareExperiments() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
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

  const getMetricRange = () => {
    const allValues = []
    experiments.forEach(exp => {
      exp.results.forEach(result => {
        allValues.push(result.accuracy * 100, result.precision * 100, result.recall * 100, result.f1_score * 100)
      })
    })

    if (allValues.length === 0) return [0, 100]

    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const range = max - min

    // Always zoom in to show differences - use padding based on range
    const padding = Math.max(1, range * 0.3) // At least 1% padding, or 30% of range
    const yMin = Math.max(0, Math.floor(min - padding))
    const yMax = Math.min(100, Math.ceil(max + padding))

    return [yMin, yMax]
  }


  const getBestResult = (metric) => {
    let best = { value: 0, expName: '', modelName: '' }
    experiments.forEach(exp => {
      exp.results.forEach(result => {
        const value = result[metric] * 100
        if (value > best.value) {
          best = { value, expName: exp.experiment.name, modelName: result.model_name }
        }
      })
    })
    return best
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
  const metricRange = getMetricRange()

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white">Compare Experiments</h2>
            </div>
          </div>

          {experiments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No experiments selected for comparison
            </div>
          ) : (
            <>
              {/* Best Performers Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {['accuracy', 'precision', 'recall', 'f1_score'].map(metric => {
                  const best = getBestResult(metric)
                  return (
                    <div key={metric} className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                        Best {metric.replace('_', ' ')}
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {best.value.toFixed(4)}%
                      </div>
                      <div className="text-xs text-gray-400">
                        {best.expName}
                      </div>
                      <div className="text-xs text-green-400 uppercase">
                        {best.modelName}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Performance Comparison Chart - Zoomed */}
              <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Performance Metrics Comparison</h3>
                  <div className="text-xs text-gray-400">
                    Y-axis zoomed to show differences
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="metric" stroke="#9CA3AF" />
                    <YAxis
                      stroke="#9CA3AF"
                      domain={metricRange}
                      tickFormatter={(value) => Number(value).toFixed(2) + '%'}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.375rem',
                      }}
                      formatter={(value) => value.toFixed(4) + '%'}
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
                        Time (s)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {experiments.flatMap((exp) =>
                      exp.results.map((result, index) => {
                        const isBestAccuracy = result.accuracy === Math.max(...experiments.flatMap(e => e.results.map(r => r.accuracy)))
                        const isBestPrecision = result.precision === Math.max(...experiments.flatMap(e => e.results.map(r => r.precision)))
                        const isBestRecall = result.recall === Math.max(...experiments.flatMap(e => e.results.map(r => r.recall)))
                        const isBestF1 = result.f1_score === Math.max(...experiments.flatMap(e => e.results.map(r => r.f1_score)))
                        const isFastestTime = result.training_time === Math.min(...experiments.flatMap(e => e.results.map(r => r.training_time)))

                        return (
                          <tr key={`${exp.experiment.id}-${result.id}`} className="hover:bg-gray-750">
                            {index === 0 && (
                              <td
                                rowSpan={exp.results.length}
                                className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white"
                              >
                                {exp.experiment.name}
                              </td>
                            )}
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 uppercase font-medium">
                              {result.model_name}
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${isBestAccuracy ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                              {(result.accuracy * 100).toFixed(4)}%
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${isBestPrecision ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                              {(result.precision * 100).toFixed(4)}%
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${isBestRecall ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                              {(result.recall * 100).toFixed(4)}%
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${isBestF1 ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                              {(result.f1_score * 100).toFixed(4)}%
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${isFastestTime ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}>
                              {result.training_time.toFixed(2)}s
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
                <div className="mt-4 text-xs text-gray-400">
                  <span className="text-green-400 font-semibold">Green</span> = Best performance metric • <span className="text-blue-400 font-semibold">Blue</span> = Fastest training time
                </div>
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
