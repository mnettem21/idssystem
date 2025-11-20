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
    lightgbm_params: JSON.stringify({}, null, 2),
    xgboost_params: JSON.stringify({}, null, 2),
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

      // Parse JSON fields with error handling
      let lightgbm_params = {}
      let xgboost_params = {}
      let catboost_params = { 'verbose': 0, 'boosting_type': 'Plain' }

      try {
        if (formData.lightgbm_params && formData.lightgbm_params.trim() !== '') {
          const parsed = JSON.parse(formData.lightgbm_params)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            lightgbm_params = parsed
          }
        }
      } catch (e) {
        throw new Error(`Invalid LightGBM parameters JSON: ${e.message}`)
      }

      try {
        if (formData.xgboost_params && formData.xgboost_params.trim() !== '') {
          const parsed = JSON.parse(formData.xgboost_params)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            xgboost_params = parsed
          }
        }
      } catch (e) {
        throw new Error(`Invalid XGBoost parameters JSON: ${e.message}`)
      }

      try {
        if (formData.catboost_params && formData.catboost_params.trim() !== '') {
          const parsed = JSON.parse(formData.catboost_params)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            catboost_params = parsed
            // Ensure required CatBoost parameters are set
            if (!('verbose' in catboost_params)) {
              catboost_params['verbose'] = 0
            }
            if (!('boosting_type' in catboost_params)) {
              catboost_params['boosting_type'] = 'Plain'
            }
          }
        }
      } catch (e) {
        throw new Error(`Invalid CatBoost parameters JSON: ${e.message}`)
      }

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
        lightgbm_params: lightgbm_params,
        xgboost_params: xgboost_params,
        catboost_params: catboost_params,
      }

      // Ensure we have a valid session before making the request
      let { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Session error: ' + sessionError.message)
      }
      
      if (!currentSession) {
        // Try to refresh the session
        console.log('No session found, attempting to refresh...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshedSession) {
          throw new Error('Your session has expired. Please log in again.')
        }
        currentSession = refreshedSession
      }

      console.log('Creating experiment with user:', user.id)
      console.log('Session exists:', !!currentSession)
      console.log('Session token length:', currentSession?.access_token?.length || 0)

      // Make the request with explicit error handling
      const { data, error } = await supabase
        .from('experiments')
        .insert([experimentData])
        .select()

      if (error) {
        console.error('Supabase insert error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        // Provide more helpful error messages
        if (error.code === 'PGRST301' || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          throw new Error('Authentication failed. Please refresh the page and log in again.')
        }
        throw error
      }

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
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Model Selection *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start p-3 bg-gray-700 border-2 rounded-lg cursor-pointer hover:bg-gray-600 transition"
                      style={{ borderColor: formData.algorithm === 'lccde' ? '#3b82f6' : '#4b5563' }}>
                      <input
                        type="radio"
                        name="algorithm"
                        value="lccde"
                        checked={formData.algorithm === 'lccde'}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <span className="text-white font-medium">LCCDE</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Leader Class & Confidence Decision Ensemble</p>
                        <p className="text-xs text-gray-500 mt-1">Uses LightGBM, XGBoost, CatBoost with leader model selection</p>
                      </div>
                    </label>

                    <label className="flex items-start p-3 bg-gray-700 border-2 rounded-lg cursor-pointer hover:bg-gray-600 transition"
                      style={{ borderColor: formData.algorithm === 'mth' ? '#3b82f6' : '#4b5563' }}>
                      <input
                        type="radio"
                        name="algorithm"
                        value="mth"
                        checked={formData.algorithm === 'mth'}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <span className="text-white font-medium">MTH-IDS</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Multi-Tiered Hybrid IDS</p>
                        <p className="text-xs text-gray-500 mt-1">Uses DT, RF, ET, XGBoost with information gain feature selection</p>
                      </div>
                    </label>

                    <label className="flex items-start p-3 bg-gray-700 border-2 rounded-lg cursor-pointer hover:bg-gray-600 transition"
                      style={{ borderColor: formData.algorithm === 'tree-based' ? '#3b82f6' : '#4b5563' }}>
                      <input
                        type="radio"
                        name="algorithm"
                        value="tree-based"
                        checked={formData.algorithm === 'tree-based'}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <span className="text-white font-medium">Tree-Based</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Feature Importance & Stacking</p>
                        <p className="text-xs text-gray-500 mt-1">Uses DT, RF, ET, XGBoost with average feature importance</p>
                      </div>
                    </label>
                  </div>
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
                    rows={4}
                    value={formData.lightgbm_params}
                    onChange={handleChange}
                    placeholder='{}'
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Leave empty {} for defaults. Example: {`{"n_estimators": 100, "learning_rate": 0.1, "max_depth": 7}`}
                  </p>
                </div>

                <div>
                  <label htmlFor="xgboost_params" className="block text-sm font-medium text-gray-300">
                    XGBoost Parameters (JSON)
                  </label>
                  <textarea
                    name="xgboost_params"
                    id="xgboost_params"
                    rows={4}
                    value={formData.xgboost_params}
                    onChange={handleChange}
                    placeholder='{}'
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Leave empty {} for defaults. Example: {`{"n_estimators": 100, "learning_rate": 0.1, "max_depth": 6}`}
                  </p>
                </div>

                <div>
                  <label htmlFor="catboost_params" className="block text-sm font-medium text-gray-300">
                    CatBoost Parameters (JSON)
                  </label>
                  <textarea
                    name="catboost_params"
                    id="catboost_params"
                    rows={4}
                    value={formData.catboost_params}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Default: {`{"verbose": 0, "boosting_type": "Plain"}`}. Example: {`{"iterations": 100, "learning_rate": 0.1, "depth": 6}`}
                  </p>
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
