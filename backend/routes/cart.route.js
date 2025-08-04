import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  addToCart,
  getCartItems,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", protectRoute, getCartItems);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, removeAllFromCart);
router.put("/:id", protectRoute, updateQuantity);

export default router;
