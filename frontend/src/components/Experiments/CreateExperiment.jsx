import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../Layout/Navbar'

export default function CreateExperiment() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    algorithm: 'lccde',
    dataset_name: 'CICIDS2017_sample_km.csv',
    train_size: 0.8,
    test_size: 0.2,
    random_state: 0,
    smote_enabled: true,
    smote_sampling_strategy: JSON.stringify({ '2': 1000, '4': 1000 }, null, 2),
    feature_selection_enabled: true,
    lightgbm_params: '{}',
    xgboost_params: '{}',
    catboost_params: JSON.stringify({ 'verbose': 0, 'boosting_type': 'Plain' }, null, 2),
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create an experiment')
      }

      // Parse JSON fields
      const experimentData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        algorithm: formData.algorithm,
        dataset_name: formData.dataset_name,
        train_size: parseFloat(formData.train_size),
        test_size: parseFloat(formData.test_size),
        random_state: parseInt(formData.random_state),
        smote_enabled: formData.smote_enabled,
        smote_sampling_strategy: JSON.parse(formData.smote_sampling_strategy),
        feature_selection_enabled: formData.feature_selection_enabled,
        lightgbm_params: JSON.parse(formData.lightgbm_params || '{}'),
        xgboost_params: JSON.parse(formData.xgboost_params || '{}'),
        catboost_params: JSON.parse(formData.catboost_params),
      }

      const { data, error } = await supabase
        .from('experiments')
        .insert([experimentData])
        .select()

      if (error) throw error

      navigate(`/experiments/${data[0].id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with Back Button */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white">Create New Experiment</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Experiment Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="algorithm" className="block text-sm font-medium text-gray-300">
                    Algorithm *
                  </label>
                  <select
                    name="algorithm"
                    id="algorithm"
                    value={formData.algorithm}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="lccde">LCCDE - Leader Class & Confidence Decision Ensemble</option>
                    <option value="mth">MTH-IDS - Multi-Tiered Hybrid IDS</option>
                    <option value="tree-based">Tree-Based IDS - Feature Importance & Stacking</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.algorithm === 'lccde' && 'Uses LightGBM, XGBoost, CatBoost with leader model selection'}
                    {formData.algorithm === 'mth' && 'Uses DT, RF, ET, XGBoost with information gain feature selection'}
                    {formData.algorithm === 'tree-based' && 'Uses DT, RF, ET, XGBoost with average feature importance'}
                  </p>
                </div>

                <div>
                  <label htmlFor="dataset_name" className="block text-sm font-medium text-gray-300">
                    Dataset
                  </label>
                  <select
                    name="dataset_name"
                    id="dataset_name"
                    value={formData.dataset_name}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CICIDS2017_sample_km.csv">CICIDS2017 Sample (k-means)</option>
                    <option value="CICIDS2017_sample.csv">CICIDS2017 Sample</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Split Configuration */}
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Data Split Configuration</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="train_size" className="block text-sm font-medium text-gray-300">
                    Train Size
                  </label>
                  <input
                    type="number"
                    name="train_size"
                    id="train_size"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.train_size}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="test_size" className="block text-sm font-medium text-gray-300">
                    Test Size
                  </label>
                  <input
                    type="number"
                    name="test_size"
                    id="test_size"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.test_size}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="random_state" className="block text-sm font-medium text-gray-300">
                    Random State
                  </label>
                  <input
                    type="number"
                    name="random_state"
                    id="random_state"
                    value={formData.random_state}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SMOTE Configuration */}
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">SMOTE Configuration</h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="smote_enabled"
                    id="smote_enabled"
                    checked={formData.smote_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label htmlFor="smote_enabled" className="ml-2 block text-sm text-gray-300">
                    Enable SMOTE
                  </label>
                </div>

                {formData.smote_enabled && (
                  <div>
                    <label htmlFor="smote_sampling_strategy" className="block text-sm font-medium text-gray-300">
                      Sampling Strategy (JSON)
                    </label>
                    <textarea
                      name="smote_sampling_strategy"
                      id="smote_sampling_strategy"
                      rows={3}
                      value={formData.smote_sampling_strategy}
                      onChange={handleChange}
                      className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Format: {`{"2": 1000, "4": 1000}`} (class label: number of samples)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Selection Configuration */}
            {(formData.algorithm === 'mth' || formData.algorithm === 'tree-based') && (
              <div className="bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Feature Selection</h3>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="feature_selection_enabled"
                    id="feature_selection_enabled"
                    checked={formData.feature_selection_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label htmlFor="feature_selection_enabled" className="ml-2 block text-sm text-gray-300">
                    Enable Feature Selection
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {formData.algorithm === 'mth' && 'Uses Information Gain to select top features (90% cumulative importance)'}
                  {formData.algorithm === 'tree-based' && 'Uses average feature importance from all models (90% cumulative importance)'}
                </p>
              </div>
            )}

            {/* Model Parameters */}
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Model Parameters (Optional)</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="lightgbm_params" className="block text-sm font-medium text-gray-300">
                    LightGBM Parameters (JSON)
                  </label>
                  <textarea
                    name="lightgbm_params"
                    id="lightgbm_params"
                    rows={3}
                    value={formData.lightgbm_params}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="xgboost_params" className="block text-sm font-medium text-gray-300">
                    XGBoost Parameters (JSON)
                  </label>
                  <textarea
                    name="xgboost_params"
                    id="xgboost_params"
                    rows={3}
                    value={formData.xgboost_params}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="catboost_params" className="block text-sm font-medium text-gray-300">
                    CatBoost Parameters (JSON)
                  </label>
                  <textarea
                    name="catboost_params"
                    id="catboost_params"
                    rows={3}
                    value={formData.catboost_params}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-900 bg-opacity-50 p-4">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Experiment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
