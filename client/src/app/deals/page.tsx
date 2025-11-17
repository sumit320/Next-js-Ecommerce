"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProductStore } from "@/store/useProductStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/utils/placeholders";
import { ShoppingBag, Star } from "lucide-react";

export default function DealsPage() {
  const { products, fetchProductsForClient, isLoading } = useProductStore();
  const router = useRouter();

  useEffect(() => {
    // Fetch products with discount or special deals
    fetchProductsForClient({
      page: 1,
      limit: 20,
    });
  }, [fetchProductsForClient]);

  // Filter products that might be on sale (you can customize this logic)
  const dealProducts = products.filter((product) => {
    // For now, show all products. You can add discount logic later
    return product;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Special Deals</h1>
          <p className="text-gray-600">
            Discover amazing deals and discounts on our products
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : dealProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No deals available at the moment</p>
            <Button onClick={() => router.push("/listing")} variant="outline">
              Browse All Products
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dealProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/listing/${product.id}`)}
              >
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  <img
                    src={product.images[0] || PLACEHOLDER_IMAGE}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => handleImageError(e)}
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-semibold">
                    DEAL
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

