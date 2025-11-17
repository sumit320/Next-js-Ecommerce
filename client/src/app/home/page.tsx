"use client";

import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/utils/placeholders";

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { banners, featuredProducts, gridItems, gridSectionSettings, fetchFeaturedProducts, fetchBanners, fetchGridItems, fetchGridSectionSettings, isLoading } =
    useSettingsStore();

  useEffect(() => {
    fetchBanners();
    fetchFeaturedProducts();
    fetchGridItems();
    fetchGridSectionSettings();
  }, [fetchBanners, fetchFeaturedProducts, fetchGridItems, fetchGridSectionSettings]);

  useEffect(() => {
    if (banners.length > 0) {
      const bannerTimer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(bannerTimer);
    }
  }, [banners.length]);

  return (
    <div className="min-h-screen bg-gray-100">
      <section className="relative h-[600px] overflow-hidden">
        {banners.map((bannerItem, index) => (
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
            key={bannerItem.id}
          >
            <div className="absolute inset-0 z-0">
              <img
                src={bannerItem.imageUrl}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none" />
            </div>
            {bannerItem.showText !== false && (
              <div className="relative h-full container mx-auto px-4 flex items-center z-20">
                <div className="text-white space-y-6 relative z-20">
                  {bannerItem.title && (
                    <span className="text-sm uppercase tracking-wider">
                      {bannerItem.title}
                    </span>
                  )}
                  {bannerItem.subtitle && (
                    <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                      {bannerItem.subtitle.split('\n').map((line: string, i: number, arr: string[]) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </h1>
                  )}
                  {bannerItem.description && (
                    <p className="text-lg">
                      {bannerItem.description.split('\n').map((line: string, i: number, arr: string[]) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  )}
                  <Button 
                    type="button"
                    className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg transition-all hover:scale-105 relative z-10 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const link = bannerItem.buttonLink || "/listing";
                      router.push(link);
                    }}
                  >
                    {bannerItem.buttonText || "SHOP NOW"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </section>

      {/* grid section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {(gridSectionSettings?.title || gridSectionSettings?.subtitle) && (
            <>
              {gridSectionSettings.title && (
                <h2 className="text-center text-3xl font-semibold mb-2">
                  {gridSectionSettings.title}
                </h2>
              )}
              {gridSectionSettings.subtitle && (
                <p className="text-center text-gray-500 mb-8">
                  {gridSectionSettings.subtitle}
                </p>
              )}
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gridItems.length > 0 ? (
              gridItems.map((gridItem) => (
                <div key={gridItem.id} className="relative group overflow-hidden cursor-pointer" onClick={() => router.push(gridItem.link || "/listing")}>
                  <div className="aspect-[3/4]">
                    <img
                      src={gridItem.imageUrl}
                      alt={gridItem.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-center text-white p-4">
                      <h3 className="text-xl font-semibold mb-2">
                        {gridItem.title}
                      </h3>
                      <p className="text-sm">{gridItem.subtitle}</p>
                      <Button 
                        className="mt-4 bg-white text-black hover:bg-gray-100 transition-all hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(gridItem.link || "/listing");
                        }}
                      >
                        SHOP NOW
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center text-gray-500 py-8">
                No grid items available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature products section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-semibold mb-2">
            NEW ARRIVALS
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Shop our new arrivals from established brands
          </p>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No featured products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((productItem, index) => (
                <div 
                  key={productItem.id || index} 
                  className="relative group overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/listing/${productItem.id}`)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={productItem.images?.[0] || PLACEHOLDER_IMAGE}
                      alt={productItem.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => handleImageError(e)}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{productItem.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold">{productItem.price || "$0.00"}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      className="bg-white text-black hover:bg-gray-100 transition-all hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/listing/${productItem.id}`);
                      }}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      VIEW PRODUCT
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recently Viewed Products */}
      <RecentlyViewedSection />
    </div>
  );
}

function RecentlyViewedSection() {
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    setRecentlyViewed(viewed.slice(0, 4));
  }, []);

  if (!mounted || recentlyViewed.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl font-semibold mb-2">
          RECENTLY VIEWED
        </h2>
        <p className="text-center text-gray-500 mb-12">
          Continue shopping from where you left off
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentlyViewed.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/listing/${item.id}`)}
            >
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <img
                  src={item.image || PLACEHOLDER_IMAGE}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => handleImageError(e)}
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1">{item.name}</h3>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomePage;
