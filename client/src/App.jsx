import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Enquiries from './pages/Enquiries.jsx'
import Quotations from './pages/Quotations.jsx'
import SalesOrders from './pages/SalesOrders.jsx'
import Inventory from './pages/Inventory.jsx'

import ProtectedRoute from './components/ProtectedRoutes.jsx'
import Layout from './components/Layout.jsx'

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />

                    <Route path="enquiries" element={<Enquiries />} />

                    <Route path="quotations" element={<Quotations />} />

                    <Route path="sales-orders" element={<SalesOrders />} />

                    <Route path="inventory" element={<Inventory />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
