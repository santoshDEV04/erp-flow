import express from 'express'
import cors from 'cors'
import authRoutes from "./routes/auth.routes.js"
import costumerRoutes from "./routes/customer.routes.js"
import enquiryRoutes from "./routes/enquiry.routes.js"

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.json({
        message: 'ERPflow is running'
    })
})

app.use("/api/auth", authRoutes);
app.use("/api/customers", costumerRoutes)
app.use("/api/enquiries", enquiryRoutes)

export default app;