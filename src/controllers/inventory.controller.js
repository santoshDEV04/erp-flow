import pool from "../config/db.js";

export const getInventory = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                i.id,
                p.id AS product_id,
                p.product_code,
                p.name,
                p.category,
                p.unit,
                p.base_price,
                i.physical_qty,
                i.reserved_qty,
                (i.physical_qty - i.reserved_qty) AS available_qty
            FROM inventory i
            JOIN products p
                ON i.product_id = p.id
            ORDER BY p.product_code`
        );

        return res.status(200).json({
            inventory: result.rows
        });

    } catch (error) {
        console.error("Get inventory error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const updateInventory = async (req, res) => {
    try {
        const { productId } = req.params;
        const { physical_qty } = req.body;

        if (physical_qty === undefined) {
            return res.status(400).json({
                message: "physical_qty is required"
            });
        }

        if (!Number.isInteger(physical_qty) || physical_qty < 0) {
            return res.status(400).json({
                message: "physical_qty must be a non-negative integer"
            });
        }

        const result = await pool.query(
            `SELECT
                physical_qty,
                reserved_qty
             FROM inventory
             WHERE product_id = $1`,
            [productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Inventory not found"
            });
        }

        const { reserved_qty } = result.rows[0];

        if (physical_qty < reserved_qty) {
            return res.status(400).json({
                message: `Physical quantity cannot be less than reserved quantity (${reserved_qty})`
            });
        }

        const updated = await pool.query(
            `UPDATE inventory
             SET physical_qty = $1
             WHERE product_id = $2
             RETURNING *`,
            [physical_qty, productId]
        );

        return res.status(200).json({
            message: "Inventory updated successfully",
            inventory: updated.rows[0]
        });

    } catch (error) {
        console.error("Update inventory error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};