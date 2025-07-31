import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getRecommendedProducts,
  toggleFeaturedProduct,
} from "../controllers/product.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommended", getRecommendedProducts);

router.post(
  "/",
  upload.single("image"),
  protectRoute,
  adminRoute,
  createProduct
);

router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);

router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
