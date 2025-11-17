"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/store/useCartStore";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/utils/placeholders";
import { useAuthStore } from "@/store/useAuthStore";

export default function WishlistPage() {
  const { items, isLoading, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch wishlist if user is authenticated
    if (user) {
      fetchWishlist();
    }
  }, [fetchWishlist, user]);

  const handleRemove = async (productId: string) => {
    const success = await removeFromWishlist(productId);
    if (success) {
      toast({
        title: "Removed from wishlist",
        variant: "success",
      });
    }
  };

  const handleAddToCart = (product: any) => {
    if (!product.sizes || product.sizes.length === 0) {
      toast({
        title: "Product size not available",
        variant: "destructive",
      });
      return;
    }

    if (!product.colors || product.colors.length === 0) {
      toast({
        title: "Product color not available",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: product.colors[0],
      size: product.sizes[0],
      quantity: 1,
    });

    toast({
      title: "Added to cart",
      variant: "success",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          {items.length > 0 && (
            <p className="text-gray-600">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">
              Start adding products you love to your wishlist
            </p>
            <Button onClick={() => router.push("/listing")}>
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <Card
                  key={item.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className="relative aspect-[3/4] bg-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/listing/${product.id}`)}
                  >
                    <img
                      src={product.images[0] || PLACEHOLDER_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => handleImageError(e)}
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(product.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3
                      className="font-semibold mb-1 line-clamp-1 cursor-pointer hover:text-gray-600"
                      onClick={() => router.push(`/listing/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

