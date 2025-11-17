"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useProductStore } from "@/store/useProductStore";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Generate a small placeholder for thumbnails (60x60)
const THUMBNAIL_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='10' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

function SuperAdminProductListingPage() {
  const { products, isLoading, error, fetchAllProductsForAdmin, deleteProduct } =
    useProductStore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Always fetch products when component mounts or pathname changes
    fetchAllProductsForAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    // Log products for debugging
    console.log("Products in store:", products.length, products);
    console.log("Is loading:", isLoading);
    console.log("Error:", error);
    // Log image URLs for debugging
    products.forEach((product) => {
      if (product.images && product.images.length > 0) {
        console.log(`Product ${product.name} images:`, product.images);
      }
    });
  }, [products, isLoading, error]);

  async function handleDeleteProduct(getId: string) {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const result = await deleteProduct(getId);
      if (result) {
        toast({
          title: "Product deleted successfully",
          variant: "success",
        });
        fetchAllProductsForAdmin();
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">All Products</h1>
          <Button 
            onClick={() => router.push("/super-admin/products/add")}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Add New Product
          </Button>
        </header>
        <div className="rounded-lg border bg-white shadow-lg">
          {error && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">Error: {error}</p>
              <Button 
                onClick={() => fetchAllProductsForAdmin()}
                className="mt-2"
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No products found. Create your first product!</p>
              <Button 
                onClick={() => router.push("/super-admin/products/add")}
                className="mt-4"
              >
                Add New Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-[60px] h-[60px] rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name || "product image"}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                // Only log in development
                                if (process.env.NODE_ENV === 'development') {
                                  console.warn("Image failed to load:", {
                                    url: product.images[0],
                                    productId: product.id,
                                    productName: product.name
                                  });
                                }
                                // Replace with placeholder
                                e.currentTarget.src = THUMBNAIL_PLACEHOLDER;
                                e.currentTarget.onerror = null; // Prevent infinite loop
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <img
                              src={THUMBNAIL_PLACEHOLDER}
                              alt="No image available"
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Size: {product.sizes?.join(",") || "N/A"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <p>{product.stock} Item left</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {product.category.toLocaleUpperCase()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() =>
                            router.push(
                              `/super-admin/products/add?id=${product.id}`
                            )
                          }
                          variant={"ghost"}
                          size={"icon"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteProduct(product.id)}
                          variant={"ghost"}
                          size={"icon"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperAdminProductListingPage;
