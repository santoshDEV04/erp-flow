import pool from "../config/db.js";

export const createQuotation = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            quotation_number,
            enquiry_id,
            valid_until,
            items
        } = req.body;

        if (
            !quotation_number ||
            !enquiry_id ||
            !valid_until ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "Required quotation fields are missing"
            });
        }

        for (const item of items) {
            if (
                !item.product_id ||
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0
            ) {
                return res.status(400).json({
                    message: "Each item must have a valid product_id and positive quantity"
                });
            }

            if (
                item.discount_pct === undefined ||
                item.discount_pct < 0 ||
                item.discount_pct > 100
            ) {
                return res.status(400).json({
                    message: "Discount must be between 0 and 100"
                });
            }

            if (
                item.gst_pct === undefined ||
                item.gst_pct < 0 ||
                item.gst_pct > 100
            ) {
                return res.status(400).json({
                    message: "GST must be between 0 and 100"
                });
            }
        }

        const productIds = items.map(item => item.product_id);

        if (new Set(productIds).size !== productIds.length) {
            return res.status(400).json({
                message: "Duplicate products are not allowed"
            });
        }

        const enquiryResult = await client.query(
            `SELECT id, customer_id, status
            FROM enquiries
            WHERE id = $1`,
            [enquiry_id]
        );

        if (enquiryResult.rows.length === 0) {
            return res.status(404).json({
                message: "Enquiry not found"
            });
        }

        const enquiry = enquiryResult.rows[0];

        if (enquiry.status !== "NEW") {
            return res.status(400).json({
                message: "Only NEW enquiries can be converted into quotations"
            });
        }

        const enquiryItemsResult = await client.query(
            `SELECT
                ei.product_id,
                ei.quantity,
                p.product_code,
                p.name,
                p.base_price
            FROM enquiry_items ei
            JOIN products p
                ON ei.product_id = p.id
            WHERE ei.enquiry_id = $1`,
            [enquiry_id]
        );

        const enquiryItems = enquiryItemsResult.rows;

        const enquiryProductIds = new Set(
            enquiryItems.map(item => item.product_id)
        );

        for (const productId of productIds) {
            if (!enquiryProductIds.has(productId)) {
                return res.status(400).json({
                    message: `Product ${productId} does not belong to this enquiry`
                });
            }
        }

        const productMap = new Map(
            enquiryItems.map(item => [
                item.product_id,
                item
            ])
        );

        const quotationItems = items.map(item => {
            const product = productMap.get(item.product_id);

            const quantity = item.quantity;
            const unitPrice = Number(product.base_price);
            const discountPct = Number(item.discount_pct);
            const gstPct = Number(item.gst_pct);

            const grossAmount = quantity * unitPrice;

            const discountAmount =
                grossAmount * discountPct / 100;

            const taxableAmount =
                grossAmount - discountAmount;

            const gstAmount =
                taxableAmount * gstPct / 100;

            const lineAmount =
                taxableAmount + gstAmount;

            return {
                product_id: item.product_id,
                quantity,
                unit_price: unitPrice,
                discount_pct: discountPct,
                gst_pct: gstPct,
                line_amount: Number(lineAmount.toFixed(2))
            };
        });

        const grandTotal = Number(
            quotationItems
                .reduce(
                    (total, item) => total + item.line_amount,
                    0
                )
                .toFixed(2)
        );

        await client.query("BEGIN");

        const quotationResult = await client.query(
            `INSERT INTO quotations
            (
                quotation_number,
                enquiry_id,
                customer_id,
                valid_until,
                status,
                grand_total,
                created_by
            )
            VALUES ($1, $2, $3, $4, 'DRAFT', $5, $6)
            RETURNING *`,
            [
                quotation_number,
                enquiry_id,
                enquiry.customer_id,
                valid_until,
                grandTotal,
                req.user.id
            ]
        );

        const quotation = quotationResult.rows[0];

        for (const item of quotationItems) {
            await client.query(
                `INSERT INTO quotation_items
                (
                    quotation_id,
                    product_id,
                    quantity,
                    unit_price,
                    discount_pct,
                    gst_pct,
                    line_amount
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    quotation.id,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.discount_pct,
                    item.gst_pct,
                    item.line_amount
                ]
            );
        }

        await client.query(
            `UPDATE enquiries
             SET status = 'QUOTED'
             WHERE id = $1`,
            [enquiry_id]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Quotation created successfully",
            quotation,
            items: quotationItems
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Create quotation error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Quotation number already exists"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        client.release();
    }
};

export const updateQuotationStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "SENT",
            "ACCEPTED",
            "REJECTED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid quotation status"
            });
        }

        const quotationResult = await client.query(
            `SELECT id, status
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

        if (quotation.status === "DRAFT" && status !== "SENT") {
            return res.status(400).json({
                message: "DRAFT quotation can only be changed to SENT"
            });
        }

        if (quotation.status === "SENT" &&
            !["ACCEPTED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                message: "SENT quotation can only be ACCEPTED or REJECTED"
            });
        }

        if (quotation.status === "ACCEPTED" ||
            quotation.status === "REJECTED") {
            return res.status(400).json({
                message: "Quotation status cannot be changed after final decision"
            });
        }

        const result = await client.query(
            `UPDATE quotations
            SET status = $1
            WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        return res.status(200).json({
            message: "Quotation status updated successfully",
            quotation: result.rows[0]
        });

    } catch (error) {
        console.error("Update quotation status error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        client.release();
    }
};

export const getQuotations = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                q.id,
                q.quotation_number,
                q.valid_until,
                q.status,
                q.grand_total,
                q.created_at,

                e.id AS enquiry_id,
                e.enquiry_number,

                c.id AS customer_id,
                c.company_name,
                c.contact_person,

                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'product_id', p.id,
                            'product_code', p.product_code,
                            'product_name', p.name,
                            'quantity', qi.quantity,
                            'unit_price', qi.unit_price,
                            'discount_pct', qi.discount_pct,
                            'gst_pct', qi.gst_pct,
                            'line_amount', qi.line_amount
                        )
                    ) FILTER (WHERE qi.id IS NOT NULL),
                    '[]'
                ) AS items

            FROM quotations q

            JOIN enquiries e
                ON q.enquiry_id = e.id

            JOIN customers c
                ON q.customer_id = c.id

            LEFT JOIN quotation_items qi
                ON q.id = qi.quotation_id

            LEFT JOIN products p
                ON qi.product_id = p.id

            GROUP BY q.id, e.id, c.id

            ORDER BY q.created_at DESC`
        );

        return res.status(200).json({
            quotations: result.rows
        });

    } catch (error) {
        console.error("Get quotations error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};