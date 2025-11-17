"use client";

import { protectProductFormAction } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProductStore } from "@/store/useProductStore";
import { brands, categories, colors, sizes } from "@/utils/config";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

interface FormState {
  name: string;
  brand: string;
  description: string;
  category: string;
  gender: string;
  price: string;
  stock: string;
}

function SuperAdminManageProductPage() {
  const [formState, setFormState] = useState({
    name: "",
    brand: "",
    description: "",
    category: "",
    gender: "",
    price: "",
    stock: "",
  });

  const [selectedSizes, setSelectSizes] = useState<string[]>([]);
  const [selectedColors, setSelectColors] = useState<string[]>([]);
  const [selectedfiles, setSelectFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const getCurrentEditedProductId = searchParams.get("id");
  const isEditMode = !!getCurrentEditedProductId;

  const router = useRouter();
  const { createProduct, updateProduct, getProductById, isLoading, error, fetchAllProductsForAdmin } =
    useProductStore();

  useEffect(() => {
    if (isEditMode) {
      getProductById(getCurrentEditedProductId).then((product) => {
        if (product) {
          setFormState({
            name: product.name,
            brand: product.brand,
            description: product.description,
            category: product.category,
            gender: product.gender,
            price: product.price.toString(),
            stock: product.stock.toString(),
          });
          setSelectSizes(product.sizes);
          setSelectColors(product.colors);
          setExistingImages(product.images || []);
        }
      });
    }
  }, [isEditMode, getCurrentEditedProductId, getProductById]);

  useEffect(() => {
    console.log(getCurrentEditedProductId, "getCurrentEditedProductId");

    if (getCurrentEditedProductId === null) {
      setFormState({
        name: "",
        brand: "",
        description: "",
        category: "",
        gender: "",
        price: "",
        stock: "",
      });
      setSelectColors([]);
      setSelectSizes([]);
      setSelectFiles([]);
      setExistingImages([]);
      setImagesToDelete([]);
    }
  }, [getCurrentEditedProductId]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleSize = (size: string) => {
    setSelectSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleToggleColor = (color: string) => {
    setSelectColors((prev) =>
      prev.includes(color) ? prev.filter((s) => s !== color) : [...prev, color]
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setSelectFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = (imageUrl: string) => {
    setImagesToDelete((prev) => [...prev, imageUrl]);
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate required fields
    if (!isEditMode && selectedfiles.length === 0) {
      toast({
        title: "Please select at least one image",
        variant: "destructive",
      });
      return;
    }

    // In edit mode, ensure at least one image remains (existing or new)
    if (isEditMode && existingImages.length === 0 && selectedfiles.length === 0) {
      toast({
        title: "Product must have at least one image",
        variant: "destructive",
      });
      return;
    }

    if (!formState.name || !formState.brand || !formState.category || !formState.gender || !formState.price || !formState.stock) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedSizes.length === 0) {
      toast({
        title: "Please select at least one size",
        variant: "destructive",
      });
      return;
    }

    if (selectedColors.length === 0) {
      toast({
        title: "Please select at least one color",
        variant: "destructive",
      });
      return;
    }

    const checkFirstLevelFormSanitization = await protectProductFormAction();

    if (!checkFirstLevelFormSanitization.success) {
      toast({
        title: checkFirstLevelFormSanitization.error,
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(formState).forEach(([Key, value]) => {
      formData.append(Key, value);
    });

    formData.append("sizes", selectedSizes.join(","));
    formData.append("colors", selectedColors.join(","));

    // Add new images
      selectedfiles.forEach((file) => {
        formData.append("images", file);
      });

    // Add existing images to keep
    formData.append("existingImages", JSON.stringify(existingImages));
    
    // Add images to delete
    if (imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    try {
      const result = isEditMode
        ? await updateProduct(getCurrentEditedProductId, formData)
        : await createProduct(formData);
      if (result) {
        toast({
          title: isEditMode ? "Product updated successfully" : "Product created successfully",
          variant: "default",
        });
        // Refetch products before navigating to ensure the list is up to date
        await fetchAllProductsForAdmin();
        // Small delay to ensure database transaction is committed and state is updated
        setTimeout(() => {
          router.push("/super-admin/products/list");
          router.refresh(); // Force Next.js to refresh the page
        }, 300);
      }
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || error || "Failed to create product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? "Edit Product" : "Add Product"}</h1>
        </header>
        <div className="bg-white rounded-lg shadow-lg p-8">
        <form
          onSubmit={handleFormSubmit}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-1"
        >
          <div className="mt-2 w-full space-y-4">
            {/* Existing Images (Edit Mode Only) */}
            {isEditMode && existingImages.length > 0 && (
              <div>
                <Label className="mb-2 block">Existing Images</Label>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                        width={100}
                        height={100}
                        className="h-24 w-24 object-cover rounded-md border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(imageUrl)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div>
              <Label className="mb-2 block">
                {isEditMode ? "Add More Images" : "Product Images"}
              </Label>
              <div 
                className="w-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-400 p-8 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleFileUploadClick}
            >
              <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <div className="mt-2 text-sm leading-6 text-gray-600">
                  <span>Click to browse</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    You can select multiple images
                  </p>
                </div>
              </div>
              
              {/* New Image Previews */}
              {selectedfiles.length > 0 && (
                <div className="mt-4">
                  <Label className="mb-2 block">New Images to Upload</Label>
                  <div className="flex flex-wrap gap-2">
                  {selectedfiles.map((file, index) => (
                      <div key={index} className="relative group">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="h-24 w-24 object-cover rounded-md border-2 border-blue-200"
                      />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input
                name="name"
                placeholder="Product Name"
                className="mt-1.5"
                onChange={handleInputChange}
                value={formState.name}
              />
            </div>
            <div>
              <Label>Brand</Label>
              <Select
                value={formState.brand}
                onValueChange={(value) => handleSelectChange("brand", value)}
                name="brand"
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Description</Label>
              <Textarea
                name="description"
                className="mt-1.5 min-h-[150px]"
                placeholder="Product description"
                onChange={handleInputChange}
                value={formState.description}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formState.category}
                onValueChange={(value) => handleSelectChange("category", value)}
                name="category"
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={formState.gender}
                onValueChange={(value) => handleSelectChange("gender", value)}
                name="gender"
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {sizes.map((item) => (
                  <Button
                    onClick={() => handleToggleSize(item)}
                    variant={
                      selectedSizes.includes(item) ? "default" : "outline"
                    }
                    key={item}
                    type="button"
                    size={"sm"}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Colors</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Button
                    key={color.name}
                    type="button"
                    className={`h-8 w-8 rounded-full ${color.class} ${
                      selectedColors.includes(color.name)
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    }`}
                    onClick={() => handleToggleColor(color.name)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Product Price</Label>
              <Input
                name="price"
                className="mt-1.5"
                placeholder="Enter Product Price"
                value={formState.price}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                name="stock"
                className="mt-1.5"
                placeholder="Enter Product Stock"
                value={formState.stock}
                onChange={handleInputChange}
              />
            </div>
            <Button
              disabled={isLoading}
              type="submit"
              className="mt-1.5 w-full bg-red-500 hover:bg-red-600 text-white h-11 text-base font-semibold"
            >
              {isLoading 
                ? (isEditMode ? "Updating..." : "Creating...") 
                : (isEditMode ? "Update Product" : "Create Product")}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminManageProductPage;
