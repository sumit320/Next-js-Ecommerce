"use client";

import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How do I place an order?",
    answer: "Placing an order is easy! Simply browse our products, add items to your cart, and proceed to checkout. You'll need to create an account or sign in, provide your shipping address, and complete the payment. Once your order is confirmed, you'll receive an email confirmation with your order details."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including credit cards, debit cards, PayPal, and other secure payment gateways. All transactions are processed securely to protect your financial information."
  },
  {
    question: "How long does shipping take?",
    answer: "Shipping times vary depending on your location and the shipping method selected. Standard shipping typically takes 5-7 business days, while express shipping takes 2-3 business days. You'll receive a tracking number once your order ships so you can monitor its progress."
  },
  {
    question: "Can I track my order?",
    answer: "Yes! Once your order has been shipped, you'll receive an email with a tracking number. You can use this tracking number on our website or the carrier's website to track your package in real-time."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy on most items. Items must be unused, in their original packaging, and with all tags attached. Please visit our Returns page for detailed information about our return process and eligibility."
  },
  {
    question: "How do I return an item?",
    answer: "To return an item, log into your account, go to your order history, and select the item you want to return. Follow the return instructions and print the return label. Pack the item securely and drop it off at the designated location. Once we receive and process your return, you'll receive a refund."
  },
  {
    question: "Do you ship internationally?",
    answer: "Currently, we ship to select international destinations. Please check our Shipping Info page for a complete list of countries we serve and associated shipping costs and times."
  },
  {
    question: "What if I receive a damaged or defective item?",
    answer: "If you receive a damaged or defective item, please contact our customer service team immediately with photos of the damage. We'll arrange for a replacement or full refund, and we'll cover the return shipping costs."
  },
  {
    question: "Can I modify or cancel my order?",
    answer: "You can modify or cancel your order within 1 hour of placing it, as long as it hasn't been processed for shipping. After that, please contact our customer service team, and we'll do our best to accommodate your request."
  },
  {
    question: "How do I create an account?",
    answer: "Creating an account is simple! Click on 'Sign Up' in the header, fill in your details including name, email, and password, and verify your email address. Having an account allows you to track orders, save addresses, and enjoy faster checkout."
  },
  {
    question: "How do I update my account information?",
    answer: "You can update your account information by logging into your account and navigating to the 'My Account' section. From there, you can update your personal details, shipping addresses, payment methods, and password."
  },
  {
    question: "Are my personal details secure?",
    answer: "Absolutely! We take your privacy and security seriously. All personal information is encrypted and stored securely. We never share your information with third parties without your consent. Please review our Privacy Policy for more details."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-gray-600">
              Find answers to common questions about our products, services, and policies
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-gray-700 mb-4">
              Can't find the answer you're looking for? Our customer service team is here to help!
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
  );
}

