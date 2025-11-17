import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import {
  addFeatureBanners,
  fetchFeatureBanners,
  getFeaturedProducts,
  updateFeaturedProducts,
  updateBanner,
  deleteBanner,
  addGridItems,
  fetchGridItems,
  updateGridItem,
  deleteGridItem,
  addOrUpdateListingPageBanner,
  fetchListingPageBanner,
  deleteListingPageBanner,
  getGridSectionSettings,
  updateGridSectionSettings,
} from "../controllers/settingsController";

const router = express.Router();

router.post(
  "/banners",
  authenticateJwt,
  isSuperAdmin,
  upload.array("images", 5),
  addFeatureBanners
);

// Public endpoints - no authentication required
router.get("/get-banners", fetchFeatureBanners);
router.get("/fetch-feature-products", getFeaturedProducts);

// Protected endpoints - require authentication
router.post(
  "/update-feature-products",
  authenticateJwt,
  isSuperAdmin,
  updateFeaturedProducts
);

router.put(
  "/banners/:id",
  authenticateJwt,
  isSuperAdmin,
  updateBanner
);

router.delete(
  "/banners/:id",
  authenticateJwt,
  isSuperAdmin,
  deleteBanner
);

// Grid Items Routes
router.post(
  "/grid-items",
  authenticateJwt,
  isSuperAdmin,
  upload.array("images", 10),
  addGridItems
);

router.get("/get-grid-items", fetchGridItems);

router.put(
  "/grid-items/:id",
  authenticateJwt,
  isSuperAdmin,
  upload.single("image"),
  updateGridItem
);

router.delete(
  "/grid-items/:id",
  authenticateJwt,
  isSuperAdmin,
  deleteGridItem
);

// Listing Page Banner Routes
router.post(
  "/listing-page-banner",
  authenticateJwt,
  isSuperAdmin,
  upload.single("image"),
  (req, res, next) => {
    // Multer will parse the form data even if no file is provided
    // This middleware ensures we can handle text-only updates
    next();
  },
  addOrUpdateListingPageBanner
);

router.get("/get-listing-page-banner", fetchListingPageBanner);

router.delete(
  "/listing-page-banner/:id",
  authenticateJwt,
  isSuperAdmin,
  deleteListingPageBanner
);

// Grid Section Settings Routes
router.get("/get-grid-section-settings", getGridSectionSettings);

router.put(
  "/grid-section-settings",
  authenticateJwt,
  isSuperAdmin,
  updateGridSectionSettings
);

export default router;
