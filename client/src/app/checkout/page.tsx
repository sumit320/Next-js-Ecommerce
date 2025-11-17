"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import CheckoutSuspense from "./checkoutSkeleton";

function CheckoutPage() {
  const clientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    "AWHyZ2Abkwf4Y5kT3Cw86Pun6RzyjfNuqrZd-N-VnRQgrhMeEMDEvsnqmOiJgb1uWD8EsVROSYE-3Pwf";

  // Validate client ID format
  if (!clientId || clientId.length < 20) {
    console.error("Invalid PayPal Client ID");
  }

  // Log client ID for debugging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log("PayPal Client ID:", clientId.substring(0, 20) + "...");
  }

  const options = {
    clientId: clientId.trim(),
    currency: "USD",
    intent: "capture",
    components: "buttons",
  };

  return (
    <PayPalScriptProvider
      options={options}
      deferLoading={false}
    >
      <CheckoutSuspense />
    </PayPalScriptProvider>
  );
}

// Add error boundary for PayPal script loading
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message?.includes("paypal") || event.filename?.includes("paypal")) {
      console.error("PayPal Script Loading Error:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    }
  });
}

export default CheckoutPage;
