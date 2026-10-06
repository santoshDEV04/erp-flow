# ERPFlow API Documentation

Base URL:

```text
http://localhost:5000/api
```

Authentication:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 1. Authentication

## POST `/auth/login`

Authenticate a user and receive a JWT.

### Request

```json
{
  "email": "admin@erpflow.com",
  "password": "Admin@123"
}
```

### Response

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "role": "ADMIN"
  },
  "token": "<JWT_TOKEN>"
}
```

Use the returned token for protected requests.

---

# 2. Customers

## POST `/customers`

Create a customer.

### Authentication

Required.

### Request

```json
{
  "company_name": "ABC Technologies",
  "contact_person": "Rahul Sharma",
  "mobile": "9876543210",
  "email": "rahul@example.com",
  "city": "Bhubaneswar"
}
```

### Response

```json
{
  "message": "Customer created successfully",
  "customer": {
    "id": 1,
    "company_name": "ABC Technologies"
  }
}
```

---

## GET `/customers`

Get all customers.

### Authentication

Required.

### Response

```json
{
  "customers": []
}
```

---

# 3. Enquiries

## POST `/enquiries`

Create a new customer enquiry.

### Authentication

Required.

### Role

`SALES_USER`

### Request

```json
{
  "enquiry_number": "ENQ-ERP-001",
  "customer_id": 1,
  "enquiry_date": "2026-10-06",
  "required_date": "2026-10-20",
  "notes": "Customer requires delivery before month end.",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 5
    }
  ]
}
```

### Business Rules

- Customer must exist.
- Products must exist.
- Quantity must be greater than zero.
- The same product cannot be repeated in one enquiry.
- New enquiries start with status `NEW`.

### Response

```json
{
  "message": "Enquiry created successfully",
  "enquiry": {}
}
```

---

## GET `/enquiries`

Get enquiries with customer and item information.

### Authentication

Required.

### Response

```json
{
  "enquiries": []
}
```

---

# 4. Quotations

## POST `/quotations`

Create a quotation from a `NEW` enquiry.

### Authentication

Required.

### Role

`SALES_USER`

### Request

```json
{
  "quotation_number": "QUO-ERP-001",
  "enquiry_id": 1,
  "valid_until": "2026-10-20",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "discount_pct": 10,
      "gst_pct": 18
    },
    {
      "product_id": 3,
      "quantity": 5,
      "discount_pct": 5,
      "gst_pct": 18
    }
  ]
}
```

### Calculation

The backend obtains the product base price from PostgreSQL.

For each line:

```text
Gross = Quantity × Unit Price

Discount Amount = Gross × Discount %

Taxable Amount = Gross − Discount Amount

GST Amount = Taxable Amount × GST %

Line Amount = Taxable Amount + GST Amount
```

Then:

```text
Grand Total = Sum of all Line Amounts
```

The frontend does not control the final amount.

### Business Rules

- Enquiry must exist.
- Enquiry must be in `NEW` status.
- Products must belong to the enquiry.
- Quantity must be positive.
- Discount must be between `0` and `100`.
- GST must be between `0` and `100`.
- Duplicate products in the quotation are rejected.
- Quotation starts as `DRAFT`.
- The related enquiry becomes `QUOTED`.

---

## GET `/quotations`

Get all quotations with customer, enquiry and item details.

### Authentication

Required.

### Response

```json
{
  "quotations": []
}
```

---

## PATCH `/quotations/:id/status`

Change quotation status.

### Authentication

Required.

### Role

`SALES_USER`

### Request

```json
{
  "status": "SENT"
}
```

Allowed transitions:

```text
DRAFT → SENT
SENT  → ACCEPTED
SENT  → REJECTED
```

Final states cannot be changed through the normal status endpoint.

### Examples

Send:

```json
{
  "status": "SENT"
}
```

Accept:

```json
{
  "status": "ACCEPTED"
}
```

Reject:

```json
{
  "status": "REJECTED"
}
```

---

# 5. Sales Orders

## POST `/sales-orders/from-quotation/:id`

Create a sales order from an accepted quotation.

### Authentication

Required.

### Role

`SALES_USER`

### URL

```text
POST /api/sales-orders/from-quotation/1
```

### Business Rules

- Quotation must exist.
- Quotation must have status `ACCEPTED`.
- Quotation must contain items.
- The quotation cannot already have a sales order.
- Quotation items are copied into the sales order.
- New sales orders start as `PENDING`.

### Response

```json
{
  "message": "Sales order created successfully",
  "salesOrder": {}
}
```

### Duplicate protection

The database contains:

```sql
UNIQUE(quotation_id)
```

Therefore the same quotation cannot generate multiple sales orders.

---

## GET `/sales-orders`

Get all sales orders.

### Authentication

Required.

### Response

```json
{
  "salesOrders": []
}
```

---

## POST `/sales-orders/:id/confirm`

Confirm a pending sales order and reserve inventory.

### Authentication

Required.

### Role

`ADMIN`

### URL

```text
POST /api/sales-orders/1/confirm
```

### Request body

No body required.

### Business Rules

- Order must be `PENDING`.
- Inventory is checked for every order item.
- Available quantity is:

```text
Available = Physical − Reserved
```

- Requested quantity cannot exceed available quantity.
- Inventory rows are locked using PostgreSQL `FOR UPDATE`.
- Reservation and order status update happen in one transaction.

### Successful response

```json
{
  "message": "Sales order confirmed and inventory reserved successfully"
}
```

### Example

Before:

```text
Physical: 100
Reserved: 30
Available: 70
```

Order requests:

```text
60
```

After confirmation:

```text
Physical: 100
Reserved: 90
Available: 10
```

Physical stock does not decrease during reservation.

---

## POST `/sales-orders/:id/dispatch`

Dispatch a confirmed sales order.

### Authentication

Required.

### Role

`ADMIN`

### Request

```json
{
  "dispatch_number": "DSP-ERP-001",
  "vehicle_number": "OD02AB1234",
  "driver_name": "Amit Kumar"
}
```

### Business Rules

- Order must be `CONFIRMED`.
- A dispatch cannot be created twice for the same order.
- Dispatch quantity cannot exceed reserved quantity.
- Physical quantity decreases.
- Reserved quantity decreases.
- Dispatch records are created.
- Sales order becomes `DISPATCHED`.
- All changes happen in one transaction.

### Example

Before dispatch:

```text
Physical: 100
Reserved: 60
Available: 40
```

After dispatching 60:

```text
Physical: 40
Reserved: 0
Available: 40
```

---

# 6. Inventory

## GET `/inventory`

Get current inventory.

### Authentication

Required.

### Response

```json
{
  "inventory": [
    {
      "id": 1,
      "product_id": 1,
      "product_code": "P001",
      "name": "Laptop",
      "category": "Electronics",
      "unit": "PCS",
      "base_price": "55000.00",
      "physical_qty": 100,
      "reserved_qty": 20,
      "available_qty": 80
    }
  ]
}
```

Available quantity is calculated by the backend:

```text
available_qty = physical_qty - reserved_qty
```

---

# 7. Status Workflows

## Enquiry

```text
NEW
 ↓
QUOTED
 ↓
WON / LOST
```

## Quotation

```text
DRAFT
  ↓
SENT
  ↓
ACCEPTED / REJECTED
```

## Sales Order

```text
PENDING
   ↓
CONFIRMED
   ↓
DISPATCHED
```

Alternative terminal state:

```text
PENDING → CANCELLED
```

---

# 8. HTTP Status Codes

| Status | Meaning |
|---|---|
| `200` | Successful request |
| `201` | Resource created |
| `400` | Invalid request/business validation |
| `401` | Authentication required/invalid token |
| `403` | User does not have permission |
| `404` | Resource not found |
| `409` | Business conflict/duplicate operation |
| `500` | Internal server error |

---

# 9. Authorization Matrix

| Endpoint | ADMIN | SALES_USER |
|---|:---:|:---:|
| `POST /customers` | ✓ | ✓ |
| `GET /customers` | ✓ | ✓ |
| `POST /enquiries` | — | ✓ |
| `GET /enquiries` | ✓ | ✓ |
| `POST /quotations` | — | ✓ |
| `GET /quotations` | ✓ | ✓ |
| `PATCH /quotations/:id/status` | — | ✓ |
| `POST /sales-orders/from-quotation/:id` | — | ✓ |
| `GET /sales-orders` | ✓ | ✓ |
| `POST /sales-orders/:id/confirm` | ✓ | — |
| `POST /sales-orders/:id/dispatch` | ✓ | — |
| `GET /inventory` | ✓ | ✓ |

---

# 10. Recommended API Test Sequence

Use this sequence for a complete Postman demonstration:

```text
1. POST /auth/login
2. POST /customers
3. POST /enquiries
4. POST /quotations
5. PATCH /quotations/:id/status
      status = SENT
6. PATCH /quotations/:id/status
      status = ACCEPTED
7. POST /sales-orders/from-quotation/:id
8. Login as ADMIN
9. POST /sales-orders/:id/confirm
10. GET /inventory
11. POST /sales-orders/:id/dispatch
12. GET /inventory
```

Expected business flow:

```text
Enquiry
   ↓
Quotation
   ↓
Accepted
   ↓
Sales Order
   ↓
Inventory Reserved
   ↓
Confirmed
   ↓
Dispatch
   ↓
Physical Stock Reduced
```
