"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ImageIcon, Upload, X, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";

interface BannerText {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  showText: boolean;
}

interface GridItemText {
  title: string;
  subtitle: string;
  link: string;
  order: number;
}

interface ListingPageBannerFormProps {
  listingPageBanner: { id: string; imageUrl: string; title?: string | null; subtitle?: string | null } | null;
  onSave: (file?: File, data?: { title?: string; subtitle?: string }) => Promise<boolean>;
}

function ListingPageBannerForm({ listingPageBanner, onSave }: ListingPageBannerFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(listingPageBanner?.title || "");
  const [subtitle, setSubtitle] = useState(listingPageBanner?.subtitle || "");

  useEffect(() => {
    if (listingPageBanner) {
      setTitle(listingPageBanner.title || "");
      setSubtitle(listingPageBanner.subtitle || "");
    }
  }, [listingPageBanner]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(selectedFile || undefined, {
      title: title || undefined,
      subtitle: subtitle || undefined,
    });
    if (selectedFile) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      const input = document.getElementById("listing-banner-upload") as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="listing-banner-upload" className="mb-2 block">
          Banner Image {listingPageBanner ? "(Leave empty to keep current)" : ""}
        </Label>
        <Input
          id="listing-banner-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="cursor-pointer"
        />
        {previewUrl && (
          <div className="mt-2 relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setSelectedFile(null);
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                const input = document.getElementById("listing-banner-upload") as HTMLInputElement;
                if (input) input.value = "";
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="listing-banner-title">Title (e.g., "HOT COLLECTION")</Label>
        <Input
          id="listing-banner-title"
          type="text"
          placeholder="Enter banner title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="listing-banner-subtitle">Subtitle (e.g., "Discover our latest collection")</Label>
        <Input
          id="listing-banner-subtitle"
          type="text"
          placeholder="Enter banner subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <Button
        type="submit"
        disabled={
          listingPageBanner 
            ? (!selectedFile && title === (listingPageBanner.title || "") && subtitle === (listingPageBanner.subtitle || ""))
            : !selectedFile
        }
        className="w-full bg-red-500 hover:bg-red-600 text-white"
      >
        {listingPageBanner ? "Update Banner" : "Add Banner"}
      </Button>
    </form>
  );
}

function SuperAdminCouponsPage() {
  const [uploadedFiles, setuploadedFiles] = useState<File[]>([]);
  const [bannerPreviewUrls, setBannerPreviewUrls] = useState<string[]>([]);
  const [bannerTexts, setBannerTexts] = useState<BannerText[]>([]);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<BannerText>({
    title: "",
    subtitle: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    showText: true,
  });
  const [uploadedGridFiles, setUploadedGridFiles] = useState<File[]>([]);
  const [gridItemTexts, setGridItemTexts] = useState<GridItemText[]>([]);
  const [editingGridItem, setEditingGridItem] = useState<any>(null);
  const [editGridFormData, setEditGridFormData] = useState<GridItemText>({
    title: "",
    subtitle: "",
    link: "",
    order: 0,
  });
  const [editGridImageFile, setEditGridImageFile] = useState<File | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [gridSectionFormData, setGridSectionFormData] = useState({
    title: "",
    subtitle: "",
  });
  const { products, fetchAllProductsForAdmin } = useProductStore();
  const {
    featuredProducts,
    banners,
    gridItems,
    listingPageBanner,
    gridSectionSettings,
    isLoading,
    error,
    fetchBanners,
    fetchFeaturedProducts,
    fetchGridItems,
    fetchListingPageBanner,
    fetchGridSectionSettings,
    addBanners,
    updateBanner,
    deleteBanner,
    addGridItems,
    updateGridItem,
    deleteGridItem,
    updateFeaturedProducts,
    addOrUpdateListingPageBanner,
    deleteListingPageBanner,
    updateGridSectionSettings,
  } = useSettingsStore();
  const pageLoadRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!pageLoadRef.current) {
      fetchBanners();
      fetchAllProductsForAdmin();
      fetchFeaturedProducts();
      fetchGridItems();
      fetchListingPageBanner();
      fetchGridSectionSettings();
      pageLoadRef.current = true;
    }
  }, [fetchAllProductsForAdmin, fetchFeaturedProducts, fetchBanners, fetchGridItems, fetchListingPageBanner, fetchGridSectionSettings]);

  // Update form data when settings are loaded
  useEffect(() => {
    if (gridSectionSettings) {
      setGridSectionFormData({
        title: gridSectionSettings.title || "",
        subtitle: gridSectionSettings.subtitle || "",
      });
    }
  }, [gridSectionSettings]);

  console.log(products, "products");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      console.log("Files selected:", newFiles.length);
      
      // Create preview URLs for new files
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      
      setuploadedFiles((prev) => {
        const updated = [...prev, ...newFiles];
        console.log("Total uploaded files:", updated.length);
        return updated;
      });
      
      setBannerPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
      
      // Initialize text fields for new files
      const newTexts = newFiles.map(() => ({
        title: "",
        subtitle: "",
        description: "",
        buttonText: "SHOP NOW",
        buttonLink: "/listing",
        showText: false, // Default to false (image only) if no text is provided
      }));
      setBannerTexts((prev) => [...prev, ...newTexts]);
    }
    // Reset the input to allow selecting the same file again
    e.target.value = "";
  };

  const removeImage = (getCurrentIndex: number) => {
    // Revoke the object URL before removing
    setBannerPreviewUrls((prev) => {
      const urlToRevoke = prev[getCurrentIndex];
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
      return prev.filter((_, i) => i !== getCurrentIndex);
    });
    setuploadedFiles((prev) => prev.filter((_, i) => i !== getCurrentIndex));
    setBannerTexts((prev) => prev.filter((_, i) => i !== getCurrentIndex));
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      bannerPreviewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [bannerPreviewUrls]);

  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setEditFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      buttonText: banner.buttonText || "SHOP NOW",
      buttonLink: banner.buttonLink || "/listing",
      showText: banner.showText !== undefined ? banner.showText : true,
    });
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    
    const result = await updateBanner(editingBanner.id, editFormData);
    if (result) {
      toast({
        title: "Banner updated successfully",
        variant: "success",
      });
      fetchBanners();
      setEditingBanner(null);
    } else {
      toast({
        title: "Failed to update banner",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      const result = await deleteBanner(id);
      if (result) {
        toast({
          title: "Banner deleted successfully",
          variant: "success",
        });
        fetchBanners();
      } else {
        toast({
          title: "Failed to delete banner",
          variant: "destructive",
        });
      }
    }
  };

  const updateBannerText = (index: number, field: keyof BannerText, value: string | boolean) => {
    setBannerTexts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      if (prev.length > 8) {
        toast({
          title: "You can select up to 8 products as featured",
          variant: "destructive",
        });
        return prev;
      }

      return [...prev, productId];
    });
  };

  const handleGridImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedGridFiles((prev) => [...prev, ...newFiles]);
      const newTexts = newFiles.map((_, index) => ({
        title: "",
        subtitle: "",
        link: "/listing",
        order: uploadedGridFiles.length + index,
      }));
      setGridItemTexts((prev) => [...prev, ...newTexts]);
    }
  };

  const removeGridImage = (getCurrentIndex: number) => {
    setUploadedGridFiles((prev) => prev.filter((_, i) => i !== getCurrentIndex));
    setGridItemTexts((prev) => prev.filter((_, i) => i !== getCurrentIndex));
  };

  const updateGridItemText = (index: number, field: keyof GridItemText, value: string | number) => {
    setGridItemTexts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleEditGridItem = (item: any) => {
    setEditingGridItem(item);
    setEditGridFormData({
      title: item.title || "",
      subtitle: item.subtitle || "",
      link: item.link || "/listing",
      order: item.order || 0,
    });
    setEditGridImageFile(null);
  };

  const handleUpdateGridItem = async () => {
    if (!editingGridItem) return;
    
    const result = await updateGridItem(editingGridItem.id, editGridFormData, editGridImageFile || undefined);
    if (result) {
      toast({
        title: "Grid item updated successfully",
        variant: "success",
      });
      fetchGridItems();
      setEditingGridItem(null);
      setEditGridImageFile(null);
    } else {
      toast({
        title: "Failed to update grid item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGridItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this grid item?")) {
      const result = await deleteGridItem(id);
      if (result) {
        toast({
          title: "Grid item deleted successfully",
          variant: "success",
        });
        fetchGridItems();
      } else {
        toast({
          title: "Failed to delete grid item",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveChanges = async () => {
    if (uploadedFiles.length > 0) {
      const result = await addBanners(uploadedFiles, bannerTexts);
      if (result) {
        // Clean up preview URLs
        bannerPreviewUrls.forEach((url) => {
          URL.revokeObjectURL(url);
        });
        setuploadedFiles([]);
        setBannerPreviewUrls([]);
        setBannerTexts([]);
        fetchBanners();
        toast({
          title: "Banners added successfully",
          variant: "success",
        });
      }
    }

    if (uploadedGridFiles.length > 0) {
      const result = await addGridItems(uploadedGridFiles, gridItemTexts);
      if (result) {
        setUploadedGridFiles([]);
        setGridItemTexts([]);
        fetchGridItems();
        toast({
          title: "Grid items added successfully",
          variant: "success",
        });
      }
    }

    const result = await updateFeaturedProducts(selectedProducts);
    if (result) {
      toast({
        title: "Featured products updated successfully",
        variant: "success",
      });
      fetchFeaturedProducts();
    }
  };

  useEffect(() => {
    setSelectedProducts(featuredProducts.map((pro) => pro.id));
  }, [featuredProducts]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Settings & Features</h1>
        </header>
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Banner Management</h2>
            
            {/* Add New Banners */}
            <div className="mb-6">
              <h3 className="mb-2 font-medium">Add New Banners</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-gray-200 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-7 w-7 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click to upload Banner Images
                      </span>
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </Label>
                </div>
                
                {/* New Banner Previews with Text Inputs */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={`banner-${index}-${file.name}`} className="border rounded-lg p-4 space-y-3">
                        <div className="relative group">
                          <img
                            src={bannerPreviewUrls[index] || ""}
                            alt={`Uploaded image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-md"
                            onError={(e) => {
                              console.error("Failed to load image preview:", file.name, "URL:", bannerPreviewUrls[index]);
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3EImage Preview Error%3C/text%3E%3C/svg%3E";
                            }}
                            onLoad={() => {
                              console.log("Image preview loaded successfully:", file.name);
                            }}
                          />
                          <Button
                            variant="destructive"
                            size={"icon"}
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={bannerTexts[index]?.title || ""}
                              onChange={(e) => updateBannerText(index, "title", e.target.value)}
                              placeholder="e.g., I AM JOHN"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Subtitle</Label>
                            <Input
                              value={bannerTexts[index]?.subtitle || ""}
                              onChange={(e) => updateBannerText(index, "subtitle", e.target.value)}
                              placeholder="e.g., BEST SELLING E-COMMERCE"
                              className="mt-1"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Description</Label>
                            <Textarea
                              value={bannerTexts[index]?.description || ""}
                              onChange={(e) => updateBannerText(index, "description", e.target.value)}
                              placeholder="Banner description"
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Button Text</Label>
                            <Input
                              value={bannerTexts[index]?.buttonText || "SHOP NOW"}
                              onChange={(e) => updateBannerText(index, "buttonText", e.target.value)}
                              placeholder="SHOP NOW"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Button Link</Label>
                            <Input
                              value={bannerTexts[index]?.buttonLink || "/listing"}
                              onChange={(e) => updateBannerText(index, "buttonLink", e.target.value)}
                              placeholder="/listing"
                              className="mt-1"
                            />
                          </div>
                          <div className="col-span-2 flex items-center space-x-2">
                            <Checkbox
                              id={`show-text-${index}`}
                              checked={bannerTexts[index]?.showText !== undefined ? bannerTexts[index].showText : false}
                              onCheckedChange={(checked) => {
                                updateBannerText(index, "showText", checked as boolean);
                              }}
                            />
                            <Label htmlFor={`show-text-${index}`} className="text-xs cursor-pointer">
                              Show text and button on user side
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Existing Banners */}
            <div>
              <h3 className="mb-4 font-medium">Existing Banners</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="border rounded-lg p-4 space-y-3">
                    <div className="relative group">
                      <img
                        src={banner.imageUrl}
                        alt={`Banner ${banner.id}`}
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog open={editingBanner?.id === banner.id} onOpenChange={(open) => !open && setEditingBanner(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => handleEditBanner(banner)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Banner</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <img
                                  src={banner.imageUrl}
                                  alt="Banner"
                                  className="w-full h-64 object-cover rounded-md"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    placeholder="e.g., I AM JOHN"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Subtitle</Label>
                                  <Input
                                    value={editFormData.subtitle}
                                    onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })}
                                    placeholder="e.g., BEST SELLING E-COMMERCE"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    placeholder="Banner description"
                                    className="mt-1"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label>Button Text</Label>
                                  <Input
                                    value={editFormData.buttonText}
                                    onChange={(e) => setEditFormData({ ...editFormData, buttonText: e.target.value })}
                                    placeholder="SHOP NOW"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Button Link</Label>
                                  <Input
                                    value={editFormData.buttonLink}
                                    onChange={(e) => setEditFormData({ ...editFormData, buttonLink: e.target.value })}
                                    placeholder="/listing"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-2 flex items-center space-x-2">
                                  <Checkbox
                                    id="edit-show-text"
                                    checked={editFormData.showText}
                                    onCheckedChange={(checked) => {
                                      setEditFormData({ ...editFormData, showText: checked as boolean });
                                    }}
                                  />
                                  <Label htmlFor="edit-show-text" className="cursor-pointer">
                                    Show text and button on user side
                                  </Label>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingBanner(null)}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateBanner}>
                                  Update Banner
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteBanner(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      {banner.title && <p><strong>Title:</strong> {banner.title}</p>}
                      {banner.subtitle && <p><strong>Subtitle:</strong> {banner.subtitle}</p>}
                      {banner.buttonText && <p><strong>Button:</strong> {banner.buttonText}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Section Settings */}
          <div className="mb-6 p-4 border rounded-lg bg-white">
            <h2 className="mb-4 text-xl font-semibold">Grid Section Settings</h2>
            <p className="text-sm text-gray-600 mb-4">
              Manage the title and subtitle displayed above the grid items section on the home page.
            </p>
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={gridSectionFormData.title}
                  onChange={(e) => setGridSectionFormData({ ...gridSectionFormData, title: e.target.value })}
                  placeholder="e.g., THE WINTER EDIT"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Section Subtitle</Label>
                <Input
                  value={gridSectionFormData.subtitle}
                  onChange={(e) => setGridSectionFormData({ ...gridSectionFormData, subtitle: e.target.value })}
                  placeholder="e.g., Designed to keep your satisfaction and warmth"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={async () => {
                  const result = await updateGridSectionSettings(gridSectionFormData);
                  if (result) {
                    toast({
                      title: "Grid section settings updated successfully",
                    });
                    fetchGridSectionSettings();
                  } else {
                    toast({
                      title: "Failed to update grid section settings",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isLoading}
              >
                Save Settings
              </Button>
            </div>
          </div>

          {/* Grid Items Management */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Grid Items Management</h2>
            
            {/* Add New Grid Items */}
            <div className="mb-6">
              <h3 className="mb-2 font-medium">Add New Grid Items</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label
                    htmlFor="grid-image-upload"
                    className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-gray-200 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-7 w-7 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click to upload Grid Item Images
                      </span>
                    </div>
                    <Input
                      id="grid-image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleGridImageUpload}
                    />
                  </Label>
                </div>
                
                {/* New Grid Item Previews with Text Inputs */}
                {uploadedGridFiles.length > 0 && (
                  <div className="space-y-4">
                    {uploadedGridFiles.map((file, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Uploaded grid image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            variant="destructive"
                            size={"icon"}
                            onClick={() => removeGridImage(index)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={gridItemTexts[index]?.title || ""}
                              onChange={(e) => updateGridItemText(index, "title", e.target.value)}
                              placeholder="e.g., WOMEN"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Subtitle</Label>
                            <Input
                              value={gridItemTexts[index]?.subtitle || ""}
                              onChange={(e) => updateGridItemText(index, "subtitle", e.target.value)}
                              placeholder="e.g., From world's top designer"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Link</Label>
                            <Input
                              value={gridItemTexts[index]?.link || "/listing"}
                              onChange={(e) => updateGridItemText(index, "link", e.target.value)}
                              placeholder="/listing"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Order</Label>
                            <Input
                              type="number"
                              value={gridItemTexts[index]?.order || 0}
                              onChange={(e) => updateGridItemText(index, "order", parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Existing Grid Items */}
            <div>
              <h3 className="mb-4 font-medium">Existing Grid Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gridItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="relative group">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Dialog open={editingGridItem?.id === item.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingGridItem(null);
                            setEditGridImageFile(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => handleEditGridItem(item)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Grid Item</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Image</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setEditGridImageFile(file);
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
                                {editGridImageFile && (
                                  <div className="mt-2">
                                    <img
                                      src={URL.createObjectURL(editGridImageFile)}
                                      alt="Preview"
                                      className="w-full h-32 object-cover rounded-md"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={editGridFormData.title}
                                    onChange={(e) => setEditGridFormData({ ...editGridFormData, title: e.target.value })}
                                    placeholder="e.g., WOMEN"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Subtitle</Label>
                                  <Input
                                    value={editGridFormData.subtitle}
                                    onChange={(e) => setEditGridFormData({ ...editGridFormData, subtitle: e.target.value })}
                                    placeholder="e.g., From world's top designer"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Link</Label>
                                  <Input
                                    value={editGridFormData.link}
                                    onChange={(e) => setEditGridFormData({ ...editGridFormData, link: e.target.value })}
                                    placeholder="/listing"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>Order</Label>
                                  <Input
                                    type="number"
                                    value={editGridFormData.order}
                                    onChange={(e) => setEditGridFormData({ ...editGridFormData, order: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingGridItem(null);
                                    setEditGridImageFile(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateGridItem}>
                                  Update Grid Item
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteGridItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><strong>Title:</strong> {item.title}</p>
                      <p><strong>Subtitle:</strong> {item.subtitle}</p>
                      <p><strong>Link:</strong> {item.link || "/listing"}</p>
                      <p><strong>Order:</strong> {item.order}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Listing Page Banner Management */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Listing Page Banner Management</h2>
            
            {/* Current Banner Display */}
            {listingPageBanner && (
              <div className="mb-6 p-4 border rounded-lg bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Current Banner</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this banner?")) {
                        const success = await deleteListingPageBanner(listingPageBanner.id);
                        if (success) {
                          toast({
                            title: "Banner deleted successfully",
                            variant: "success",
                          });
                          fetchListingPageBanner();
                        }
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Banner
                  </Button>
                </div>
                <div className="relative group">
                  <img
                    src={listingPageBanner.imageUrl}
                    alt="Listing page banner"
                    className="w-full h-64 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='300'%3E%3Crect width='800' height='300' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3EBanner Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                {listingPageBanner.title && (
                  <p className="mt-2 text-sm"><strong>Title:</strong> {listingPageBanner.title}</p>
                )}
                {listingPageBanner.subtitle && (
                  <p className="text-sm"><strong>Subtitle:</strong> {listingPageBanner.subtitle}</p>
                )}
              </div>
            )}

            {/* Add/Update Banner Form */}
            <div className="mb-6 p-4 border rounded-lg bg-white">
              <h3 className="mb-4 font-medium">
                {listingPageBanner ? "Update Banner" : "Add New Banner"}
              </h3>
              <ListingPageBannerForm 
                listingPageBanner={listingPageBanner}
                onSave={async (file?: File, data?: { title?: string; subtitle?: string }) => {
                  const success = await addOrUpdateListingPageBanner(file, data);
                  if (success) {
                    toast({
                      title: listingPageBanner ? "Banner updated successfully" : "Banner added successfully",
                      variant: "success",
                    });
                    fetchListingPageBanner();
                  }
                  return success;
                }}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-4">
              Select up to 8 products to feature on client panel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div
                  className={`relative p-4 border rounded-lg ${
                    selectedProducts.includes(product.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  key={product.id}
                >
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => handleProductSelection(product.id)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-500" />
                      )}
                    </div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <p className="font-bold">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <Button
              disabled={isLoading}
              onClick={handleSaveChanges}
              className="w-full"
            >
              {isLoading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminCouponsPage;
