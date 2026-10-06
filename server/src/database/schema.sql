create table users (
    id serial primary key,
    name varchar(100) not null,
    email varchar(150) unique not null,
    password_hash text not null,
    role varchar(20) not null
        check (role in('ADMIN', 'SALES_USER')),
    created_at timestamp default current_timestamp
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(150),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    physical_qty INTEGER NOT NULL CHECK (physical_qty >= 0),
    reserved_qty INTEGER NOT NULL DEFAULT 0
        CHECK (reserved_qty >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);

CREATE TABLE enquiries (
    id SERIAL PRIMARY KEY,
    enquiry_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    enquiry_date DATE NOT NULL,
    required_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'QUOTED', 'WON', 'LOST')),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enquiry_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_enquiry_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);

CREATE TABLE enquiry_items (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),

    CONSTRAINT fk_enquiry_item_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enquiry_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_enquiry_product
        UNIQUE (enquiry_id, product_id)
);

CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    enquiry_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED')),
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (grand_total >= 0),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quotation_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id),

    CONSTRAINT fk_quotation_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_quotation_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);

CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (discount_pct >= 0 AND discount_pct <= 100),
    gst_pct NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (gst_pct >= 0 AND gst_pct <= 100),
    line_amount NUMERIC(12, 2) NOT NULL CHECK (line_amount >= 0),

    CONSTRAINT fk_quotation_item_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quotation_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_quotation_product
        UNIQUE (quotation_id, product_id)
);


CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'DISPATCHED', 'CANCELLED')),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_order_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id),

    CONSTRAINT fk_sales_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_sales_order_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT unique_sales_order_quotation
        UNIQUE (quotation_id)
);

CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_amount NUMERIC(12, 2) NOT NULL CHECK (line_amount >= 0),

    CONSTRAINT fk_sales_order_item_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sales_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_sales_order_product
        UNIQUE (sales_order_id, product_id)
);

CREATE TABLE dispatches (
    id SERIAL PRIMARY KEY,
    dispatch_number VARCHAR(50) UNIQUE NOT NULL,
    sales_order_id INTEGER NOT NULL,
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dispatch_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id),

    CONSTRAINT unique_dispatch_sales_order
        UNIQUE (sales_order_id)
);

CREATE TABLE dispatch_items (
    id SERIAL PRIMARY KEY,
    dispatch_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),

    CONSTRAINT fk_dispatch_item_dispatch
        FOREIGN KEY (dispatch_id)
        REFERENCES dispatches(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dispatch_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT unique_dispatch_product
        UNIQUE (dispatch_id, product_id)
);