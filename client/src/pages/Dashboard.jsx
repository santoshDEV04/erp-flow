import { useEffect, useState } from 'react'
import api from '../services/api'

const Dashboard = () => {
    const [stats, setStats] = useState({
        enquiries: 0,
        quotations: 0,
        salesOrders: 0,
        inventoryItems: 0,
    })

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [enquiriesResponse, quotationsResponse, ordersResponse, inventoryResponse] =
                    await Promise.all([
                        api.get('/enquiries'),
                        api.get('/quotations'),
                        api.get('/sales-orders'),
                        api.get('/inventory'),
                    ])

                setStats({
                    enquiries: enquiriesResponse.data.enquiries?.length || 0,

                    quotations: quotationsResponse.data.quotations?.length || 0,

                    salesOrders: ordersResponse.data.salesOrders?.length || 0,

                    inventoryItems: inventoryResponse.data.inventory?.length || 0,
                })
            } catch (error) {
                console.error('Failed to load dashboard:', error)
            } finally {
                setLoading(false)
            }
        }

        loadDashboard()
    }, [])

    const cards = [
        {
            title: 'Enquiries',
            value: stats.enquiries,
        },
        {
            title: 'Quotations',
            value: stats.quotations,
        },
        {
            title: 'Sales Orders',
            value: stats.salesOrders,
        },
        {
            title: 'Inventory Items',
            value: stats.inventoryItems,
        },
    ]

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

                <p className="text-sm text-gray-500 mt-1">Overview of your ERP operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(card => (
                    <div
                        key={card.title}
                        className="bg-white border border-gray-200 rounded-lg p-5"
                    >
                        <p className="text-sm text-gray-500">{card.title}</p>

                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {loading ? '...' : card.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="font-semibold text-gray-900">ERP Workflow</h2>

                <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-2">
                    <span>Customer</span>
                    <span>→</span>

                    <span>Enquiry</span>
                    <span>→</span>

                    <span>Quotation</span>
                    <span>→</span>

                    <span>Sales Order</span>
                    <span>→</span>

                    <span>Reservation</span>
                    <span>→</span>

                    <span>Dispatch</span>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
