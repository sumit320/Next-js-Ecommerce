import * as paypal from "@paypal/checkout-server-sdk";

export function paypalClient() {
  // Use PAYPAL_CLIENT_SECRET to match existing code, fallback to PAYPAL_SECRET
  // Fallback to hardcoded sandbox credentials for development (same as old orderController)
  const clientId =
    process.env.PAYPAL_CLIENT_ID ||
    "AWHyZ2Abkwf4Y5kT3Cw86Pun6RzyjfNuqrZd-N-VnRQgrhMeEMDEvsnqmOiJgb1uWD8EsVROSYE-3Pwf";
  const secret =
    process.env.PAYPAL_CLIENT_SECRET ||
    process.env.PAYPAL_SECRET ||
    "EDwSbRboGk6_d3ULQhX0fFjEPgo7vm1mPs3fjy8t1azBoK7QRE6rudf5NErIKDOsOH1EKZXiNeHSKTjo";
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();

  if (!clientId) {
    const error = new Error(
      "PayPal Client ID is missing. Please set PAYPAL_CLIENT_ID in your server/.env file."
    );
    console.error("[PayPal] Configuration Error:", error.message);
    throw error;
  }

  if (!secret) {
    const error = new Error(
      "PayPal Client Secret is missing. Please set PAYPAL_CLIENT_SECRET in your server/.env file."
    );
    console.error("[PayPal] Configuration Error:", error.message);
    throw error;
  }

  console.log("[PayPal] Initializing client with mode:", mode);
  console.log("[PayPal] Client ID:", clientId.substring(0, 10) + "...");

  try {
    const environment =
      mode === "live"
        ? new paypal.core.LiveEnvironment(clientId, secret)
        : new paypal.core.SandboxEnvironment(clientId, secret);

    return new paypal.core.PayPalHttpClient(environment);
  } catch (error: any) {
    console.error("[PayPal] Failed to create PayPal client:", error.message);
    throw new Error(`Failed to initialize PayPal client: ${error.message}`);
  }
}

