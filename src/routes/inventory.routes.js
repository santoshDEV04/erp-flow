import express from "express";

import { getInventory, updateInventory } from "../controllers/inventory.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
const router = express.Router();

router.get(
    "/",
    authenticate,
    getInventory
);

router.patch(
    "/:productId",
    authenticate,
    authorize("ADMIN"),
    updateInventory
);

export default router;