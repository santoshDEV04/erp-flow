import { useEffect, useState } from 'react'
import api from '../services/api'

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([])
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])

    const [showForm, setShowForm] = useState(false)
    const [showCustomerForm, setShowCustomerForm] = useState(false)

    const [loading, setLoading] = useState(false)
    const [creatingCustomer, setCreatingCustomer] = useState(false)
    const [error, setError] = useState('')
    const [customerError, setCustomerError] = useState('')

    const [form, setForm] = useState({
        enquiry_number: '',
        customer_id: '',
        enquiry_date: new Date().toISOString().split('T')[0],
        required_date: '',
        notes: '',
    })

    const [customerForm, setCustomerForm] = useState({
        company_name: '',
        contact_person: '',
        mobile: '',
        email: '',
        city: '',
    })

    const [items, setItems] = useState([
        {
            product_id: '',
            quantity: 1,
        },
    ])

    // Load initial page data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [enquiriesResponse, customersResponse, productsResponse] = await Promise.all([
                    api.get('/enquiries'),
                    api.get('/customers'),
                    api.get('/inventory'),
                ])

                setEnquiries(enquiriesResponse.data.enquiries || [])
                setCustomers(customersResponse.data.customers || [])
                setProducts(productsResponse.data.inventory || [])
            } catch (error) {
                console.error(error)
            }
        }

        loadData()
    }, [])

    const fetchEnquiries = async () => {
        try {
            const response = await api.get('/enquiries')
            setEnquiries(response.data.enquiries || [])
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

    const handleCustomerChange = e => {
        setCustomerForm({
            ...customerForm,
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

    const createCustomer = async e => {
        e.preventDefault()

        try {
            setCreatingCustomer(true)
            setCustomerError('')

            if (!customerForm.company_name.trim()) {
                setCustomerError('Company name is required')
                return
            }

            if (!customerForm.contact_person.trim()) {
                setCustomerError('Contact person is required')
                return
            }

            const response = await api.post('/customers', {
                company_name: customerForm.company_name.trim(),
                contact_person: customerForm.contact_person.trim(),
                mobile: customerForm.mobile.trim(),
                email: customerForm.email.trim(),
                city: customerForm.city.trim(),
            })

            const newCustomer = response.data.customer

            if (!newCustomer) {
                throw new Error('Customer was created but the server did not return customer data')
            }

            // Add the new customer to the dropdown
            setCustomers(prev => [newCustomer, ...prev])

            // Automatically select the newly created customer
            setForm(prev => ({
                ...prev,
                customer_id: String(newCustomer.id),
            }))

            // Reset customer form
            setCustomerForm({
                company_name: '',
                contact_person: '',
                mobile: '',
                email: '',
                city: '',
            })

            setShowCustomerForm(false)
        } catch (error) {
            console.error(error)

            setCustomerError(error.response?.data?.message || 'Failed to create customer')
        } finally {
            setCreatingCustomer(false)
        }
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

            setShowCustomerForm(false)

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
                    onClick={() => {
                        setShowForm(!showForm)
                        setError('')
                    }}
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
                            {/* Enquiry Number */}
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

                            {/* Customer */}
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

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomerForm(!showCustomerForm)
                                        setCustomerError('')
                                    }}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                    {showCustomerForm
                                        ? '− Close Customer Form'
                                        : '+ Add New Customer'}
                                </button>
                            </div>

                            {/* Enquiry Date */}
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

                            {/* Required Date */}
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

                        {/* Add Customer Form */}
                        {showCustomerForm && (
                            <div className="mt-5 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Add New Customer
                                        </h3>

                                        <p className="text-xs text-gray-500 mt-1">
                                            Create a customer without leaving the enquiry form.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowCustomerForm(false)}
                                        className="text-sm text-gray-500 hover:text-gray-700 self-start sm:self-auto"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {customerError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                                        {customerError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Company Name */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Company Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="company_name"
                                            value={customerForm.company_name}
                                            onChange={handleCustomerChange}
                                            placeholder="ABC Technologies"
                                            required
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    {/* Contact Person */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Contact Person *
                                        </label>

                                        <input
                                            type="text"
                                            name="contact_person"
                                            value={customerForm.contact_person}
                                            onChange={handleCustomerChange}
                                            placeholder="Rahul Sharma"
                                            required
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    {/* Mobile */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Mobile
                                        </label>

                                        <input
                                            type="text"
                                            name="mobile"
                                            value={customerForm.mobile}
                                            onChange={handleCustomerChange}
                                            placeholder="9876543210"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={customerForm.email}
                                            onChange={handleCustomerChange}
                                            placeholder="contact@example.com"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            City
                                        </label>

                                        <input
                                            type="text"
                                            name="city"
                                            value={customerForm.city}
                                            onChange={handleCustomerChange}
                                            placeholder="Bhubaneswar"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={createCustomer}
                                        disabled={creatingCustomer}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                                    >
                                        {creatingCustomer ? 'Creating...' : 'Create Customer'}
                                    </button>
                                </div>
                            </div>
                        )}

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
                                            className="w-full sm:w-28 border border-gray-300 rounded-md px-3 py-2"
                                        />

                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-600 px-2 text-left sm:text-center"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
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
