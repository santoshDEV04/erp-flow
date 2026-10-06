import { useEffect, useState } from 'react'
import api from '../services/api'

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([])
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])

    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        enquiry_number: '',
        customer_id: '',
        enquiry_date: new Date().toISOString().split('T')[0],
        required_date: '',
        notes: '',
    })

    const [items, setItems] = useState([
        {
            product_id: '',
            quantity: 1,
        },
    ])

    useEffect(() => {
        fetchEnquiries()
        fetchCustomers()
        fetchProducts()
    }, [])

    const fetchEnquiries = async () => {
        try {
            const response = await api.get('/enquiries')
            setEnquiries(response.data.enquiries || [])
        } catch (error) {
            console.error(error)
        }
    }

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers')
            setCustomers(response.data.customers || [])
        } catch (error) {
            console.error(error)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await api.get('/inventory')
            setProducts(response.data.inventory || [])
        } catch (error) {
            console.error(error)
        }
    }

    const handleChange = e => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items]

        updatedItems[index][field] = value

        setItems(updatedItems)
    }

    const addItem = () => {
        setItems([
            ...items,
            {
                product_id: '',
                quantity: 1,
            },
        ])
    }

    const removeItem = index => {
        if (items.length === 1) return

        setItems(items.filter((_, i) => i !== index))
    }

    const handleSubmit = async e => {
        e.preventDefault()

        try {
            setLoading(true)
            setError('')

            const payload = {
                ...form,
                customer_id: Number(form.customer_id),
                items: items.map(item => ({
                    product_id: Number(item.product_id),
                    quantity: Number(item.quantity),
                })),
            }

            await api.post('/enquiries', payload)

            setShowForm(false)

            setForm({
                enquiry_number: '',
                customer_id: '',
                enquiry_date: new Date().toISOString().split('T')[0],
                required_date: '',
                notes: '',
            })

            setItems([
                {
                    product_id: '',
                    quantity: 1,
                },
            ])

            fetchEnquiries()
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create enquiry')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>

                    <p className="text-sm text-gray-500 mt-1">Manage customer enquiries</p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
                >
                    {showForm ? 'Close' : '+ New Enquiry'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-5">Create Enquiry</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Enquiry Number
                                </label>

                                <input
                                    name="enquiry_number"
                                    value={form.enquiry_number}
                                    onChange={handleChange}
                                    placeholder="ENQ-001"
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Customer</label>

                                <select
                                    name="customer_id"
                                    value={form.customer_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">Select customer</option>

                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Enquiry Date
                                </label>

                                <input
                                    type="date"
                                    name="enquiry_date"
                                    value={form.enquiry_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Required Date
                                </label>

                                <input
                                    type="date"
                                    name="required_date"
                                    value={form.required_date}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Notes</label>

                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                rows="3"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Optional notes"
                            />
                        </div>

                        {/* Products */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold">Products</h3>

                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-sm text-blue-600"
                                >
                                    + Add Product
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3"
                                    >
                                        <select
                                            value={item.product_id}
                                            onChange={e =>
                                                handleItemChange(
                                                    index,
                                                    'product_id',
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            <option value="">Select product</option>

                                            {products.map(product => (
                                                <option
                                                    key={product.product_id}
                                                    value={product.product_id}
                                                >
                                                    {product.product_code} - {product.name}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e =>
                                                handleItemChange(index, 'quantity', e.target.value)
                                            }
                                            className="w-28 border border-gray-300 rounded-md px-3 py-2"
                                        />

                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-600 px-2"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Enquiry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Enquiries table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h2 className="font-semibold">Enquiry List</h2>
                </div>

                {enquiries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No enquiries found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-5 py-3">Enquiry No</th>

                                    <th className="text-left px-5 py-3">Customer</th>

                                    <th className="text-left px-5 py-3">Date</th>

                                    <th className="text-left px-5 py-3">Required Date</th>

                                    <th className="text-left px-5 py-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {enquiries.map(enquiry => (
                                    <tr key={enquiry.id} className="border-b last:border-b-0">
                                        <td className="px-5 py-3 font-medium">
                                            {enquiry.enquiry_number}
                                        </td>

                                        <td className="px-5 py-3">{enquiry.company_name}</td>

                                        <td className="px-5 py-3">{enquiry.enquiry_date}</td>

                                        <td className="px-5 py-3">
                                            {enquiry.required_date || '-'}
                                        </td>

                                        <td className="px-5 py-3">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {enquiry.status}
                                            </span>
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

export default Enquiries
