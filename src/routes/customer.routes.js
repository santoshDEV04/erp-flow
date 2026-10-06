import express from 'express'
import { createCustomer } from '../controllers/costumer.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router();
router.post("/", authenticate, createCustomer)

export default router;