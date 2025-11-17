/**
 * Test PayPal Credentials
 * 
 * This script helps you verify if your PayPal credentials are valid.
 * Run it with: node test-paypal-credentials.js
 */

const axios = require('axios');

// Get credentials from environment or use test values
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 
  "AWHyZ2Abkwf4Y5kT3Cw86Pun6RzyjfNuqrZd-N-VnRQgrhMeEMDEvsnqmOiJgb1uWD8EsVROSYE-3Pwf";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 
  "EDwSbRboGk6_d3ULQhX0fFjEPgo7vm1mPs3fjy8t1azBoK7QRE6rudf5NErIKDOsOH1EKZXiNeHSKTjo";

console.log("=".repeat(60));
console.log("Testing PayPal Credentials");
console.log("=".repeat(60));
console.log("Client ID:", CLIENT_ID.substring(0, 20) + "...");
console.log("Secret:", CLIENT_SECRET.substring(0, 20) + "...");
console.log("Environment: Sandbox");
console.log("=".repeat(60));
console.log("\nAttempting to get access token from PayPal...\n");

axios.post(
  "https://api-m.sandbox.paypal.com/v1/oauth2/token",
  "grant_type=client_credentials",
  {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString("base64")}`,
    },
  }
)
.then((response) => {
  if (response.data.access_token) {
    console.log("✅ SUCCESS! Your PayPal credentials are VALID!");
    console.log("✅ Access token received:", response.data.access_token.substring(0, 20) + "...");
    console.log("\nYou can now use these credentials in your application.");
    console.log("\nTo use them:");
    console.log("1. Add them to server/.env:");
    console.log(`   PAYPAL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`   PAYPAL_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log("2. Restart your server");
    process.exit(0);
  } else {
    console.log("❌ FAILED: No access token received");
    process.exit(1);
  }
})
.catch((error) => {
  console.log("❌ FAILED: Your PayPal credentials are INVALID!");
  console.log("\nError Details:");
  
  if (error.response) {
    console.log("Status Code:", error.response.status);
    console.log("Error:", error.response.data.error || "unknown");
    console.log("Description:", error.response.data.error_description || "unknown");
    
    if (error.response.status === 401) {
      console.log("\n⚠️  This means:");
      console.log("   - Your Client ID and Secret don't match");
      console.log("   - Or they are from different PayPal apps");
      console.log("   - Or they are expired/invalid");
      console.log("\n📝 To fix this:");
      console.log("1. Go to https://developer.paypal.com/dashboard");
      console.log("2. Sign in with your PayPal account");
      console.log("3. Navigate to 'My Apps & Credentials'");
      console.log("4. Select 'Sandbox' tab");
      console.log("5. Create a new app or use an existing one");
      console.log("6. Copy BOTH Client ID and Secret from the SAME app");
      console.log("7. Run this script again with:");
      console.log("   PAYPAL_CLIENT_ID=your_id PAYPAL_CLIENT_SECRET=your_secret node test-paypal-credentials.js");
    }
  } else {
    console.log("Error:", error.message);
  }
  
  process.exit(1);
});

