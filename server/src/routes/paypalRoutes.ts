import express from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import {
  createPaypalOrder,
  capturePaypalOrder,
} from "../controllers/paypalController";

const router = express.Router();

// Apply authentication middleware
router.use(authenticateJwt);

// PayPal routes
router.post("/create-order", createPaypalOrder);
router.post("/capture-order", capturePaypalOrder);

export default router;

