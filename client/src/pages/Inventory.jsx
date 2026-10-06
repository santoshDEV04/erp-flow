import { useEffect, useState } from 'react'
import api from '../services/api'

const Inventory = () => {
    const [inventory, setInventory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchInventory = async () => {
        try {
            setLoading(true)

            const response = await api.get('/inventory')

            setInventory(response.data.inventory || [])
        } catch (error) {
            console.error('Failed to fetch inventory:', error)

            setError(error.response?.data?.message || 'Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInventory()
    }, [])

    return (
        <div>
            {/* Header */}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

                <p className="text-sm text-gray-500 mt-1">
                    View current physical, reserved and available stock
                </p>
            </div>

            {/* Error */}

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {error}
                </div>
            )}

            {/* Inventory */}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="font-semibold">Inventory Stock</h2>

                    <button
                        onClick={fetchInventory}
                        className="border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50 w-full sm:w-auto"
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading inventory...</div>
                ) : inventory.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No inventory found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Product Code
                                    </th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Product
                                    </th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">
                                        Category
                                    </th>

                                    <th className="text-left px-5 py-3 whitespace-nowrap">Unit</th>

                                    <th className="text-right px-5 py-3 whitespace-nowrap">
                                        Physical
                                    </th>

                                    <th className="text-right px-5 py-3 whitespace-nowrap">
                                        Reserved
                                    </th>

                                    <th className="text-right px-5 py-3 whitespace-nowrap">
                                        Available
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item.id} className="border-b last:border-b-0">
                                        <td className="px-5 py-3 font-medium whitespace-nowrap">
                                            {item.product_code}
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">{item.name}</td>

                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {item.category}
                                        </td>

                                        <td className="px-5 py-3 whitespace-nowrap">{item.unit}</td>

                                        <td className="px-5 py-3 text-right whitespace-nowrap">
                                            {item.physical_qty}
                                        </td>

                                        <td className="px-5 py-3 text-right whitespace-nowrap">
                                            {item.reserved_qty}
                                        </td>

                                        <td className="px-5 py-3 text-right font-medium whitespace-nowrap">
                                            {item.available_qty}
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

export default Inventory
