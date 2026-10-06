import pool from "../config/db.js"

export const createQuotation = async (req, res) => {
    try {
        const { enquiry_id } = req.body;

        const result = await pool.query(
            `select ei.product_id,
            ei.quantity,
                p.product_code,
                p.name,
                p.base_price
            FROM enquiry_items ei
            JOIN products p
                ON ei.product_id = p.id
            WHERE ei.enquiry_id = $1`,
            [enquiry_id]
        )

        return res.status(200).json({
            items: result.rows
        })


    } catch (error) {
        console.error("Quotation query error: ", error);

        return res.status(500).json({
            message: 'Internal server error'
        })
    }
}