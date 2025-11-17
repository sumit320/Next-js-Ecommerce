"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/utils/placeholders";

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  images: string[];
}

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await axios.get(
          `${API_ROUTES.PRODUCTS}/search`,
          {
            params: { query: searchQuery, limit: 5 },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setResults(response.data.products || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleProductClick = (productId: string) => {
    setSearchQuery("");
    setShowResults(false);
    router.push(`/listing/${productId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listing?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowResults(false);
    }
  };

  return (
    <div className="relative flex-1 max-w-lg" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || isSearching) {
              setShowResults(true);
            }
          }}
          className="pl-10 pr-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setSearchQuery("");
              setShowResults(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {showResults && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg">
          <div className="p-2">
            {isSearching ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-16 w-16" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="p-2 text-sm font-semibold text-gray-600 border-b">
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </div>
                <div className="space-y-1">
                  {results.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={product.images[0] || PLACEHOLDER_IMAGE}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e)}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                        <p className="text-sm font-semibold mt-1">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      className="w-full mt-2"
                      onClick={() => {
                        router.push(`/listing?search=${encodeURIComponent(searchQuery)}`);
                        setShowResults(false);
                      }}
                    >
                      View all results for "{searchQuery}"
                    </Button>
                  )}
                </div>
              </>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No products found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}

