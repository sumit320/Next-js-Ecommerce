"use client";

import { Card } from "@/components/ui/card";
import { Truck, Clock, MapPin, Package, Shield, CheckCircle2 } from "lucide-react";

export default function ShippingInfoPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Shipping Information</h1>
            <p className="text-lg text-gray-600">
              Everything you need to know about our shipping options and delivery times
            </p>
          </div>

          <div className="space-y-8">
            {/* Shipping Options */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <Truck className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-6">Shipping Options</h2>
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-600 pl-4">
                      <h3 className="font-semibold text-lg mb-2">Standard Shipping</h3>
                      <p className="text-gray-700 mb-2">
                        <span className="font-semibold">Delivery Time:</span> 5-7 business days
                      </p>
                      <p className="text-gray-700 mb-2">
                        <span className="font-semibold">Cost:</span> Free on orders over ₹500, otherwise ₹50
                      </p>
                      <p className="text-gray-600 text-sm">
                        Perfect for non-urgent deliveries. Your package will be delivered to your doorstep 
                        or nearest pickup location.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-600 pl-4">
                      <h3 className="font-semibold text-lg mb-2">Express Shipping</h3>
                      <p className="text-gray-700 mb-2">
                        <span className="font-semibold">Delivery Time:</span> 2-3 business days
                      </p>
                      <p className="text-gray-700 mb-2">
                        <span className="font-semibold">Cost:</span> ₹150
                      </p>
                      <p className="text-gray-600 text-sm">
                        Get your order faster with our express shipping option. Available for most locations.
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h3 className="font-semibold text-lg mb-2">Same-Day Delivery</h3>
                      <p className="text-gray-700 mb-2">
                        <span className="font-semibold">Delivery Time:</span> Same day (if ordered before 12 PM)
                      </p>
                      <p className="text-gray-700 mb-2">
                        <span className="font-semibold">Cost:</span> ₹300
                      </p>
                      <p className="text-gray-600 text-sm">
                        Available in select metro cities. Order before 12 PM for same-day delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Delivery Timeline */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-6">Delivery Timeline</h2>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Order Placed</h3>
                        <p className="text-gray-600 text-sm">You'll receive an order confirmation email immediately.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Order Processing</h3>
                        <p className="text-gray-600 text-sm">We process and pack your order within 1-2 business days.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Order Shipped</h3>
                        <p className="text-gray-600 text-sm">You'll receive a shipping confirmation email with tracking details.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Out for Delivery</h3>
                        <p className="text-gray-600 text-sm">Your package is on its way to your address.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        5
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Delivered</h3>
                        <p className="text-gray-600 text-sm">Your order has been delivered successfully!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Shipping Locations */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-4">Shipping Locations</h2>
                  <p className="text-gray-700 mb-4">
                    We currently ship to all major cities and towns across India. Shipping times and costs 
                    may vary based on your location.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Metro Cities</h3>
                      <p className="text-gray-600 text-sm">
                        Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune - 2-3 days
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Tier 2 Cities</h3>
                      <p className="text-gray-600 text-sm">
                        All major state capitals and commercial hubs - 3-5 days
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Other Locations</h3>
                      <p className="text-gray-600 text-sm">
                        Smaller towns and rural areas - 5-7 days
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Remote Areas</h3>
                      <p className="text-gray-600 text-sm">
                        Some remote locations may take 7-10 days. Contact us for availability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Tracking */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <Package className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-4">Track Your Order</h2>
                  <p className="text-gray-700 mb-4">
                    Once your order ships, you'll receive a tracking number via email. You can track your 
                    package in real-time using:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Your account dashboard - Go to "My Account" → "Order History"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Tracking link in your shipping confirmation email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Carrier's website using the tracking number</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Important Information */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <Shield className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-4">Important Information</h2>
                  <div className="space-y-4 text-gray-700">
                    <div>
                      <h3 className="font-semibold mb-2">Delivery Address</h3>
                      <p className="text-sm">
                        Please ensure your delivery address is correct and complete. We're not responsible 
                        for delays or failed deliveries due to incorrect addresses.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Delivery Attempts</h3>
                      <p className="text-sm">
                        Our courier partners will make up to 3 delivery attempts. If all attempts fail, 
                        the package will be returned to us, and you'll need to contact customer service.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Business Days</h3>
                      <p className="text-sm">
                        Business days exclude weekends and public holidays. Delivery times are estimates 
                        and may vary due to weather conditions or other factors beyond our control.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Multiple Items</h3>
                      <p className="text-sm">
                        If your order contains multiple items, they may be shipped separately to ensure 
                        faster delivery. You'll receive separate tracking numbers for each shipment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Support */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-xl font-semibold mb-2">Questions About Shipping?</h3>
              <p className="text-gray-700 mb-4">
                If you have any questions about shipping, delivery times, or tracking your order, 
                our customer service team is here to help.
              </p>
              <a
                href="/contact"
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Contact Us →
              </a>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

