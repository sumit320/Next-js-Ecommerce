import expess from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import {
  createProduct,
  deleteProduct,
  fetchAllProductsForAdmin,
  getProductByID,
  updateProduct,
  getProductsForClient,
  searchProducts,
  getRelatedProducts,
} from "../controllers/productController";

const router = expess.Router();

// IMPORTANT: Specific routes must come BEFORE parameterized routes (/:id)
// Otherwise Express will match /:id first and never reach the specific routes

// Public endpoints - no authentication required (for browsing products)
router.get("/fetch-client-products", getProductsForClient);
router.get("/search", searchProducts);

// Protected endpoints - require authentication
// These must come before /:id routes
router.get(
  "/fetch-admin-products",
  authenticateJwt,
  isSuperAdmin,
  fetchAllProductsForAdmin
);

router.post(
  "/create-new-product",
  authenticateJwt,
  isSuperAdmin,
  upload.array("images", 5),
  createProduct
);

// Parameterized routes - must come AFTER specific routes
router.get("/:id/related", getRelatedProducts);
router.get("/:id", getProductByID);
router.put("/:id", authenticateJwt, isSuperAdmin, upload.array("images", 10), updateProduct);
router.delete("/:id", authenticateJwt, isSuperAdmin, deleteProduct);

export default router;
