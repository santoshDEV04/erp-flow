import pool from "../config/db.js";

export const convertQuotationToSalesOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { order_number } = req.body;

        if (!order_number) {
            return res.status(400).json({
                message: "Order number is required"
            });
        }

        const quotationResult = await client.query(
            `SELECT
                id,
                customer_id,
                status,
                grand_total
            FROM quotations
            WHERE id = $1`,
            [id]
        );

        if (quotationResult.rows.length === 0) {
            return res.status(404).json({
                message: "Quotation not found"
            });
        }

        const quotation = quotationResult.rows[0];

        if (quotation.status !== "ACCEPTED") {
            return res.status(400).json({
                message: "Only ACCEPTED quotations can create a Sales Order"
            });
        }

        const existingOrder = await client.query(
            `SELECT id, order_number, status
            FROM sales_orders
            WHERE quotation_id = $1`,
            [id]
        );

        if (existingOrder.rows.length > 0) {
            return res.status(409).json({
                message: "A Sales Order already exists for this quotation",
                salesOrder: existingOrder.rows[0]
            });
        }

        const quotationItemsResult = await client.query(
            `SELECT
                product_id,
                quantity,
                unit_price,
                line_amount
             FROM quotation_items
             WHERE quotation_id = $1`,
            [id]
        );

        if (quotationItemsResult.rows.length === 0) {
            return res.status(400).json({
                message: "Quotation has no items"
            });
        }

        const quotationItems = quotationItemsResult.rows;

        await client.query("BEGIN");

        const orderResult = await client.query(
            `INSERT INTO sales_orders
            (
                order_number,
                quotation_id,
                customer_id,
                order_date,
                total_amount,
                status,
                created_by
            )
            VALUES ($1, $2, $3, CURRENT_DATE, $4, 'PENDING', $5)
            RETURNING *`,
            [
                order_number,
                quotation.id,
                quotation.customer_id,
                quotation.grand_total,
                req.user.id
            ]
        );

        const salesOrder = orderResult.rows[0];

        for (const item of quotationItems) {
            await client.query(
                `INSERT INTO sales_order_items
                (
                    sales_order_id,
                    product_id,
                    quantity,
                    unit_price,
                    line_amount
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    salesOrder.id,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.line_amount
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Sales Order created successfully",
            salesOrder
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Convert quotation to Sales Order error:",
            error
        );

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A Sales Order already exists for this quotation or order number already exists"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        client.release();
    }
};

export const confirmSalesOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT id, status
            FROM sales_orders
            WHERE id = $1
            FOR UPDATE`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Sales Order not found"
            });
        }

        const order = orderResult.rows[0];

        if (order.status !== "PENDING") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Only PENDING orders can be confirmed"
            });
        }

        const itemsResult = await client.query(
            `SELECT product_id, quantity
             FROM sales_order_items
             WHERE sales_order_id = $1`,
            [id]
        );

        if (itemsResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Sales Order has no items"
            });
        }

        for (const item of itemsResult.rows) {
            const inventoryResult = await client.query(
                `SELECT
                    id,
                    product_id,
                    physical_qty,
                    reserved_qty,
                    (physical_qty - reserved_qty) AS available_qty
                 FROM inventory
                 WHERE product_id = $1
                 FOR UPDATE`,
                [item.product_id]
            );

            if (inventoryResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    message: `Inventory not found for product ${item.product_id}`
                });
            }

            const inventory = inventoryResult.rows[0];

            if (Number(item.quantity) > Number(inventory.available_qty)) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: `Insufficient inventory for product ${item.product_id}`,
                    available: Number(inventory.available_qty),
                    requested: Number(item.quantity)
                });
            }

            await client.query(
                `UPDATE inventory
                 SET reserved_qty = reserved_qty + $1
                 WHERE product_id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // 5. Confirm order
        const updatedOrder = await client.query(
            `UPDATE sales_orders
             SET status = 'CONFIRMED'
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Sales Order confirmed and inventory reserved successfully",
            salesOrder: updatedOrder.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Confirm Sales Order error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};

export const dispatchSalesOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const {
            dispatch_number,
            vehicle_number,
            driver_name
        } = req.body;

        if (!dispatch_number) {
            return res.status(400).json({
                message: "Dispatch number is required"
            });
        }

        await client.query("BEGIN");

        // 1. Check Sales Order
        const orderResult = await client.query(
            `SELECT id, status
             FROM sales_orders
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Sales Order not found"
            });
        }

        const order = orderResult.rows[0];

        if (order.status !== "CONFIRMED") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Only CONFIRMED orders can be dispatched"
            });
        }

        const itemsResult = await client.query(
            `SELECT product_id, quantity
             FROM sales_order_items
             WHERE sales_order_id = $1`,
            [id]
        );

        if (itemsResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Sales Order has no items"
            });
        }

        const dispatchResult = await client.query(
            `INSERT INTO dispatches
            (
                dispatch_number,
                sales_order_id,
                dispatch_date,
                vehicle_number,
                driver_name
            )
            VALUES ($1, $2, CURRENT_DATE, $3, $4)
            RETURNING *`,
            [
                dispatch_number,
                id,
                vehicle_number || null,
                driver_name || null
            ]
        );

        const dispatch = dispatchResult.rows[0];

        for (const item of itemsResult.rows) {

            const inventoryResult = await client.query(
                `SELECT
                    product_id,
                    physical_qty,
                    reserved_qty
                 FROM inventory
                 WHERE product_id = $1
                 FOR UPDATE`,
                [item.product_id]
            );

            if (inventoryResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: `Inventory not found for product ${item.product_id}`
                });
            }

            const inventory = inventoryResult.rows[0];

            if (Number(item.quantity) > Number(inventory.reserved_qty)) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: `Cannot dispatch more than reserved quantity for product ${item.product_id}`
                });
            }

            await client.query(
                `UPDATE inventory
                 SET
                    physical_qty = physical_qty - $1,
                    reserved_qty = reserved_qty - $1
                 WHERE product_id = $2`,
                [
                    item.quantity,
                    item.product_id
                ]
            );

            await client.query(
                `INSERT INTO dispatch_items
                (
                    dispatch_id,
                    product_id,
                    quantity
                )
                VALUES ($1, $2, $3)`,
                [
                    dispatch.id,
                    item.product_id,
                    item.quantity
                ]
            );
        }

        const updatedOrder = await client.query(
            `UPDATE sales_orders
             SET status = 'DISPATCHED'
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Sales Order dispatched successfully",
            dispatch,
            salesOrder: updatedOrder.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Dispatch Sales Order error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Dispatch already exists for this Sales Order or dispatch number already exists"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        client.release();
    }
};