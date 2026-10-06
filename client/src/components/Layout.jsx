import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Layout = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const linkClass = ({ isActive }) =>
        `block px-4 py-2 rounded-md text-sm ${
            isActive ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-100'
        }`

    const closeSidebar = () => {
        setSidebarOpen(false)
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={closeSidebar} />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static
                    inset-y-0 left-0
                    z-40
                    w-64
                    bg-white
                    border-r border-gray-200
                    flex flex-col
                    transform transition-transform
                    duration-200
                    md:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Logo */}
                <div className="px-5 py-5 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">ERPFlow</h1>

                        <p className="text-xs text-gray-500 mt-1">ERP Management System</p>
                    </div>

                    {/* Mobile close */}
                    <button onClick={closeSidebar} className="md:hidden text-gray-500 text-xl">
                        ×
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 flex-1">
                    <NavLink to="/" end className={linkClass} onClick={closeSidebar}>
                        Dashboard
                    </NavLink>

                    <NavLink to="/enquiries" className={linkClass} onClick={closeSidebar}>
                        Enquiries
                    </NavLink>

                    <NavLink to="/quotations" className={linkClass} onClick={closeSidebar}>
                        Quotations
                    </NavLink>

                    <NavLink to="/sales-orders" className={linkClass} onClick={closeSidebar}>
                        Sales Orders
                    </NavLink>

                    <NavLink to="/inventory" className={linkClass} onClick={closeSidebar}>
                        Inventory
                    </NavLink>
                </nav>

                {/* User */}
                <div className="border-t border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-800">{user?.role}</p>

                    <button
                        onClick={handleLogout}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6">
                    {/* Mobile menu */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden mr-4 text-gray-700"
                    >
                        ☰
                    </button>

                    <h2 className="text-lg font-semibold text-gray-800">ERPFlow</h2>
                </header>

                {/* Page */}
                <main className="p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout
