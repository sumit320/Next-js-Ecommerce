import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import debounce from "lodash/debounce";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncGuestCartToServer: () => Promise<void>;
  loadGuestCart: () => void;
}

// Helper function to generate temporary ID for guest cart items
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      const debounceUpdateCartItemQuantity = debounce(
        async (id: string, quantity: number) => {
          const { items } = get();
          const item = items.find((i) => i.id === id);
          
          // If it's a temp ID (guest cart item), just update locally
          if (id.startsWith("temp_")) {
            set((state) => ({
              items: state.items.map((cartItem) =>
                cartItem.id === id ? { ...cartItem, quantity } : cartItem
              ),
            }));
            return;
          }

          // Otherwise, update on server
          try {
            await axios.put(
              `${API_ROUTES.CART}/update/${id}`,
              { quantity },
              {
                withCredentials: true,
              }
            );
          } catch (e) {
            set({ error: "Failed to update cart quantity" });
          }
        },
        500
      );

      return {
        items: [],
        isLoading: false,
        error: null,
    fetchCart: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_ROUTES.CART}/fetch-cart`, {
          withCredentials: true,
          timeout: 10000,
        });

        const serverItems = response.data.data || [];
        const { items: guestItems } = get();
        
        // If there are guest items, merge them with server items
        if (guestItems.length > 0 && guestItems.some((item) => item.id.startsWith("temp_"))) {
          // Merge guest cart with server cart
          await get().syncGuestCartToServer();
          // Fetch again to get merged cart
          const mergedResponse = await axios.get(`${API_ROUTES.CART}/fetch-cart`, {
            withCredentials: true,
            timeout: 10000,
          });
          set({ items: mergedResponse.data.data || [], isLoading: false });
        } else {
          set({ items: serverItems, isLoading: false });
        }
      } catch (e) {
        // If 401, user is not authenticated - load guest cart from localStorage
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          get().loadGuestCart();
          set({ isLoading: false, error: null });
          return;
        }
        
        // Only log and set error for non-401 errors
        console.error("Failed to fetch cart:", e);
        set({ error: "Failed to fetch cart", isLoading: false });
      }
    },
    addToCart: async (item) => {
      set({ isLoading: true, error: null });
      
      // Check if user is authenticated by trying to add to server cart
      try {
        const response = await axios.post(
          `${API_ROUTES.CART}/add-to-cart`,
          {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          },
          {
            withCredentials: true,
          }
        );

        // Success - user is authenticated, use server response
        set((state) => {
          // Remove any temp item with same product/size/color
          const filteredItems = state.items.filter(
            (i) => !(i.productId === item.productId && i.size === item.size && i.color === item.color)
          );
          return {
            items: [...filteredItems, response.data.data],
            isLoading: false,
          };
        });
      } catch (e) {
        // If 401, user is not authenticated - add to guest cart (localStorage)
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          const { items } = get();
          
          // Check if item already exists in guest cart
          const existingItem = items.find(
            (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
          );

          if (existingItem) {
            // Update quantity
            set((state) => ({
              items: state.items.map((cartItem) =>
                cartItem.id === existingItem.id
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem
              ),
              isLoading: false,
            }));
          } else {
            // Add new item with temp ID
            const newItem: CartItem = {
              id: generateTempId(),
              ...item,
            };
            set((state) => ({
              items: [...state.items, newItem],
              isLoading: false,
            }));
          }
        } else {
          set({ error: "Failed to add to cart", isLoading: false });
        }
      }
    },
    removeFromCart: async (id) => {
      set({ isLoading: true, error: null });
      
      // If it's a temp ID (guest cart), just remove locally
      if (id.startsWith("temp_")) {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          isLoading: false,
        }));
        return;
      }

      // Otherwise, remove from server
      try {
        await axios.delete(`${API_ROUTES.CART}/remove/${id}`, {
          withCredentials: true,
        });

        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          isLoading: false,
        }));
      } catch (e) {
        set({ error: "Failed to delete from cart", isLoading: false });
      }
    },
    updateCartItemQuantity: async (id, quantity) => {
      // Update optimistically
      set((state) => ({
        items: state.items.map((cartItem) =>
          cartItem.id === id ? { ...cartItem, quantity } : cartItem
        ),
      }));

      // Debounce server update (only for non-temp items)
      if (!id.startsWith("temp_")) {
        debounceUpdateCartItemQuantity(id, quantity);
      }
    },
    clearCart: async () => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(
          `${API_ROUTES.CART}/clear-cart`,
          {},
          {
            withCredentials: true,
          }
        );

        set({ items: [], isLoading: false });
      } catch (e) {
        // If 401, just clear local cart
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          set({ items: [], isLoading: false });
        } else {
          set({ error: "Failed to cart clear ", isLoading: false });
        }
      }
    },
    syncGuestCartToServer: async () => {
      const { items } = get();
      const guestItems = items.filter((item) => item.id.startsWith("temp_"));
      
      if (guestItems.length === 0) return;

      // Add each guest item to server cart
      for (const item of guestItems) {
        try {
          await axios.post(
            `${API_ROUTES.CART}/add-to-cart`,
            {
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
            },
            {
              withCredentials: true,
            }
          );
        } catch (e) {
          console.error("Failed to sync cart item:", e);
        }
      }

      // Remove temp items after syncing
      set((state) => ({
        items: state.items.filter((item) => !item.id.startsWith("temp_")),
      }));
    },
    loadGuestCart: () => {
      // Guest cart is already loaded from localStorage via persist middleware
      set({ isLoading: false, error: null });
    },
  };
},
{
  name: "cart-storage",
  partialize: (state) => ({ items: state.items }),
}
));
