import express from 'express'
import { createCustomer, getCustomers } from '../controllers/costumer.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router();
router.post("/", authenticate, createCustomer)
router.get('/', authenticate, getCustomers);

export default router;