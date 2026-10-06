import pool from "../config/db.js";

export const createEnquiry = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            enquiry_number,
            customer_id,
            enquiry_date,
            required_date,
            notes,
            items
        } = req.body;

        if (
            !enquiry_number ||
            !customer_id ||
            !enquiry_date ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "Required enquiry fields are missing"
            });
        }

        const invalidItem = items.find(
            (item) =>
                !item.product_id ||
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0
        );

        if (invalidItem) {
            return res.status(400).json({
                message: "Each item must have a valid product_id and positive quantity"
            });
        }

        const productIds = items.map((item) => item.product_id);

        const uniqueProductIds = new Set(productIds);

        if (uniqueProductIds.size !== productIds.length) {
            return res.status(400).json({
                message: "Duplicate products are not allowed in an enquiry"
            });
        }

        const productResult = await client.query(
            `SELECT id
            FROM products
            WHERE id = ANY($1)`,
            [productIds]
        );

        const existingProductIds = new Set(
            productResult.rows.map((product) => product.id)
        );

        const missingProductIds = productIds.filter(
            (id) => !existingProductIds.has(id)
        );

        if (missingProductIds.length > 0) {
            return res.status(404).json({
                message: "One or more products not found",
                productIds: missingProductIds
            });
        }

        const customerResult = await client.query(
            `SELECT id
            FROM customers
            WHERE id = $1`,
            [customer_id]
        );

        if (customerResult.rows.length === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        await client.query("BEGIN");

        const enquiryResult = await client.query(
            `INSERT INTO enquiries
            (
                enquiry_number,
                customer_id,
                enquiry_date,
                required_date,
                notes,
                status,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, 'NEW', $6)
            RETURNING *`,
            [
                enquiry_number,
                customer_id,
                enquiry_date,
                required_date || null,
                notes || null,
                req.user.id
            ]
        );

        const enquiry = enquiryResult.rows[0];

        for (const item of items) {
            await client.query(
                `INSERT INTO enquiry_items
                (
                    enquiry_id,
                    product_id,
                    quantity
                )
                VALUES ($1, $2, $3)`,
                [
                    enquiry.id,
                    item.product_id,
                    item.quantity
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Enquiry created successfully",
            enquiry
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Create enquiry error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Enquiry number already exists"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        client.release();
    }
};