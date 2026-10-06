import express from "express";

import {
    convertQuotationToSalesOrder,
    confirmSalesOrder,
    dispatchSalesOrder
} from "../controllers/salesOrder.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
    "/from-quotation/:id",
    authenticate,
    authorize("SALES_USER"),
    convertQuotationToSalesOrder
);

router.post(
    "/:id/confirm",
    authenticate,
    authorize("ADMIN"),
    confirmSalesOrder
);

router.post(
    "/:id/dispatch",
    authenticate,
    authorize("ADMIN"),
    dispatchSalesOrder
);

export default router;