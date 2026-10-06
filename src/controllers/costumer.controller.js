import query from "../db/query.js"

export const createCustomer = async (req, res) => {
    try {
        const {
            company_name,
            contact_person,
            mobile,
            email,
            city
        } = req.body;

        if(!company_name || !contact_person) {
            return res.status(400).json({
                message: "Company name and contact person are required"
            })
        }

        const result = await query(
            `insert into customers
            (company_name, contact_person, mobile, email, city)
            VALUES ($1, $2, $3, $4, $5)
            returning *`,
            [
                company_name,
                contact_person,
                mobile || null,
                email || null,
                city || null
            ]
        )

        return res.status(201).json({
            message: "Customer created successfully",
            customer: result.rows[0]
        })
    } catch (error) {
        console.error("Create customers error:", error);

        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

export const getCustomers = async (req, res) => {
    try {
        const result = await query(
            `SELECT
                id,
                company_name,
                contact_person,
                mobile,
                email,
                city,
                created_at
            FROM customers
            ORDER BY created_at DESC`
        );

        return res.status(200).json({
            customers: result.rows
        })
    } catch (error) {
        console.error("Get customers error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}