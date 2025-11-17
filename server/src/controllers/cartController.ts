import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../server";

export const addToCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity, size, color } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    // Check product stock before adding to cart
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        stock: true,
        name: true,
        price: true,
        images: true,
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (product.stock <= 0) {
      res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
      return;
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Find existing cart item with same product, size, and color
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        size: size || null,
        color: color || "",
      },
    });

    // Calculate total quantity (existing + new)
    const newQuantity = existingCartItem 
      ? existingCartItem.quantity + quantity 
      : quantity;

    // Check if total quantity exceeds stock
    if (newQuantity > product.stock) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock. You already have ${existingCartItem?.quantity || 0} in your cart.`,
      });
      return;
    }

    let cartItem;
    if (existingCartItem) {
      // Update existing item
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: { increment: quantity },
        },
      });
    } else {
      // Create new item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size: size || null,
          color: color || "",
        },
      });
    }

    const responseItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: cartItem.color,
      size: cartItem.size,
      quantity: cartItem.quantity,
    };

    res.status(201).json({
      success: true,
      data: responseItem,
    });
  } catch (e) {
    console.error("Add to cart error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
      error: process.env.NODE_ENV === "development" ? String(e) : undefined,
    });
  }
};

export const getCart = async (
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

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      res.json({
        success: false,
        messaage: "No Item found in cart",
        data: [],
      });

      return;
    }

    const cartItemsWithProducts = await Promise.all(
      cart?.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            name: true,
            price: true,
            images: true,
          },
        });

        return {
          id: item.id,
          productId: item.productId,
          name: product?.name,
          price: product?.price,
          image: product?.images[0],
          color: item.color,
          size: item.size,
          quantity: item.quantity,
        };
      })
    );

    res.json({
      success: true,
      data: cartItemsWithProducts,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart!",
    });
  }
};

export const removeFromCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    await prisma.cartItem.delete({
      where: {
        id,
        cart: { userId },
      },
    });

    res.status(200).json({
      success: true,
      message: "Item is removed from cart",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to remove from cart!",
    });
  }
};

export const updateCartItemQuantity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    // Get the cart item first to check product stock
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id,
        cart: { userId },
      },
    });

    if (!cartItem) {
      res.status(404).json({
        success: false,
        message: "Cart item not found",
    });
      return;
    }

    // Check product stock
    const product = await prisma.product.findUnique({
      where: { id: cartItem.productId },
      select: {
        stock: true,
        name: true,
        price: true,
        images: true,
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (quantity > product.stock) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
      return;
    }

    if (quantity <= 0) {
      res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
      return;
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        id,
        cart: { userId },
      },
      data: { quantity },
    });

    const responseItem = {
      id: updatedItem.id,
      productId: updatedItem.productId,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: updatedItem.color,
      size: updatedItem.size,
      quantity: updatedItem.quantity,
    };

    res.json({
      success: true,
      data: responseItem,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to update cart item quantity",
    });
  }
};

export const clearEntireCart = async (
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

    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
      },
    });

    res.status(200).json({
      success: true,
      message: "cart cleared successfully!",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart!",
    });
  }
};
