# ERPFlow

ERPFlow is a full-stack ERP workflow application built for managing the complete sales lifecycle:

**Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**

The project was built with a focus on backend business logic, PostgreSQL relationships, JWT authentication, role-based access control, validation, and transaction-safe inventory operations.

---

## 1. Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- REST APIs
- JWT authentication
- bcrypt password hashing

### Database
- PostgreSQL
- `pg` PostgreSQL driver
- Raw SQL queries
- Transactions with `BEGIN / COMMIT / ROLLBACK`
- Foreign keys and database constraints

---

## 2. Core Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Backend role-based access control
- Roles:
  - `ADMIN`
  - `SALES_USER`
- Frontend restrictions are backed by server-side authorization

### Customer & Enquiry Management
- Create customers
- Create enquiries
- Add multiple products to an enquiry
- Enquiry status workflow:
  - `NEW`
  - `QUOTED`
  - `WON`
  - `LOST`

### Quotation Management
- Create quotations from enquiries
- Multiple quotation line items
- Product quantity
- Unit price
- Discount percentage
- GST percentage
- Backend-calculated line amounts and grand total
- Quotation status workflow:
  - `DRAFT`
  - `SENT`
  - `ACCEPTED`
  - `REJECTED`

### Sales Orders
- Convert accepted quotations into sales orders
- Rejected/draft quotations cannot create orders
- One quotation can generate only one sales order
- Order status workflow:
  - `PENDING`
  - `CONFIRMED`
  - `DISPATCHED`
  - `CANCELLED`

### Inventory
- Physical stock
- Reserved stock
- Available stock

```text
Available = Physical Quantity - Reserved Quantity
```

Inventory is checked by the backend before confirming a sales order.

### Inventory Reservation
When an Admin confirms a pending sales order:
1. Inventory rows are locked inside a database transaction.
2. Available stock is calculated.
3. The requested quantity is checked against available stock.
4. Reserved quantity is increased.
5. The order becomes `CONFIRMED`.

This prevents conflicting requests from both successfully reserving the same stock.

### Dispatch
When an Admin dispatches a confirmed order:
1. The order is locked inside a transaction.
2. Reserved stock is validated.
3. Physical quantity is reduced.
4. Reserved quantity is reduced.
5. Dispatch and dispatch items are created.
6. The sales order becomes `DISPATCHED`.

---

## 3. Business Workflow

```text
Customer
   ↓
Enquiry
   ↓
Quotation
   ↓
Accepted Quotation
   ↓
Sales Order (PENDING)
   ↓
Admin Confirmation
   ↓
Inventory Reservation
   ↓
Sales Order (CONFIRMED)
   ↓
Admin Dispatch
   ↓
Physical Stock Decreased
   ↓
Sales Order (DISPATCHED)
```

### Traceability

Every stage remains connected:

```text
Customer
   ↓
Enquiry
   ↓
Quotation
   ↓
Sales Order
   ↓
Dispatch
```

This makes it possible to trace an order back to its original customer enquiry and quotation.

---

## 4. Role Permissions

| Operation | ADMIN | SALES_USER |
|---|:---:|:---:|
| Login | ✓ | ✓ |
| View customers | ✓ | ✓ |
| Create customers | ✓ | ✓ |
| View enquiries | ✓ | ✓ |
| Create enquiries | — | ✓ |
| View quotations | ✓ | ✓ |
| Create quotations | — | ✓ |
| Update quotation status | — | ✓ |
| View sales orders | ✓ | ✓ |
| Convert accepted quotation | — | ✓ |
| Confirm sales order | ✓ | — |
| Dispatch sales order | ✓ | — |
| View inventory | ✓ | ✓ |

All restricted operations are enforced by backend middleware.

---

## 5. Database Design

The application uses a normalized relational PostgreSQL schema.

### Main tables

- `users`
- `customers`
- `products`
- `inventory`
- `enquiries`
- `enquiry_items`
- `quotations`
- `quotation_items`
- `sales_orders`
- `sales_order_items`
- `dispatches`
- `dispatch_items`

See [`ER_DIAGRAM.md`](./ER_DIAGRAM.md) for the complete relationship diagram.

---

## 6. Important Database Constraints

The database itself protects important business rules in addition to backend validation.

Examples:

- Unique user emails
- Unique product codes
- Unique enquiry numbers
- Unique quotation numbers
- Unique sales order numbers
- Unique dispatch numbers
- Positive quantities
- Non-negative inventory quantities
- Valid enum-like status values using PostgreSQL `CHECK` constraints
- Foreign keys between related entities
- One inventory record per product
- One sales order per quotation
- One dispatch per sales order

For example:

```sql
CONSTRAINT unique_sales_order_quotation UNIQUE(quotation_id)
```

prevents the same quotation from accidentally generating multiple sales orders.

---

## 7. Transaction-Safe Inventory Logic

Inventory confirmation uses a PostgreSQL transaction and row-level locking.

Conceptually:

```sql
BEGIN;

SELECT physical_qty, reserved_qty
FROM inventory
WHERE product_id = $1
FOR UPDATE;
```

Then:

```text
available = physical_qty - reserved_qty
```

If:

```text
requested_quantity > available
```

the transaction is rolled back.

Otherwise:

```sql
UPDATE inventory
SET reserved_qty = reserved_qty + $1
WHERE product_id = $2;
```

and the order is confirmed.

Finally:

```sql
COMMIT;
```

This is important because inventory operations must be safe even when multiple requests arrive at nearly the same time.

---

## 8. Project Structure

```text
erp-flow/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── server/
│   ├── database/
│   │   └── schema.sql
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── db/
│   │   │   └── query.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   └── role.middleware.js
│   │   ├── routes/
│   │   └── app.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── API.md
├── ER_DIAGRAM.md
└── README.md
```

---

## 9. Prerequisites

Install:

- Node.js 18+
- PostgreSQL 14+
- npm

Verify:

```bash
node --version
npm --version
psql --version
```

---

## 10. Database Setup

Create the database:

```sql
CREATE DATABASE erp_flow;
```

Then execute:

```text
server/database/schema.sql
```

The schema creates all required tables, relationships, constraints, and indexes/unique constraints defined by the application.

Seed at least six products and inventory records.

Example products:

```text
P001 - Laptop
P002 - Desktop PC
P003 - Monitor
P004 - Keyboard
P005 - Mouse
P006 - Printer
```

---

## 11. Environment Variables

Create:

```text
server/.env
```

Add:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_flow
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

JWT_SECRET=YOUR_SECRET_KEY
```

Do not commit `.env` to Git.

---

## 12. Backend Setup

```bash
cd server
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/
```

Expected:

```json
{
  "message": "ERPFlow API is running"
}
```

---

## 13. Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Vite normally runs the frontend on:

```text
http://localhost:5173
```

---

## 14. Login

The project uses JWT authentication.

A successful login returns an access token. The frontend stores the token and Axios automatically sends:

```http
Authorization: Bearer <token>
```

on protected API requests.

### Demo Admin

```text
Email: admin@erpflow.com
Password: Admin@123
Role: ADMIN
```

For a Sales User, use the Sales User account created in the local database/setup.

---

## 15. API Documentation

See [`API.md`](./API.md) for the complete endpoint reference.

Base URL:

```text
http://localhost:5000/api
```

Main endpoint groups:

```text
/auth
/customers
/enquiries
/quotations
/sales-orders
/inventory
```

---

## 16. Validation & Error Handling

Validation is performed on the backend before database operations.

Examples:

- Required fields
- Positive quantities
- Duplicate products inside a transaction document
- Valid product/customer references
- Valid quotation status transitions
- Accepted quotation requirement for sales order creation
- Inventory availability
- Duplicate sales order prevention
- Duplicate dispatch prevention
- Role authorization

Errors return appropriate HTTP status codes such as:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

---

## 17. Frontend Screens

The application contains:

- Login
- Dashboard
- Enquiries
- Quotations
- Sales Orders
- Inventory

The UI is intentionally simple and responsive so the business workflow remains the focus.

---

## 18. Testing Checklist

Recommended verification:

- [x] Login with valid credentials
- [x] Protected API rejects missing/invalid JWT
- [x] Unauthorized role receives `403`
- [x] Create enquiry
- [x] Create quotation
- [x] Backend calculates quotation total
- [x] Accept quotation
- [x] Convert quotation into sales order
- [x] Confirm sales order
- [x] Reserve inventory
- [x] Dispatch confirmed order
- [x] Physical stock decreases after dispatch
- [x] Reserved stock decreases after dispatch
- [x] Duplicate sales order is prevented by backend/database constraint
- [x] Inventory cannot be reserved beyond available quantity

---

## 19. API / Postman Documentation

The API can be tested using Postman or any REST client.

Recommended flow:

```text
1. Login
2. Copy JWT
3. Create customer
4. Create enquiry
5. Create quotation
6. Change quotation DRAFT → SENT
7. Change quotation SENT → ACCEPTED
8. Convert quotation → Sales Order
9. Login as ADMIN
10. Confirm Sales Order
11. Check Inventory
12. Dispatch Sales Order
13. Check Inventory again
```

---

## 20. Design Decisions

### Why PostgreSQL?

The ERP workflow contains strongly related entities and requires transactional consistency.

Examples:

```text
Customer → Enquiry → Quotation → Sales Order → Dispatch
```

PostgreSQL provides:

- Foreign keys
- Unique constraints
- Check constraints
- Transactions
- Row-level locking
- Strong relational consistency

These are particularly useful for inventory reservation and order processing.

### Why raw SQL with `pg`?

The project intentionally uses direct PostgreSQL queries instead of an ORM to keep the database operations explicit and demonstrate understanding of:

- SQL
- JOINs
- Foreign keys
- Transactions
- Row locking
- Aggregation
- Database constraints

---

## 21. Security Considerations

- Passwords are hashed with bcrypt.
- JWT secrets are stored in environment variables.
- JWT authentication protects private APIs.
- Authorization is enforced on the backend.
- User role is determined server-side and cannot be selected by a public registration request.
- SQL values are parameterized instead of concatenating user input directly into queries.
- Database constraints provide an additional layer of protection against invalid state.

---

## 22. Future Improvements

Possible production extensions:

- Refresh-token rotation
- Password reset/email verification
- Pagination and advanced filtering
- Audit log for inventory/order changes
- Automated API tests
- Swagger/OpenAPI documentation
- Docker deployment
- CI/CD pipeline
- Partial/multiple dispatch support
- Inventory adjustment workflow
- Damaged stock tracking
- Order cancellation with automatic reservation release

These are outside the core case-study implementation.

---

## 23. Demo Flow

For the final demonstration, show:

```text
Login
  ↓
Create Customer / Enquiry
  ↓
Create Quotation
  ↓
Send Quotation
  ↓
Accept Quotation
  ↓
Create Sales Order
  ↓
Admin Login
  ↓
Confirm Sales Order
  ↓
Show Reserved Inventory
  ↓
Dispatch Order
  ↓
Show Updated Inventory
```

This demonstrates the complete business workflow and the most important backend logic.

---

## 24. License

This project was created as a technical case-study/project submission.
