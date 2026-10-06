import { useEffect, useState } from 'react'
import api from '../services/api'

const Quotations = () => {
    const [quotations, setQuotations] = useState([])
    const [enquiries, setEnquiries] = useState([])
    const [inventory, setInventory] = useState([])

    const [showForm, setShowForm] = useState(false)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        quotation_number: '',
        enquiry_id: '',
        valid_until: '',
    })

    const [items, setItems] = useState([
        {
            product_id: '',
            quantity: 1,
            discount_pct: 0,
            gst_pct: 18,
        },
    ])

    useEffect(() => {
        fetchQuotations()
        fetchEnquiries()
        fetchInventory()
    }, [])

    const fetchQuotations = async () => {
        try {
            const response = await api.get('/quotations')

            setQuotations(response.data.quotations || [])
        } catch (error) {
            console.error('Failed to fetch quotations:', error)
        }
    }

    const fetchEnquiries = async () => {
        try {
            const response = await api.get('/enquiries')

            const newEnquiries = (response.data.enquiries || []).filter(
                enquiry => enquiry.status === 'NEW'
            )

            setEnquiries(newEnquiries)
        } catch (error) {
            console.error('Failed to fetch enquiries:', error)
        }
    }

    const fetchInventory = async () => {
        try {
            const response = await api.get('/inventory')

            setInventory(response.data.inventory || [])
        } catch (error) {
            console.error('Failed to fetch inventory:', error)
        }
    }

    const handleFormChange = e => {
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
                discount_pct: 0,
                gst_pct: 18,
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
                quotation_number: form.quotation_number,
                enquiry_id: Number(form.enquiry_id),
                valid_until: form.valid_until,

                items: items.map(item => ({
                    product_id: Number(item.product_id),
                    quantity: Number(item.quantity),
                    discount_pct: Number(item.discount_pct),
                    gst_pct: Number(item.gst_pct),
                })),
            }

            await api.post('/quotations', payload)

            setShowForm(false)

            setForm({
                quotation_number: '',
                enquiry_id: '',
                valid_until: '',
            })

            setItems([
                {
                    product_id: '',
                    quantity: 1,
                    discount_pct: 0,
                    gst_pct: 18,
                },
            ])

            await fetchQuotations()
            await fetchEnquiries()
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create quotation')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/quotations/${id}/status`, {
                status,
            })

            fetchQuotations()
            fetchEnquiries()
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update quotation')
        }
    }

    return (
        <div>
            {/* Header */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Create and manage customer quotations
                    </p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
                >
                    {showForm ? 'Close' : '+ New Quotation'}
                </button>
            </div>

            {/* Create quotation */}

            {showForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-5">Create Quotation</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Quotation Number
                                </label>

                                <input
                                    name="quotation_number"
                                    value={form.quotation_number}
                                    onChange={handleFormChange}
                                    placeholder="QUO-001"
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Enquiry</label>

                                <select
                                    name="enquiry_id"
                                    value={form.enquiry_id}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">Select enquiry</option>

                                    {enquiries.map(enquiry => (
                                        <option key={enquiry.id} value={enquiry.id}>
                                            {enquiry.enquiry_number} - {enquiry.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Valid Until
                                </label>

                                <input
                                    type="date"
                                    name="valid_until"
                                    value={form.valid_until}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
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

                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3"
                                >
                                    <select
                                        value={item.product_id}
                                        onChange={e =>
                                            handleItemChange(index, 'product_id', e.target.value)
                                        }
                                        required
                                        className="border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">Select product</option>

                                        {inventory.map(product => (
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
                                        placeholder="Quantity"
                                        className="border border-gray-300 rounded-md px-3 py-2"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.discount_pct}
                                        onChange={e =>
                                            handleItemChange(index, 'discount_pct', e.target.value)
                                        }
                                        placeholder="Discount %"
                                        className="border border-gray-300 rounded-md px-3 py-2"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.gst_pct}
                                        onChange={e =>
                                            handleItemChange(index, 'gst_pct', e.target.value)
                                        }
                                        placeholder="GST %"
                                        className="border border-gray-300 rounded-md px-3 py-2"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="border border-red-200 text-red-600 rounded-md px-3 py-2 disabled:opacity-30"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Quotation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Quotation table */}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h2 className="font-semibold">Quotation List</h2>
                </div>

                {quotations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No quotations found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-5 py-3">Quotation No</th>

                                    <th className="text-left px-5 py-3">Enquiry</th>

                                    <th className="text-left px-5 py-3">Customer</th>

                                    <th className="text-left px-5 py-3">Total</th>

                                    <th className="text-left px-5 py-3">Status</th>

                                    <th className="text-left px-5 py-3">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {quotations.map(quotation => (
                                    <tr key={quotation.id} className="border-b last:border-b-0">
                                        <td className="px-5 py-3 font-medium">
                                            {quotation.quotation_number}
                                        </td>

                                        <td className="px-5 py-3">{quotation.enquiry_number}</td>

                                        <td className="px-5 py-3">{quotation.company_name}</td>

                                        <td className="px-5 py-3">
                                            ₹ {Number(quotation.grand_total).toFixed(2)}
                                        </td>

                                        <td className="px-5 py-3">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {quotation.status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-3">
                                            {quotation.status === 'DRAFT' && (
                                                <button
                                                    onClick={() =>
                                                        updateStatus(quotation.id, 'SENT')
                                                    }
                                                    className="text-blue-600 mr-3"
                                                >
                                                    Send
                                                </button>
                                            )}

                                            {quotation.status === 'SENT' && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            updateStatus(quotation.id, 'ACCEPTED')
                                                        }
                                                        className="text-green-600 mr-3"
                                                    >
                                                        Accept
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            updateStatus(quotation.id, 'REJECTED')
                                                        }
                                                        className="text-red-600"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
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

export default Quotations
