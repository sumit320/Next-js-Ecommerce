"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductStore } from "@/store/useProductStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductDetailsSkeleton from "./productSkeleton";
import { useCartStore } from "@/store/useCartStore";
import { useToast } from "@/hooks/use-toast";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Heart, ZoomIn, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/utils/placeholders";

function ProductDetailsContent({ id }: { id: string }) {
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomImage, setZoomImage] = useState("");
  const { getProductById, isLoading } = useProductStore();
  const { addToCart } = useCartStore();
  const { toast } = useToast();
  const router = useRouter();
  const { addToWishlist, isInWishlist, fetchWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      const productDetails = await getProductById(id);
      if (productDetails) {
        setProduct(productDetails);
        // Only fetch wishlist if user is authenticated
        if (user) {
          fetchWishlist();
        }
        
        // Fetch related products
        try {
          const response = await axios.get(
            `${API_ROUTES.PRODUCTS}/${id}/related`,
            { withCredentials: true }
          );
          if (response.data.success) {
            setRelatedProducts(response.data.products || []);
          }
        } catch (error) {
          console.error("Failed to fetch related products:", error);
        }

        // Save to recently viewed
        const recentlyViewed = JSON.parse(
          localStorage.getItem("recentlyViewed") || "[]"
        );
        const updated = [
          { id: productDetails.id, name: productDetails.name, image: productDetails.images[0], viewedAt: Date.now() },
          ...recentlyViewed.filter((item: any) => item.id !== productDetails.id),
        ].slice(0, 10);
        localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      } else {
        router.push("/404");
      }
    };

    fetchProduct();
  }, [id, getProductById, router, fetchWishlist, user]);

  const handleAddToCart = () => {
    if (!product) return;

    // Check stock availability
    if (product.stock <= 0) {
      toast({
        title: "Product is out of stock",
        variant: "destructive",
      });
      return;
    }

    if (quantity > product.stock) {
      toast({
        title: `Only ${product.stock} items available in stock`,
        variant: "destructive",
      });
      setQuantity(product.stock);
      return;
    }

    // Validate required fields
    if (!selectedSize) {
      toast({
        title: "Please select a size",
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

    const selectedColorValue = product.colors[selectedColor];
    if (!selectedColorValue) {
      toast({
        title: "Please select a color",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: selectedColorValue,
      size: selectedSize,
      quantity: quantity,
    });

    setSelectedSize("");
    setSelectedColor(0);
    setQuantity(1);

    toast({
      title: "Product is added to cart",
      variant: "success",
    });
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    if (!user) {
      toast({
        title: "Please sign in to add items to wishlist",
        variant: "destructive",
      });
      router.push(`/auth/login?redirect=/listing/${product.id}`);
      return;
    }
    // Check status before the operation
    const wasInWishlist = isInWishlist(product.id);
    const success = await addToWishlist(product.id);
    if (success) {
      toast({
        title: wasInWishlist
          ? "Removed from wishlist"
          : "Added to wishlist",
        variant: "success",
      });
    } else {
      toast({
        title: "Failed to update wishlist",
        variant: "destructive",
      });
    }
  };

  const handleImageZoom = (image: string) => {
    setZoomImage(image);
    setIsZoomed(true);
  };


  if (!product || isLoading) return <ProductDetailsSkeleton />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 flex gap-4">
            <div className="hidden lg:flex flex-col gap-2 w-24">
              {product?.images.map((image: string, index: number) => (
                <button
                  onClick={() => setSelectedImage(index)}
                  key={index}
                  className={`${
                    selectedImage === index
                      ? "border-black"
                      : "border-transparent"
                  } border-2`}
                >
                  <img
                    src={image || PLACEHOLDER_IMAGE}
                    alt={`Product-${index + 1}`}
                    className="w-full aspect-square object-cover"
                    onError={(e) => handleImageError(e)}
                  />
                </button>
              ))}
            </div>
            <div className="flex-1 relative w-[300px] group">
              <img
                src={product.images[selectedImage] || PLACEHOLDER_IMAGE}
                alt={product.name}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => handleImageZoom(product.images[selectedImage] || PLACEHOLDER_IMAGE)}
                onError={(e) => handleImageError(e)}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/90 hover:bg-white"
                  onClick={() => handleImageZoom(product.images[selectedImage] || PLACEHOLDER_IMAGE)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:w-1/3 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-2xl font-semibold">
                  ${product.price.toFixed(2)}
                </span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  product.stock > 0 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Color</h3>
              <div className="flex gap-2">
                {product.colors.map((color: string, index: number) => (
                  <button
                    key={index}
                    className={`w-12 h-12 rounded-full border-2 ${
                      selectedColor === index
                        ? "border-black"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(index)}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Size</h3>
              <div className="flex gap-2">
                {product.sizes.map((size: string, index: string) => (
                  <Button
                    key={index}
                    className={`w-12 h-12`}
                    variant={selectedSize === size ? "default" : "outline"}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Quantity</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                  variant="outline"
                  disabled={quantity >= (product.stock || 0)}
                >
                  +
                </Button>
              </div>
              {product.stock > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {product.stock - quantity >= 0 
                    ? `${product.stock - quantity} available after adding ${quantity} to cart`
                    : "Not enough stock available"}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-black text-white hover:bg-gray-800"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={isInWishlist(product.id) ? "text-pink-500 border-pink-500" : ""}
                onClick={handleWishlistToggle}
              >
                <Heart
                  className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-current" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <Tabs defaultValue="details">
            <TabsList className="w-full justify-start border-b">
              <TabsTrigger value="details">PRODUCT DESCRIPTION</TabsTrigger>
              <TabsTrigger value="reviews">REVIEWS</TabsTrigger>
              <TabsTrigger value="shipping">
                SHIPPING & RETURNS INFO
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-5">
              <p className="text-gray-700 mb-4">{product.description}</p>
            </TabsContent>
            <TabsContent value="reviews" className="mt-5">
              Reviews
            </TabsContent>
            <TabsContent value="shipping">
              <p className="text-gray-700 mb-4">
                Shipping and return information goes here.Please read the info
                before proceeding.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/listing/${relatedProduct.id}`)}
                >
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    <img
                      src={relatedProduct.images[0] || PLACEHOLDER_IMAGE}
                      alt={relatedProduct.name}
                      onError={(e) => handleImageError(e)}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {relatedProduct.brand}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${relatedProduct.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl p-0">
          <VisuallyHidden>
            <DialogTitle>Zoomed product image</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white/90"
              onClick={() => setIsZoomed(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={zoomImage}
              alt="Zoomed product"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductDetailsContent;
