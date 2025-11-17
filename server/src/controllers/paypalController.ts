import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Response, NextFunction } from "express";
import { paypalClient } from "../lib/paypal";
import * as paypal from "@paypal/checkout-server-sdk";

/**
 * Create PayPal Order
 * POST /api/paypal/create-order
 * Returns: { id: string } - The order ID that PayPal SDK expects
 */
export const createPaypalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("[PayPal] Create order request received");
    console.log("[PayPal] Request body:", JSON.stringify(req.body, null, 2));

    const { items, total } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("[PayPal] Validation failed: items missing or empty");
      res.status(400).json({
        success: false,
        message: "Items are required and must be a non-empty array",
      });
      return;
    }

    if (!total || total <= 0 || isNaN(parseFloat(total))) {
      console.error("[PayPal] Validation failed: invalid total", total);
      res.status(400).json({
        success: false,
        message: "Total amount is required and must be a positive number",
      });
      return;
    }

    // Transform items for PayPal
    const paypalItems = items.map((item: any) => {
      const product = item.product || {};
      const productName = item.name || item.productName || product.name || "Product";
      const productPrice = item.price || product.price || 0;
      const productId = item.id || item.productId || product.id || "";
      const quantity = item.quantity || 1;

      return {
        name: productName.substring(0, 127),
        description: item.description || product.description || "",
        sku: productId.substring(0, 127),
        unit_amount: {
          currency_code: "USD",
          value: parseFloat(productPrice).toFixed(2),
        },
        quantity: quantity.toString(),
        category: "PHYSICAL_GOODS",
      };
    });

    const itemTotal = paypalItems.reduce(
      (sum: number, item: any) =>
        sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
      0
    );

    // Create PayPal order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
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
              discount: {
                currency_code: "USD",
                value: "0.00",
              },
              handling: {
                currency_code: "USD",
                value: "0.00",
              },
              insurance: {
                currency_code: "USD",
                value: "0.00",
              },
              shipping: {
                currency_code: "USD",
                value: "0.00",
              },
              shipping_discount: {
                currency_code: "USD",
                value: "0.00",
              },
              tax_total: {
                currency_code: "USD",
                value: "0.00",
              },
            },
          },
          items: paypalItems.map((item: any) => ({
            ...item,
            category: "PHYSICAL_GOODS" as paypal.orders.Category,
          })),
        },
      ],
    });

    console.log("[PayPal] Creating order with PayPal SDK...");
    
    let client;
    try {
      client = paypalClient();
    } catch (clientError: any) {
      console.error("[PayPal] Failed to initialize PayPal client:", clientError);
      res.status(500).json({
        success: false,
        message: clientError.message || "PayPal client initialization failed. Please check server configuration.",
        error: process.env.NODE_ENV === "development" ? {
          details: clientError.message,
          stack: clientError.stack,
        } : undefined,
      });
      return;
    }
    
    let order;
    try {
      order = await client.execute(request);
    } catch (executeError: any) {
      console.error("[PayPal] Order execution error - Full error object:", JSON.stringify(executeError, null, 2));
      console.error("[PayPal] Error statusCode:", executeError.statusCode);
      console.error("[PayPal] Error message:", executeError.message);
      console.error("[PayPal] Error result:", executeError.result);
      console.error("[PayPal] Error response:", executeError.response);
      
      // PayPal SDK errors are typically in executeError.statusCode and executeError.result
      const statusCode = executeError.statusCode || executeError.response?.status || 500;
      const errorResult = executeError.result || executeError.response?.data || {};
      
      // Check for authentication errors (401 or invalid_client)
      if (statusCode === 401 || 
          errorResult.error === "invalid_client" || 
          errorResult.error_description?.includes("Client Authentication failed") ||
          executeError.message?.includes("invalid_client") ||
          executeError.message?.includes("Client Authentication failed")) {
        
        console.error("\n⚠️ ========================================");
        console.error("⚠️ PayPal Authentication Failed");
        console.error("⚠️ ========================================");
        console.error("Status Code:", statusCode);
        console.error("Error Code:", errorResult.error || "invalid_client");
        console.error("Error Description:", errorResult.error_description || "Client Authentication failed");
        console.error("\nCurrent credentials being used:");
        console.error("   Mode: sandbox (default)");
        console.error("   Client ID: Check server/.env or hardcoded fallback");
        console.error("   Secret: Check server/.env or hardcoded fallback");
        console.error("\n⚠️ The hardcoded credentials in the code are likely INVALID or EXPIRED!");
        console.error("\nTo fix this:");
        console.error("1. Go to https://developer.paypal.com/dashboard");
        console.error("2. Sign in with your PayPal account");
        console.error("3. Navigate to 'My Apps & Credentials'");
        console.error("4. Select 'Sandbox' tab (for testing)");
        console.error("5. Find your app or create a new one");
        console.error("6. Copy BOTH Client ID and Secret from the SAME app");
        console.error("7. Add them to server/.env:");
        console.error("   PAYPAL_CLIENT_ID=your_client_id_here");
        console.error("   PAYPAL_CLIENT_SECRET=your_secret_here");
        console.error("8. Restart your server");
        console.error("⚠️ ========================================\n");
        
        res.status(401).json({
          success: false,
          message: "PayPal authentication failed. The Client ID and Secret are invalid or don't match. Please get valid credentials from PayPal Developer Dashboard.",
          error: {
            code: errorResult.error || "invalid_client",
            description: errorResult.error_description || "Client Authentication failed",
            help: "The hardcoded credentials are invalid. You need to get valid credentials from https://developer.paypal.com/dashboard and add them to server/.env file. Check server console for detailed instructions.",
          },
        });
        return;
      }
      
      // Re-throw other errors to be handled by outer catch
      throw executeError;
    }

    if (!order.result || !order.result.id) {
      console.error("[PayPal] Order creation failed: invalid response", order);
      res.status(500).json({
        success: false,
        message: "Failed to create PayPal order: invalid response",
      });
      return;
    }

    console.log("[PayPal] Order created successfully:", order.result.id);
    console.log("[PayPal] Order details:", JSON.stringify(order.result, null, 2));

    // Return the order ID in the format PayPal SDK expects
    res.status(200).json({
      id: order.result.id,
    });
  } catch (error: any) {
    console.error("[PayPal] Order creation error:", error);
    console.error("[PayPal] Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      details: error.result || error.response?.data,
    });

    const statusCode = error.statusCode || 500;
    const errorMessage =
      error.result?.message || error.message || "Failed to create PayPal order";

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? {
        details: error.result || error.response?.data,
        stack: error.stack,
      } : undefined,
    });
  }
};

/**
 * Capture PayPal Order
 * POST /api/paypal/capture-order
 * Body: { orderId: string }
 */
export const capturePaypalOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("[PayPal] Capture order request received");
    const { orderId } = req.body;

    if (!orderId) {
      console.error("[PayPal] Validation failed: orderId missing");
      res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
      return;
    }

    console.log("[PayPal] Capturing order:", orderId);

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    // For capture, we don't need to pass requestBody - it's optional
    // request.requestBody({});

    const client = paypalClient();
    const capture = await client.execute(request);

    if (!capture.result) {
      console.error("[PayPal] Capture failed: invalid response", capture);
      res.status(500).json({
        success: false,
        message: "Failed to capture PayPal order: invalid response",
      });
      return;
    }

    console.log("[PayPal] Order captured successfully");
    console.log("[PayPal] Capture details:", JSON.stringify(capture.result, null, 2));

    res.status(200).json(capture.result);
  } catch (error: any) {
    console.error("[PayPal] Capture error:", error);
    console.error("[PayPal] Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      details: error.result || error.response?.data,
    });

    const statusCode = error.statusCode || 500;
    const errorMessage =
      error.result?.message || error.message || "Failed to capture PayPal order";

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? {
        details: error.result || error.response?.data,
        stack: error.stack,
      } : undefined,
    });
  }
};

