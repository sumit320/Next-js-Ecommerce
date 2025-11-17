import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../server";

// Add to wishlist
export const addToWishlist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
      return;
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Added to wishlist",
      data: wishlistItem,
    });
  } catch (e) {
    console.error("Add to wishlist error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to add to wishlist",
    });
  }
};

// Remove from wishlist
export const removeFromWishlist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (e) {
    console.error("Remove from wishlist error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to remove from wishlist",
    });
  }
};

// Get user wishlist
export const getWishlist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        // Note: We'll need to fetch product details separately since there's no direct relation
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch product details for each wishlist item
    const products = await Promise.all(
      wishlistItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          ...item,
          product,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: products.filter((item) => item.product !== null),
    });
  } catch (e) {
    console.error("Get wishlist error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
    });
  }
};

// Check if product is in wishlist
export const checkWishlistStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });
      return;
    }

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.status(200).json({
      success: true,
      isInWishlist: !!wishlistItem,
    });
  } catch (e) {
    console.error("Check wishlist status error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to check wishlist status",
    });
  }
};

