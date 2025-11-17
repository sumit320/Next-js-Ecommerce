import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { create } from "zustand";

export interface FeatureBanner {
  id: string;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  showText?: boolean;
}

interface FeaturedProduct {
  id: string;
  name: string;
  price: string;
  images: string[];
}

export interface GridItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  link?: string | null;
  order: number;
}

export interface ListingPageBanner {
  id: string;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
}

export interface GridSectionSettings {
  title?: string | null;
  subtitle?: string | null;
}

interface SettingsState {
  banners: FeatureBanner[];
  featuredProducts: FeaturedProduct[];
  gridItems: GridItem[];
  listingPageBanner: ListingPageBanner | null;
  gridSectionSettings: GridSectionSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchBanners: () => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchGridItems: () => Promise<void>;
  fetchListingPageBanner: () => Promise<void>;
  fetchGridSectionSettings: () => Promise<void>;
  addBanners: (files: File[], texts?: Array<{ title?: string; subtitle?: string; description?: string; buttonText?: string; buttonLink?: string; showText?: boolean }>) => Promise<boolean>;
  updateBanner: (id: string, data: { title?: string; subtitle?: string; description?: string; buttonText?: string; buttonLink?: string; showText?: boolean }) => Promise<boolean>;
  deleteBanner: (id: string) => Promise<boolean>;
  addGridItems: (files: File[], texts?: { title?: string; subtitle?: string; link?: string; order?: number }[]) => Promise<boolean>;
  updateGridItem: (id: string, data: { title?: string; subtitle?: string; link?: string; order?: number }, file?: File) => Promise<boolean>;
  deleteGridItem: (id: string) => Promise<boolean>;
  updateFeaturedProducts: (productIds: string[]) => Promise<boolean>;
  addOrUpdateListingPageBanner: (file?: File, data?: { title?: string; subtitle?: string }) => Promise<boolean>;
  deleteListingPageBanner: (id: string) => Promise<boolean>;
  updateGridSectionSettings: (data: { title?: string; subtitle?: string }) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  banners: [],
  featuredProducts: [],
  gridItems: [],
  listingPageBanner: null,
  gridSectionSettings: null,
  isLoading: false,
  error: null,
  fetchBanners: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.SETTINGS}/get-banners`, {
        withCredentials: true,
        timeout: 10000, // 10 second timeout
      });
      set({ banners: response.data.banners || [], isLoading: false });
    } catch (e) {
      console.error("Failed to fetch banners:", e);
      let errorMessage = "Failed to fetch banners";
      
      if (axios.isAxiosError(e)) {
        if (e.code === "ECONNABORTED" || e.message === "Network Error" || e.code === "ERR_NETWORK") {
          errorMessage = "Server is not responding. Please check if the server is running on http://localhost:3001";
        } else if (e.response) {
          errorMessage = `Failed to fetch banners: ${e.response.status} - ${e.response.statusText}`;
        } else if (e.code === "ECONNREFUSED") {
          errorMessage = "Connection refused. Make sure the server is running on http://localhost:3001";
        }
      }
      
      // Set empty array on error so UI doesn't break
      set({ banners: [], error: errorMessage, isLoading: false });
    }
  },
  fetchFeaturedProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.SETTINGS}/fetch-feature-products`,
        {
          withCredentials: true,
          timeout: 15000, // Increased to 15 seconds
        }
      );
      set({
        featuredProducts: response.data.featuredProducts || [],
        isLoading: false,
        error: null,
      });
    } catch (e) {
      console.error("Failed to fetch featured products:", e);
      
      // Silently fail and set empty array so UI doesn't break
      // Featured products are not critical for page functionality
      set({
        featuredProducts: [],
        error: null, // Don't show error to user for non-critical data
        isLoading: false,
      });
    }
  },
  addBanners: async (files: File[], texts?: Array<{ title?: string; subtitle?: string; description?: string; buttonText?: string; buttonLink?: string; showText?: boolean }>) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      
      // Add text fields if provided
      if (texts && texts.length > 0) {
        const titles = texts.map(t => t.title || "");
        const subtitles = texts.map(t => t.subtitle || "");
        const descriptions = texts.map(t => t.description || "");
        const buttonTexts = texts.map(t => t.buttonText || "");
        const buttonLinks = texts.map(t => t.buttonLink || "");
        const showTexts = texts.map(t => t.showText !== undefined ? t.showText : true);
        
        formData.append("title", JSON.stringify(titles));
        formData.append("subtitle", JSON.stringify(subtitles));
        formData.append("description", JSON.stringify(descriptions));
        formData.append("buttonText", JSON.stringify(buttonTexts));
        formData.append("buttonLink", JSON.stringify(buttonLinks));
        formData.append("showText", JSON.stringify(showTexts));
      }
      
      const response = await axios.post(
        `${API_ROUTES.SETTINGS}/banners`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({
        isLoading: false,
      });

      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to add banners", isLoading: false });
      return false;
    }
  },
  updateBanner: async (id: string, data: { title?: string; subtitle?: string; description?: string; buttonText?: string; buttonLink?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(
        `${API_ROUTES.SETTINGS}/banners/${id}`,
        data,
        {
          withCredentials: true,
        }
      );
      set({ isLoading: false });
      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to update banner", isLoading: false });
      return false;
    }
  },
  deleteBanner: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(
        `${API_ROUTES.SETTINGS}/banners/${id}`,
        {
          withCredentials: true,
        }
      );
      set({ isLoading: false });
      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to delete banner", isLoading: false });
      return false;
    }
  },
  fetchGridItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.SETTINGS}/get-grid-items`, {
        withCredentials: true,
        timeout: 10000,
      });
      set({ gridItems: response.data.gridItems || [], isLoading: false });
    } catch (e) {
      console.error("Failed to fetch grid items:", e);
      let errorMessage = "Failed to fetch grid items";
      
      if (axios.isAxiosError(e)) {
        if (e.code === "ECONNABORTED" || e.message === "Network Error") {
          errorMessage = "Server is not responding. Please check if the server is running.";
        } else if (e.response) {
          errorMessage = `Failed to fetch grid items: ${e.response.status}`;
        }
      }
      
      set({ gridItems: [], error: errorMessage, isLoading: false });
    }
  },
  addGridItems: async (files: File[], texts?: { title?: string; subtitle?: string; link?: string; order?: number }[]) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      
      if (texts && texts.length > 0) {
        const titles = texts.map(t => t.title || "");
        const subtitles = texts.map(t => t.subtitle || "");
        const links = texts.map(t => t.link || "");
        const orders = texts.map(t => t.order?.toString() || "");
        
        formData.append("titles", JSON.stringify(titles));
        formData.append("subtitles", JSON.stringify(subtitles));
        formData.append("links", JSON.stringify(links));
        formData.append("orders", JSON.stringify(orders));
      }
      
      const response = await axios.post(
        `${API_ROUTES.SETTINGS}/grid-items`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({ isLoading: false });
      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to add grid items", isLoading: false });
      return false;
    }
  },
  updateGridItem: async (id: string, data: { title?: string; subtitle?: string; link?: string; order?: number }, file?: File) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      if (file) formData.append("image", file);
      if (data.title !== undefined) formData.append("title", data.title);
      if (data.subtitle !== undefined) formData.append("subtitle", data.subtitle);
      if (data.link !== undefined) formData.append("link", data.link || "");
      if (data.order !== undefined) formData.append("order", data.order.toString());
      
      const response = await axios.put(
        `${API_ROUTES.SETTINGS}/grid-items/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({ isLoading: false });
      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to update grid item", isLoading: false });
      return false;
    }
  },
  deleteGridItem: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(
        `${API_ROUTES.SETTINGS}/grid-items/${id}`,
        {
          withCredentials: true,
        }
      );
      set({ isLoading: false });
      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to delete grid item", isLoading: false });
      return false;
    }
  },
  updateFeaturedProducts: async (productIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${API_ROUTES.SETTINGS}/update-feature-products`,
        { productIds },
        {
          withCredentials: true,
        }
      );
      set({
        isLoading: false,
      });
      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to update featured products", isLoading: false });
      return false;
    }
  },
  fetchListingPageBanner: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.SETTINGS}/get-listing-page-banner`, {
        withCredentials: true,
        timeout: 10000,
      });
      set({ listingPageBanner: response.data.banner || null, isLoading: false });
    } catch (e) {
      console.error("Failed to fetch listing page banner:", e);
      set({ listingPageBanner: null, error: "Failed to fetch listing page banner", isLoading: false });
    }
  },
  addOrUpdateListingPageBanner: async (file?: File, data?: { title?: string; subtitle?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      if (file) formData.append("image", file);
      // Always append title and subtitle, even if empty, so they can be cleared
      formData.append("title", data?.title || "");
      formData.append("subtitle", data?.subtitle || "");
      
      const response = await axios.post(
        `${API_ROUTES.SETTINGS}/listing-page-banner`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      set({ 
        listingPageBanner: response.data.banner || null,
        isLoading: false 
      });
      return response.data.success;
    } catch (e: any) {
      console.error("Error adding/updating listing page banner:", e);
      if (e.response) {
        console.error("Response data:", e.response.data);
      }
      set({ error: e.response?.data?.message || "Failed to add/update listing page banner", isLoading: false });
      return false;
    }
  },
  deleteListingPageBanner: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(
        `${API_ROUTES.SETTINGS}/listing-page-banner/${id}`,
        {
          withCredentials: true,
        }
      );
      set({ listingPageBanner: null, isLoading: false });
      return response.data.success;
    } catch (e) {
      console.error(e);
      set({ error: "Failed to delete listing page banner", isLoading: false });
      return false;
    }
  },
  fetchGridSectionSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_ROUTES.SETTINGS}/get-grid-section-settings`, {
        withCredentials: true,
        timeout: 10000,
      });
      set({ gridSectionSettings: response.data.settings || null, isLoading: false });
    } catch (e) {
      console.error("Failed to fetch grid section settings:", e);
      set({ gridSectionSettings: null, error: "Failed to fetch grid section settings", isLoading: false });
    }
  },
  updateGridSectionSettings: async (data: { title?: string; subtitle?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(
        `${API_ROUTES.SETTINGS}/grid-section-settings`,
        data,
        {
          withCredentials: true,
        }
      );
      set({ 
        gridSectionSettings: response.data.settings || null,
        isLoading: false 
      });
      return response.data.success;
    } catch (e: any) {
      console.error("Error updating grid section settings:", e);
      set({ error: e.response?.data?.message || "Failed to update grid section settings", isLoading: false });
      return false;
    }
  },
}));
