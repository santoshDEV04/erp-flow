INSERT INTO users (name, email, password_hash, role)
VALUES
('Admin User', 'admin@erpflow.com', 'TEMP_HASH', 'ADMIN'),
('Sales User', 'sales@erpflow.com', 'TEMP_HASH', 'SALES_USER');


INSERT INTO products
(product_code, name, category, unit, base_price)
VALUES
('P001', 'Laptop', 'Electronics', 'PCS', 55000),
('P002', 'Desktop PC', 'Electronics', 'PCS', 45000),
('P003', 'Monitor', 'Electronics', 'PCS', 12000),
('P004', 'Keyboard', 'Accessories', 'PCS', 1500),
('P005', 'Mouse', 'Accessories', 'PCS', 800),
('P006', 'Printer', 'Office Equipment', 'PCS', 15000);


INSERT INTO inventory (product_id, physical_qty, reserved_qty)
SELECT id, 100, 0
FROM products;