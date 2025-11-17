import axios from "axios";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../server";

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID ||
  "AWHyZ2Abkwf4Y5kT3Cw86Pun6RzyjfNuqrZd-N-VnRQgrhMeEMDEvsnqmOiJgb1uWD8EsVROSYE-3Pwf";
const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET ||
  "EDwSbRboGk6_d3ULQhX0fFjEPgo7vm1mPs3fjy8t1azBoK7QRE6rudf5NErIKDOsOH1EKZXiNeHSKTjo";

async function getPaypalAccessToken() {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error("PayPal credentials are missing");
      throw new Error("PayPal credentials are not configured");
    }

    // Log credentials status (first few chars only for security)
    if (process.env.NODE_ENV === "development") {
      console.log("PayPal Client ID:", PAYPAL_CLIENT_ID.substring(0, 10) + "...");
      console.log("PayPal Secret Key:", PAYPAL_CLIENT_SECRET.substring(0, 10) + "...");
    }

    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    if (!response.data.access_token) {
      throw new Error("No access token received from PayPal");
    }

    return response.data.access_token;
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message;
    console.error("PayPal access token error:", errorDetails);
    
    if (error.response?.status === 401) {
      console.error("\n⚠️ ========================================");
      console.error("⚠️ PayPal Authentication Failed (401)");
      console.error("⚠️ ========================================");
      console.error("Current credentials being used:");
      console.error(`   Client ID: ${PAYPAL_CLIENT_ID.substring(0, 20)}...`);
      console.error(`   Secret Key: ${PAYPAL_CLIENT_SECRET.substring(0, 20)}...`);
      console.error("\nTo fix this:");
      console.error("1. Go to https://developer.paypal.com/dashboard");
      console.error("2. Navigate to 'My Apps & Credentials'");
      console.error("3. Find your Sandbox app");
      console.error("4. Copy BOTH Client ID and Secret Key from the SAME app");
      console.error("5. Update them in server/.env or server/src/controllers/orderController.ts");
      console.error("6. Restart your server");
      console.error("⚠️ ========================================\n");
      
      // Return a more helpful error message
      throw new Error(
        "PayPal authentication failed. Client ID and Secret Key must match and be from the same PayPal app. Check server console for details."
      );
    }
    
    throw error;
  }
}

export const createPaypalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, total } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Items are required and must be a non-empty array",
      });
      return;
    }

    if (!total || total <= 0) {
      res.status(400).json({
        success: false,
        message: "Total amount is required and must be greater than 0",
      });
      return;
    }

    const accessToken = await getPaypalAccessToken();

    if (!accessToken) {
      res.status(500).json({
        success: false,
        message: "Failed to get PayPal access token",
      });
      return;
    }

    const paypalItems = items.map((item: any) => {
      // Handle nested product structure from cart items
      const product = item.product || {};
      const productName = item.name || item.productName || product.name || "Product";
      const productPrice = item.price || product.price || 0;
      const productId = item.id || item.productId || product.id || "";
      const quantity = item.quantity || 1;
      
      return {
        name: productName.substring(0, 127), // PayPal has a 127 character limit
        description: item.description || product.description || "",
        sku: productId.substring(0, 127), // PayPal has a 127 character limit
        unit_amount: {
          currency_code: "USD",
          value: parseFloat(productPrice).toFixed(2),
        },
        quantity: quantity.toString(),
        category: "PHYSICAL_GOODS",
      };
    });

    const itemTotal = paypalItems.reduce(
      (sum: any, item: any) =>
        sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
      0
    );

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: parseFloat(total).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: itemTotal.toFixed(2),
              },
            },
          },
          items: paypalItems,
        },
      ],
    };

    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      orderData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-ID": uuidv4(),
        },
      }
    );

    res.status(200).json(response.data);
  } catch (e: any) {
    console.error("PayPal order creation error:", e);
    console.error("Error details:", {
      message: e.message,
      response: e.response?.data,
      status: e.response?.status,
    });

    const errorMessage = e.response?.data?.message || e.message || "Unexpected error occurred";
    const statusCode = e.response?.status || 500;

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? {
        details: e.response?.data,
        stack: e.stack,
      } : undefined,
    });
  }
};

export const capturePaypalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.body;
    const accessToken = await getPaypalAccessToken();

    const response = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const createFinalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, addressId, couponId, total, paymentId } = req.body;
    const userId = req.user?.userId;

    console.log(items, "itemsitemsitems");

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    //start our transaction

    const order = await prisma.$transaction(async (prisma) => {
      //create new order
      const newOrder = await prisma.order.create({
        data: {
          userId,
          addressId,
          couponId,
          total,
          paymentMethod: "CREDIT_CARD",
          paymentStatus: "COMPLETED",
          paymentId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productCategory: item.productCategory,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }

      await prisma.cartItem.deleteMany({
        where: {
          cart: { userId },
        },
      });

      await prisma.cart.delete({
        where: { userId },
      });

      if (couponId) {
        await prisma.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (e) {
    console.log(e, "createFinalOrder");

    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const getOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
        address: true,
        coupon: true,
      },
    });

    res.status(200).json(order);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    await prisma.order.updateMany({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const getAllOrdersForAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json(orders);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export const getOrdersByUserId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: true,
        address: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

