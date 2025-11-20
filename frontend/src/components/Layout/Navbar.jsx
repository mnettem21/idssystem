import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xl font-bold text-white hover:text-blue-300 transition cursor-pointer"
            >
              IDS ML Experiments
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/experiments/history')}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              History
            </button>
            <span className="text-gray-300 text-sm">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
