"use client";

import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About Us</h1>
            <p className="text-lg text-gray-600">
              Learn more about our mission, values, and commitment to quality
            </p>
          </div>

          <div className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to E-COMMERCE, your trusted destination for quality products 
                and exceptional shopping experiences. We started with a simple mission: 
                to make online shopping easy, convenient, and enjoyable for everyone.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Since our founding, we've been committed to offering a wide selection 
                of products, competitive prices, and outstanding customer service. 
                We believe that shopping should be a pleasure, not a chore.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our mission is to provide customers with access to high-quality products 
                at affordable prices, delivered with exceptional service. We strive to 
                create a seamless shopping experience that exceeds expectations.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We are dedicated to building long-lasting relationships with our customers 
                by consistently delivering value, quality, and innovation.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">• Quality:</span>
                  <span>We carefully curate our product selection to ensure the highest standards.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">• Customer First:</span>
                  <span>Your satisfaction is our top priority. We're here to help you find exactly what you need.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">• Innovation:</span>
                  <span>We continuously improve our platform and services to enhance your shopping experience.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">• Integrity:</span>
                  <span>We conduct business with honesty, transparency, and ethical practices.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Why Choose Us?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Wide Selection</h3>
                  <p className="text-gray-600 text-sm">
                    Browse through thousands of products across multiple categories.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Fast Shipping</h3>
                  <p className="text-gray-600 text-sm">
                    Quick and reliable delivery to get your orders to you fast.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Secure Shopping</h3>
                  <p className="text-gray-600 text-sm">
                    Your data and payments are protected with industry-standard security.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">24/7 Support</h3>
                  <p className="text-gray-600 text-sm">
                    Our customer service team is always ready to assist you.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

