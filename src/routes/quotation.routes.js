import express from "express";
import { createQuotation, updateQuotationStatus } from "../controllers/quotation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("SALES_USER"),
    createQuotation
);

router.patch(
    "/:id/status",
    authenticate,
    authorize("SALES_USER"),
    updateQuotationStatus
);

export default router;