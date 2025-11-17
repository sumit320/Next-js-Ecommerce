import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "SUPER_ADMIN";
};

type AuthStore = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<string | null>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<Boolean>;
};

const axiosInstance = axios.create({
  baseURL: API_ROUTES.AUTH,
  withCredentials: true,
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Validate inputs before sending
          if (!name || !email || !password) {
            const errorMsg = "Name, email, and password are required";
            set({ isLoading: false, error: errorMsg });
            return null;
          }

          console.log("Sending registration request:", {
            name: name?.substring(0, 10) + "...",
            email,
            passwordLength: password?.length,
          });

          const response = await axiosInstance.post("/register", {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
          });

          console.log("Registration response:", {
            status: response.status,
            data: response.data,
          });

          set({ isLoading: false });
          return response.data.userId;
        } catch (error) {
          let errorMessage = "Registration failed";
          
          // Log the full error for debugging
          console.error("Registration error details:", {
            error,
            isAxiosError: axios.isAxiosError(error),
            hasResponse: axios.isAxiosError(error) ? !!error.response : false,
            status: axios.isAxiosError(error) ? error.response?.status : undefined,
            statusText: axios.isAxiosError(error) ? error.response?.statusText : undefined,
            data: axios.isAxiosError(error) ? error.response?.data : undefined,
            message: axios.isAxiosError(error) ? error.message : (error as Error)?.message,
            code: axios.isAxiosError(error) ? error.code : undefined,
            request: axios.isAxiosError(error) ? {
              url: error.config?.url,
              method: error.config?.method,
              baseURL: error.config?.baseURL,
            } : undefined,
          });

          if (axios.isAxiosError(error)) {
            // Network error (no response from server)
            if (!error.response) {
              errorMessage = error.code === "ECONNREFUSED" 
                ? "Cannot connect to server. Please make sure the server is running."
                : error.code === "ERR_NETWORK"
                ? "Network error. Please check your internet connection."
                : "Server is not responding. Please try again later.";
            } 
            // Server responded with error
            else if (error.response) {
              errorMessage = error.response.data?.error 
                || error.response.data?.message 
                || error.response.statusText 
                || `Registration failed (${error.response.status})`;
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          });

          return null;
        }
      },
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/login", {
            email,
            password,
          });

          set({ isLoading: false, user: response.data.user });
          
          // Sync guest cart to server after successful login
          try {
            const cartStoreModule = await import("./useCartStore");
            const cartStore = cartStoreModule.useCartStore.getState();
            await cartStore.syncGuestCartToServer();
            await cartStore.fetchCart();
          } catch (cartError) {
            console.error("Failed to sync cart after login:", cartError);
            // Don't fail login if cart sync fails
          }
          
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error)
              ? error?.response?.data?.error || "Login failed"
              : "Login failed",
          });

          return false;
        }
      },
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await axiosInstance.post("/logout");
        } catch (error) {
          // Even if logout API fails, we still want to clear local state
          console.error("Logout API error:", error);
        } finally {
          // Always clear user state regardless of API success/failure
          set({ user: null, isLoading: false, error: null });
          
          // Clear cart and wishlist stores
          try {
            const cartStoreModule = await import("./useCartStore");
            const cartStore = cartStoreModule.useCartStore.getState();
            cartStore.clearCart();
          } catch (cartError) {
            console.error("Failed to clear cart:", cartError);
          }
          
          try {
            const wishlistStoreModule = await import("./useWishlistStore");
            const wishlistStore = wishlistStoreModule.useWishlistStore.getState();
            wishlistStore.clearWishlist();
          } catch (wishlistError) {
            console.error("Failed to clear wishlist:", wishlistError);
          }
        }
      },
      refreshAccessToken: async () => {
        try {
          await axiosInstance.post("/refresh-token");
          return true;
        } catch (e) {
          console.error(e);
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
