import express from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlistStatus,
} from "../controllers/wishlistController";

const router = express.Router();

router.use(authenticateJwt);

router.post("/add", addToWishlist);
router.delete("/remove/:productId", removeFromWishlist);
router.get("/", getWishlist);
router.get("/check/:productId", checkWishlistStatus);

export default router;

