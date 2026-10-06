import express from "express";
import { createEnquiry } from "../controllers/enquiry.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("SALES_USER"),
    createEnquiry
);

export default router;