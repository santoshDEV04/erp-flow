import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
    const { user } = useAuth()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            <p className="mt-2 text-gray-600">Welcome to ERPFlow.</p>

            <div className="mt-6 border border-gray-200 bg-white rounded-lg p-5">
                <p>
                    Logged in as:
                    <span className="font-semibold ml-2">{user?.role}</span>
                </p>
            </div>
        </div>
    )
}

export default Dashboard
