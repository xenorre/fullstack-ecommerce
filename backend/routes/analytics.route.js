import express from "express";
import { analyticsData } from "../controllers/analytics.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("", protectRoute, adminRoute, analyticsData);

export default router;
