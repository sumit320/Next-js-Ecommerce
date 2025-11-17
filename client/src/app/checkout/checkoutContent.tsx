"use client";

import { paymentAction } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CartItem, useCartStore } from "@/store/useCartStore";
import { Coupon, useCouponStore } from "@/store/useCouponStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useProductStore } from "@/store/useProductStore";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/utils/placeholders";

function CheckoutContent() {
  const { addresses, fetchAddresses } = useAddressStore();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<
    (CartItem & { product: any })[]
  >([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponAppliedError, setCouponAppliedError] = useState("");
  const { items, fetchCart, clearCart } = useCartStore();
  const { getProductById } = useProductStore();
  const { fetchCoupons, couponList } = useCouponStore();
  const {
    createPayPalOrder,
    capturePayPalOrder,
    createFinalOrder,
    isPaymentProcessing,
  } = useOrderStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
  // Check PayPal SDK loading status
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    // Sync guest cart to server if user just logged in
    const syncAndFetch = async () => {
      const cartStore = useCartStore.getState();
      await cartStore.syncGuestCartToServer();
      await fetchCart();
    };
    
    syncAndFetch();
    fetchCoupons();
    fetchAddresses();
  }, [user, router, fetchAddresses, fetchCart, fetchCoupons]);

  useEffect(() => {
    const findDefaultAddress = addresses.find((address) => address.isDefault);

    if (findDefaultAddress) {
      setSelectedAddress(findDefaultAddress.id);
    }
  }, [addresses]);

  useEffect(() => {
    const fetchIndividualProductDetails = async () => {
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const product = await getProductById(item.productId);
          return { ...item, product };
        })
      );

      setCartItemsWithDetails(itemsWithDetails);
    };

    fetchIndividualProductDetails();
  }, [items, getProductById]);

  function handleApplyCoupon() {
    const getCurrentCoupon = couponList.find((c) => c.code === couponCode);

    if (!getCurrentCoupon) {
      setCouponAppliedError("Invalied Coupon code");
      setAppliedCoupon(null);
      return;
    }

    if (!getCurrentCoupon.isActive) {
      setCouponAppliedError("This coupon is currently inactive");
      setAppliedCoupon(null);
      return;
    }

    const now = new Date();

    if (
      now < new Date(getCurrentCoupon.startDate) ||
      now > new Date(getCurrentCoupon.endDate)
    ) {
      setCouponAppliedError(
        "Coupon is not valid in this time or expired coupon"
      );
      setAppliedCoupon(null);
      return;
    }

    if (getCurrentCoupon.usageCount >= getCurrentCoupon.usageLimit) {
      setCouponAppliedError(
        "Coupon has reached its usage limit! Please try a diff coupon"
      );
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(getCurrentCoupon);
    setCouponAppliedError("");
  }

  const handlePrePaymentFlow = async () => {
    const result = await paymentAction(checkoutEmail);
    if (!result.success) {
      toast({
        title: result.error,
        variant: "destructive",
      });

      return;
    }

    setShowPaymentFlow(true);
  };

  const handleFinalOrderCreation = async (data: any) => {
    if (!user) {
      toast({
        title: "User not authenticated",
        variant: "destructive",
      });

      return;
    }
    try {
      const orderData = {
        userId: user?.id,
        addressId: selectedAddress,
        items: cartItemsWithDetails.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productCategory: item.product.category,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.product.price,
        })),
        couponId: appliedCoupon?.id,
        total,
        paymentMethod: "CREDIT_CARD" as const,
        paymentStatus: "COMPLETED" as const,
        paymentId: data.id,
      };

      const createFinalOrderResponse = await createFinalOrder(orderData);

      if (createFinalOrderResponse) {
        await clearCart();
        router.push("/account");
      } else {
        toast({
          title: "There is some error while processing final order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "There is some error while processing final order",
        variant: "destructive",
      });
    }
  };

  const subTotal = cartItemsWithDetails.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const discountAmount = appliedCoupon
    ? (subTotal * appliedCoupon.discountPercent) / 100
    : 0;

  const total = subTotal - discountAmount;

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (isPaymentProcessing) {
    return (
      <Skeleton className="w-full h-[600px] rounded-xl">
        <div className="h-full flex justify-center items-center">
          <h1 className="text-3xl font-bold">
            Processing payment...Please wait!
          </h1>
        </div>
      </Skeleton>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery</h2>
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="flex items-start spce-x-2">
                    <Checkbox
                      id={address.id}
                      checked={selectedAddress === address.id}
                      onCheckedChange={() => setSelectedAddress(address.id)}
                    />
                    <Label htmlFor={address.id} className="flex-grow ml-3">
                      <div>
                        <span className="font-medium">{address.name}</span>
                        {address.isDefault && (
                          <span className="ml-2 text-sm text-green-600">
                            (Default)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        {address.address}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.city}, {address.country}, {address.postalCode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.phone}
                      </div>
                    </Label>
                  </div>
                ))}
                <Button onClick={() => router.push("/account")}>
                  Add a new Address
                </Button>
              </div>
            </Card>
            <Card className="p-6">
              {showPaymentFlow ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Payment</h3>
                  <p className="mb-3">
                    All transactions are secure and encrypted
                  </p>
                  {isRejected ? (
                    <div className="p-4 border border-red-300 rounded-md bg-red-50">
                      <p className="text-red-800 font-medium mb-2">
                        ⚠️ PayPal Client ID Error (HTTP 400)
                      </p>
                      <p className="text-red-700 text-sm mb-3">
                        The PayPal Client ID is invalid or not properly configured.
                      </p>
                      <div className="text-red-600 text-sm space-y-1">
                        <p className="font-medium">To fix this:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Go to <a href="https://developer.paypal.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">PayPal Developer Dashboard</a></li>
                          <li>Navigate to "My Apps & Credentials"</li>
                          <li>Find your Sandbox app (or create a new one)</li>
                          <li>Copy the correct Client ID</li>
                          <li>Update it in <code className="bg-red-100 px-1 rounded">client/src/app/checkout/page.tsx</code> or set <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> in <code className="bg-red-100 px-1 rounded">.env.local</code></li>
                          <li>Restart your development server</li>
                        </ol>
                      </div>
                    </div>
                  ) : !isResolved ? (
                    <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
                      <p className="text-gray-700">Loading PayPal payment options...</p>
                    </div>
                  ) : (
                    <PayPalButtons
                    style={{
                      layout: "vertical",
                      color: "black",
                      shape: "rect",
                      label: "pay",
                    }}
                    fundingSource="card"
                    onError={(err) => {
                      console.error("PayPal SDK Error:", err);
                      const errorMessage = err instanceof Error 
                        ? err.message 
                        : typeof err === 'string' 
                        ? err 
                        : "An error occurred with PayPal";
                      toast({
                        title: "PayPal Error",
                        description: errorMessage,
                        variant: "destructive",
                      });
                    }}
                    createOrder={async () => {
                      try {
                        console.log("[Checkout] Starting PayPal order creation...");
                        console.log("[Checkout] Items:", cartItemsWithDetails);
                        console.log("[Checkout] Total:", total);
                        
                        const orderId = await createPayPalOrder(
                          cartItemsWithDetails,
                          total
                        );

                        if (!orderId) {
                          const errorMsg = "Failed to create PayPal order: No order ID returned";
                          console.error("[Checkout]", errorMsg);
                          toast({
                            title: "Payment Error",
                            description: errorMsg,
                            variant: "destructive",
                          });
                          throw new Error(errorMsg);
                        }

                        console.log("[Checkout] PayPal order created successfully:", orderId);
                        return orderId;
                      } catch (error: any) {
                        console.error("[Checkout] PayPal createOrder error:", error);
                        console.error("[Checkout] Error stack:", error.stack);
                        
                        const errorMessage = error.message || "Failed to initialize payment";
                        toast({
                          title: "Payment Error",
                          description: errorMessage,
                          variant: "destructive",
                        });
                        throw error;
                      }
                    }}
                    onApprove={async (data, actions) => {
                      try {
                        const captureData = await capturePayPalOrder(
                          data.orderID
                        );

                        if (captureData) {
                          await handleFinalOrderCreation(captureData);
                        } else {
                          toast({
                            title: "Payment Capture Failed",
                            description: "Failed to capture PayPal payment. Please contact support.",
                            variant: "destructive",
                          });
                        }
                      } catch (error: any) {
                        console.error("PayPal onApprove error:", error);
                        toast({
                          title: "Payment Error",
                          description: error.message || "Failed to process payment",
                          variant: "destructive",
                        });
                      }
                    }}
                    />
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Enter Email to get started
                  </h3>
                  <div className="gap-2 flex items-center">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full"
                      value={checkoutEmail}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setCheckoutEmail(event.target.value)
                      }
                    />
                    <Button onClick={handlePrePaymentFlow}>
                      Proceed to Buy
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
          {/* order summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2>Order summary</h2>
              <div className="space-y-4">
                {cartItemsWithDetails.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative h-2- w-20 rounded-md overflow-hidden">
                      <img
                        src={item?.product?.images[0] || PLACEHOLDER_IMAGE}
                        alt={item?.product?.name}
                        className="object-cover"
                        onError={(e) => handleImageError(e)}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item?.product?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.color} / {item.size}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item?.product?.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <Input
                    placeholder="Enter a Discount code or Gift code"
                    onChange={(e) => setCouponCode(e.target.value)}
                    value={couponCode}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    className="w-full"
                    variant="outline"
                  >
                    Apply
                  </Button>
                  {couponAppliedError && (
                    <p className="text-sm text-red-600">{couponAppliedError}</p>
                  )}
                  {appliedCoupon && (
                    <p className="text-sm text-green-600">
                      Coupon Applied Successfully!
                    </p>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subTotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount ({appliedCoupon.discountPercent})%</span>
                      <span>${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutContent;
