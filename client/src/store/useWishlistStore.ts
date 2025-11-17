import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistItem {
  id: string;
  productId: string;
  product?: any;
  createdAt: string;
}

interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  checkWishlistStatus: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      fetchWishlist: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get(`${API_ROUTES.WISHLIST}`, {
            withCredentials: true,
          });
          set({
            items: response.data.data || [],
            isLoading: false,
          });
        } catch (error: any) {
          // If user is not authenticated, just clear the wishlist silently
          if (error.response?.status === 401) {
            set({
              items: [],
              isLoading: false,
              error: null,
            });
            return;
          }
          set({
            error: "Failed to fetch wishlist",
            isLoading: false,
          });
        }
      },
      addToWishlist: async (productId: string) => {
        try {
          const response = await axios.post(
            `${API_ROUTES.WISHLIST}/add`,
            { productId },
            { withCredentials: true }
          );
          if (response.data.success) {
            await get().fetchWishlist();
            return true;
          }
          return false;
        } catch (error: any) {
          // Handle unauthenticated users
          if (error.response?.status === 401) {
            set({ error: "Please sign in to add items to wishlist" });
            return false;
          }
          if (error.response?.data?.message?.includes("already")) {
            // Already in wishlist, remove it instead
            return await get().removeFromWishlist(productId);
          }
          set({ error: "Failed to add to wishlist" });
          return false;
        }
      },
      removeFromWishlist: async (productId: string) => {
        try {
          const response = await axios.delete(
            `${API_ROUTES.WISHLIST}/remove/${productId}`,
            { withCredentials: true }
          );
          if (response.data.success) {
            set((state) => ({
              items: state.items.filter((item) => item.productId !== productId),
            }));
            return true;
          }
          return false;
        } catch (error) {
          set({ error: "Failed to remove from wishlist" });
          return false;
        }
      },
      checkWishlistStatus: async (productId: string) => {
        try {
          const response = await axios.get(
            `${API_ROUTES.WISHLIST}/check/${productId}`,
            { withCredentials: true }
          );
          return response.data.isInWishlist || false;
        } catch (error) {
          return false;
        }
      },
      isInWishlist: (productId: string) => {
        return get().items.some((item) => item.productId === productId);
      },
      clearWishlist: () => {
        set({ items: [], error: null });
      },
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

