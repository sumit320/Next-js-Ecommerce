"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useProductStore } from "@/store/useProductStore";
import { brands, categories, sizes } from "@/utils/config";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Star, ShoppingBag, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToast } from "@/hooks/use-toast";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/utils/placeholders";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";

const colors = [
  { name: "Navy", class: "bg-[#0F172A]" },
  { name: "Yellow", class: "bg-[#FCD34D]" },
  { name: "White", class: "bg-white border" },
  { name: "Orange", class: "bg-[#FB923C]" },
  { name: "Green", class: "bg-[#22C55E]" },
  { name: "Pink", class: "bg-[#EC4899]" },
  { name: "Cyan", class: "bg-[#06B6D4]" },
  { name: "Blue", class: "bg-[#3B82F6]" },
];

function ProductListingPage() {
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const router = useRouter();
  const {
    products,
    currentPage,
    totalProducts,
    totalPages,
    setCurrentPage,
    fetchProductsForClient,
    isLoading,
    error,
  } = useProductStore();
  const { addToWishlist, isInWishlist, fetchWishlist } = useWishlistStore();
  const { listingPageBanner, fetchListingPageBanner } = useSettingsStore();
  const { toast } = useToast();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only fetch wishlist if user is authenticated
    if (user) {
      fetchWishlist();
    }
    fetchListingPageBanner();
  }, [fetchWishlist, fetchListingPageBanner, user]);

  const fetchAllProducts = () => {
    fetchProductsForClient({
      page: currentPage,
      limit: 5,
      categories: selectedCategories,
      sizes: selectedSizes,
      colors: selectedColors,
      brands: selectedBrands,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sortBy,
      sortOrder,
    });
  };

  useEffect(() => {
    fetchAllProducts();
  }, [
    currentPage,
    selectedCategories,
    selectedSizes,
    selectedBrands,
    selectedColors,
    priceRange,
    sortBy,
    sortOrder,
  ]);

  const handleSortChange = (value: string) => {
    console.log(value);
    const [newSortBy, newSortOrder] = value.split("-");
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as "asc" | "desc");
  };

  const handleToggleFilter = (
    filterType: "categories" | "sizes" | "brands" | "colors",
    value: string
  ) => {
    const setterMap = {
      categories: setSelectedCategories,
      sizes: setSelectedSizes,
      colors: setSelectedColors,
      brands: setSelectedBrands,
    };

    setterMap[filterType]((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const FilterSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 font-semibold">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center">
                <Checkbox
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() =>
                    handleToggleFilter("categories", category)
                  }
                  id={category}
                />
                <Label htmlFor={category} className="ml-2 text-sm">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Brands</h3>
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center">
                <Checkbox
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => handleToggleFilter("brands", brand)}
                  id={brand}
                />
                <Label htmlFor={brand} className="ml-2 text-sm">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((sizeItem) => (
              <Button
                key={sizeItem}
                variant={
                  selectedSizes.includes(sizeItem) ? "default" : "outline"
                }
                onClick={() => handleToggleFilter("sizes", sizeItem)}
                className="h-8 w-8"
                size="sm"
              >
                {sizeItem}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Colors</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.name}
                className={`w-6 h-6 rounded-full ${color.class} ${
                  selectedColors.includes(color.name)
                    ? "ring-offset-2 ring-black ring-2"
                    : ""
                }`}
                title={color.name}
                onClick={() => handleToggleFilter("colors", color.name)}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Price range</h3>
          <Slider
            defaultValue={[0, 100000]}
            max={100000}
            step={1}
            className="w-full"
            value={priceRange}
            onValueChange={(value) => setPriceRange(value)}
          />
          <div className="flex justify-between mt-2 text-sm">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative h-[300px] overflow-hidden">
        {listingPageBanner ? (
          <>
            <img
              src={listingPageBanner.imageUrl}
              alt="Listing Page Banner"
              className="w-full object-cover h-full"
              onError={(e) => handleImageError(e)}
            />
            {(listingPageBanner.title || listingPageBanner.subtitle) && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="text-center text-white">
                  {listingPageBanner.title && (
                    <h1 className="text-4xl font-bold mb-2">{listingPageBanner.title}</h1>
                  )}
                  {listingPageBanner.subtitle && (
                    <p className="text-lg">{listingPageBanner.subtitle}</p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <img
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
              alt="Listing Page Banner"
              className="w-full object-cover h-full"
              onError={(e) => handleImageError(e)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-2">HOT COLLECTION</h1>
                <p className="text-lg">Discover our latest collection</p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">All Products</h2>
          <div className="flex items-center gap-4">
            {/* Mobile filter render */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant={"outline"} className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-h-[600px] overflow-auto max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <FilterSection />
              </DialogContent>
            </Dialog>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => handleSortChange(value)}
              name="sort"
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-asc">Sort by: Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price : High to Low</SelectItem>
                <SelectItem value="createdAt-desc">
                  Sort by: Newest First
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterSection />
          </div>
          {/* product grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <Button onClick={fetchAllProducts} variant="outline">
                  Try Again
                </Button>
              </Card>
            ) : products.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No products found</p>
                <p className="text-gray-400 text-sm mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button onClick={() => {
                  setSelectedCategories([]);
                  setSelectedSizes([]);
                  setSelectedColors([]);
                  setSelectedBrands([]);
                  setPriceRange([0, 100000]);
                }} variant="outline">
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((productItem) => (
                  <Card
                    key={productItem.id}
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/listing/${productItem.id}`)}
                  >
                    <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                      <img
                        src={productItem.images[0] || PLACEHOLDER_IMAGE}
                        alt={productItem.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => handleImageError(e)}
                        loading="lazy"
                      />
                      {productItem.isFeatured && (
                        <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                          Featured
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!user) {
                            toast({
                              title: "Please sign in to add items to wishlist",
                              variant: "destructive",
                            });
                            router.push("/auth/login?redirect=/listing");
                            return;
                          }
                          // Check status before the operation
                          const wasInWishlist = isInWishlist(productItem.id);
                          const success = await addToWishlist(productItem.id);
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
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isInWishlist(productItem.id)
                              ? "fill-pink-500 text-pink-500"
                              : ""
                          }`}
                        />
                      </Button>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button 
                          className="bg-white text-black hover:bg-gray-100 transition-all hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/listing/${productItem.id}`);
                          }}
                        >
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          View Product
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">{productItem.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{productItem.brand}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          ${productItem.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                        {productItem.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{productItem.rating.toFixed(1)}</span>
                          </div>
                        )}
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            productItem.stock > 0 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {productItem.stock > 0 ? `${productItem.stock} left` : "Out"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {productItem.colors.slice(0, 4).map((colorItem, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: colorItem }}
                            title={colorItem}
                          />
                        ))}
                        {productItem.colors.length > 4 && (
                          <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-200 flex items-center justify-center text-xs">
                            +{productItem.colors.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* pagination */}
            <div className="mt-10 items-center flex justify-center gap-2">
              <Button
                disabled={currentPage === 1}
                variant={"outline"}
                size={"icon"}
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    className="w-10"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                disabled={currentPage === totalPages}
                variant={"outline"}
                size={"icon"}
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductListingPage;
