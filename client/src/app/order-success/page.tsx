"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const { getOrder, currentOrder, isLoading } = useOrderStore();
  const [orderLoaded, setOrderLoaded] = useState(false);

  useEffect(() => {
    if (orderId && !orderLoaded) {
      getOrder(orderId);
      setOrderLoaded(true);
    }
  }, [orderId, getOrder, orderLoaded]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            No order ID provided. Please check your order history.
          </p>
          <Link href="/account">
            <Button>Go to Account</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-green-600">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            Your order has been placed successfully.
          </p>
          {isLoading ? (
            <p className="text-gray-500">Loading order details...</p>
          ) : currentOrder ? (
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Order ID:</span> {currentOrder.id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Total Amount:</span> ₹
                {currentOrder.total.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Payment Status:</span>{" "}
                <span className="text-green-600 font-semibold">
                  {currentOrder.paymentStatus}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Order Status:</span>{" "}
                {currentOrder.status}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Order ID:</span> {orderId}
              </p>
            </div>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account">
              <Button variant="outline">View Orders</Button>
            </Link>
            <Link href="/home">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

