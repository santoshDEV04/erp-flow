import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const SalesOrders = () => {
    const { user } = useAuth()

    const [orders, setOrders] = useState([])
    const [quotations, setQuotations] = useState([])
    const [showForm, setShowForm] = useState(false)

    const [form, setForm] = useState({
        quotation_id: '',
        order_number: '',
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchOrders()
        fetchQuotations()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/sales-orders')
            setOrders(response.data.salesOrders || [])
        } catch (error) {
            console.error('Failed to fetch orders:', error)
        }
    }

    const fetchQuotations = async () => {
        try {
            const response = await api.get('/quotations')

            const accepted = (response.data.quotations || []).filter(
                quotation => quotation.status === 'ACCEPTED'
            )

            setQuotations(accepted)
        } catch (error) {
            console.error('Failed to fetch quotations:', error)
        }
    }

    const handleChange = e => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const createSalesOrder = async e => {
        e.preventDefault()

        try {
            setLoading(true)
            setError('')

            await api.post(`/sales-orders/from-quotation/${form.quotation_id}`, {
                order_number: form.order_number,
            })

            setForm({
                quotation_id: '',
                order_number: '',
            })

            setShowForm(false)

            await fetchOrders()
            await fetchQuotations()
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create sales order')
        } finally {
            setLoading(false)
        }
    }

    const confirmOrder = async orderId => {
        try {
            await api.post(`/sales-orders/${orderId}/confirm`)

            await fetchOrders()
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to confirm order')
        }
    }

    const dispatchOrder = async orderId => {
        const dispatchNumber = window.prompt('Enter dispatch number:')

        if (!dispatchNumber) return

        const vehicleNumber = window.prompt('Enter vehicle number:')

        if (!vehicleNumber) return

        const driverName = window.prompt('Enter driver name:')

        if (!driverName) return

        try {
            await api.post(`/sales-orders/${orderId}/dispatch`, {
                dispatch_number: dispatchNumber,
                vehicle_number: vehicleNumber,
                driver_name: driverName,
            })

            await fetchOrders()
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to dispatch order')
        }
    }

    return (
        <div>
            {/* Header */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage orders and inventory workflow
                    </p>
                </div>

                {user?.role === 'SALES_USER' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
                    >
                        {showForm ? 'Close' : '+ New Sales Order'}
                    </button>
                )}
            </div>

            {/* Create Sales Order */}

            {showForm && user?.role === 'SALES_USER' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-5">Create Sales Order</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    {quotations.length === 0 ? (
                        <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600">
                            No accepted quotations are available.
                        </div>
                    ) : (
                        <form onSubmit={createSalesOrder}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Order Number
                                    </label>

                                    <input
                                        name="order_number"
                                        value={form.order_number}
                                        onChange={handleChange}
                                        placeholder="SO-001"
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Accepted Quotation
                                    </label>

                                    <select
                                        name="quotation_id"
                                        value={form.quotation_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">Select quotation</option>

                                        {quotations.map(quotation => (
                                            <option key={quotation.id} value={quotation.id}>
                                                {quotation.quotation_number} -{' '}
                                                {quotation.company_name} - ₹
                                                {Number(quotation.grand_total).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Sales Order'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Orders */}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h2 className="font-semibold">Sales Order List</h2>
                </div>

                {orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No sales orders found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Order No
                                    </th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Customer
                                    </th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Quotation
                                    </th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">Total</th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Status
                                    </th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b last:border-b-0">
                                        <td className="px-5 py-3 font-medium whitespace-nowrap">
                                            {order.order_number}
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {order.company_name}
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {order.quotation_number}
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            ₹ {Number(order.total_amount).toFixed(2)}
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {order.status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {user?.role === 'ADMIN' &&
                                                order.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => confirmOrder(order.id)}
                                                        className="text-blue-600 mr-3"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}

                                            {user?.role === 'ADMIN' &&
                                                order.status === 'CONFIRMED' && (
                                                    <button
                                                        onClick={() => dispatchOrder(order.id)}
                                                        className="text-green-600"
                                                    >
                                                        Dispatch
                                                    </button>
                                                )}

                                            {order.status === 'DISPATCHED' && (
                                                <span className="text-gray-500">Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SalesOrders
