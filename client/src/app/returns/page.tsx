"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import Link from "next/link";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Returns & Refunds</h1>
            <p className="text-lg text-gray-600">
              Our hassle-free return policy ensures your complete satisfaction
            </p>
          </div>

          <div className="space-y-8">
            {/* Return Policy Overview */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <Package className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">30-Day Return Policy</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We want you to be completely satisfied with your purchase. If you're not happy 
                    with your order, you can return most items within 30 days of delivery for a full refund 
                    or exchange.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    All returned items must be in their original condition, unused, and with all tags 
                    and packaging intact.
                  </p>
                </div>
              </div>
            </Card>

            {/* Eligibility */}
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Return Eligibility</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Eligible for Return
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Items in original, unopened packaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Items with all tags and labels attached</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Items in original condition (unused, unworn)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Items returned within 30 days of delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Defective or damaged items</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Not Eligible for Return
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Items without original packaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Used, worn, or damaged items (unless defective)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Items returned after 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Personalized or custom-made items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Items purchased on sale (unless defective)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Return Process */}
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-6">How to Return an Item</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Initiate Return</h3>
                    <p className="text-gray-700">
                      Log into your account and navigate to "My Account" → "Order History". 
                      Select the order containing the item you want to return and click "Return Item".
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Select Items & Reason</h3>
                    <p className="text-gray-700">
                      Choose the items you want to return and select the reason for return. 
                      You'll receive a return authorization number and return label.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Pack & Ship</h3>
                    <p className="text-gray-700">
                      Pack the item securely in its original packaging (if available) along with 
                      all tags and accessories. Attach the return label and drop it off at the 
                      designated shipping location.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Receive Refund</h3>
                    <p className="text-gray-700">
                      Once we receive and inspect your return (usually within 5-7 business days), 
                      we'll process your refund to the original payment method. You'll receive an 
                      email confirmation when the refund is processed.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Refund Information */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Refund Processing</h2>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <span className="font-semibold">Processing Time:</span> Refunds are typically 
                      processed within 5-7 business days after we receive your return.
                    </p>
                    <p>
                      <span className="font-semibold">Refund Method:</span> Refunds will be issued to 
                      the original payment method used for the purchase.
                    </p>
                    <p>
                      <span className="font-semibold">Bank Processing:</span> Please allow 5-10 
                      additional business days for the refund to appear in your account, depending on 
                      your bank's processing time.
                    </p>
                    <p>
                      <span className="font-semibold">Shipping Costs:</span> Original shipping costs 
                      are non-refundable unless the item was defective or we made an error with your order.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Exchange Policy */}
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Exchanges</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We currently do not offer direct exchanges. If you need a different size, color, or 
                style, please return the original item and place a new order for the item you want. 
                This ensures you get the exact item you need as quickly as possible.
              </p>
              <Link href="/listing">
                <Button>Shop Now</Button>
              </Link>
            </Card>

            {/* Contact Support */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-xl font-semibold mb-2">Need Help with a Return?</h3>
              <p className="text-gray-700 mb-4">
                Our customer service team is here to assist you with any questions about returns or refunds.
              </p>
              <Link href="/contact">
                <Button variant="outline">Contact Customer Service</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

