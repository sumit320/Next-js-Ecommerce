import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { create } from "zustand";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  items: OrderItem[];
  couponId?: string;
  total: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
  paymentMethod: "CREDIT_CARD";
  paymentStatus: "PENDING" | "COMPLETED";
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  addressId: string;
  items: OrderItem[];
  couponId?: string;
  total: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
  paymentMethod: "CREDIT_CARD";
  paymentStatus: "PENDING" | "COMPLETED";
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateOrderData {
  userId: string;
  addressId: string;
  items: Omit<OrderItem, "id">[];
  couponId?: string;
  total: number;
  paymentMethod: "CREDIT_CARD";
  paymentStatus: "PENDING" | "COMPLETED";
  paymentId?: string;
}

interface OrderStore {
  currentOrder: Order | null;
  isLoading: boolean;
  isPaymentProcessing: boolean;
  userOrders: Order[];
  adminOrders: AdminOrder[];
  error: string | null;
  createPayPalOrder: (items: any[], total: number) => Promise<string | null>;
  capturePayPalOrder: (orderId: string) => Promise<any | null>;
  createFinalOrder: (orderData: CreateOrderData) => Promise<Order | null>;
  getOrder: (orderId: string) => Promise<Order | null>;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => Promise<boolean>;
  getAllOrders: () => Promise<Order[] | null>;
  getOrdersByUserId: () => Promise<Order[] | null>;
  setCurrentOrder: (order: Order | null) => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrder: null,
  isLoading: true,
  error: null,
  isPaymentProcessing: false,
  userOrders: [],
  adminOrders: [],
  createPayPalOrder: async (items, total) => {
    set({ isLoading: true, error: null });
    try {
      console.log("[Client] Creating PayPal order:", { itemsCount: items.length, total });
      console.log("[Client] API URL:", `${API_ROUTES.PAYPAL}/create-order`);
      
      const response = await axios.post(
        `${API_ROUTES.PAYPAL}/create-order`,
        { items, total },
        { 
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("[Client] PayPal order response:", response.data);
      console.log("[Client] Response status:", response.status);
      set({ isLoading: false });
      
      // PayPal SDK expects just the order ID string
      if (!response.data || !response.data.id) {
        console.error("[Client] PayPal order response missing ID:", response.data);
        const errorMsg = response.data?.message || "Invalid response from server: missing order ID";
        set({ error: errorMsg, isLoading: false });
        throw new Error(errorMsg);
      }
      
      return response.data.id;
    } catch (error: any) {
      console.error("[Client] PayPal order creation error:", error);
      console.error("[Client] Error type:", error.constructor.name);
      console.error("[Client] Error message:", error.message);
      console.error("[Client] Server response:", error.response?.data);
      console.error("[Client] Status code:", error.response?.status);
      console.error("[Client] Request URL:", error.config?.url);
      
      let errorMessage = "Failed to create PayPal order";
      
      if (error.response) {
        // Server responded with error
        const serverError = error.response.data;
        
        // Check for PayPal authentication errors
        if (serverError?.error?.code === "invalid_client" || serverError?.error?.description?.includes("Client Authentication failed")) {
          errorMessage = "PayPal authentication failed. The Client ID and Secret are invalid or don't match. Please check your PayPal credentials in the server/.env file.";
          console.error("[Client] PayPal Authentication Error:", serverError.error);
        } else {
          errorMessage = serverError?.message || serverError?.error?.message || error.message || errorMessage;
        }
        
        console.error("[Client] Full error response:", JSON.stringify(serverError, null, 2));
      } else if (error.request) {
        // Request made but no response
        errorMessage = "Server is not responding. Please check if the server is running on port 3001.";
        console.error("[Client] No response from server. Request:", error.request);
      } else {
        // Error setting up request
        errorMessage = error.message || errorMessage;
      }
      
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  capturePayPalOrder: async (orderId) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      console.log("[Client] Capturing PayPal order:", orderId);
      
      const response = await axios.post(
        `${API_ROUTES.PAYPAL}/capture-order`,
        { orderId },
        { 
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("[Client] PayPal capture response:", response.data);
      set({ isLoading: false, isPaymentProcessing: false });
      return response.data;
    } catch (error: any) {
      console.error("[Client] PayPal capture error:", error);
      console.error("[Client] Server response:", error.response?.data);
      set({
        error: error.response?.data?.message || "Failed to capture paypal order",
        isLoading: false,
        isPaymentProcessing: false,
      });
      return null;
    }
  },
  createFinalOrder: async (orderData) => {
    set({ isLoading: true, error: null, isPaymentProcessing: true });
    try {
      const response = await axios.post(
        `${API_ROUTES.ORDER}/create-final-order`,
        orderData,
        { withCredentials: true }
      );
      set({
        isLoading: false,
        currentOrder: response.data,
        isPaymentProcessing: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: "Failed to capture paypal order",
        isLoading: false,
        isPaymentProcessing: false,
      });
      return null;
    }
  },
  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true, error: null });
    try {
      await axios.put(
        `${API_ROUTES.ORDER}/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      set((state) => ({
        currentOrder:
          state.currentOrder && state.currentOrder.id === orderId
            ? {
                ...state.currentOrder,
                status,
              }
            : state.currentOrder,
        isLoading: false,
        adminOrders: state.adminOrders.map((item) =>
          item.id === orderId
            ? {
                ...item,
                status,
              }
            : item
        ),
      }));
      return true;
    } catch (error) {
      set({ error: "Failed to capture paypal order", isLoading: false });
      return false;
    }
  },
  getAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.ORDER}/get-all-orders-for-admin`,
        { withCredentials: true }
      );
      set({ isLoading: false, adminOrders: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },
  getOrdersByUserId: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.ORDER}/get-order-by-user-id`,
        { withCredentials: true }
      );
      set({ isLoading: false, userOrders: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },
  setCurrentOrder: (order) => set({ currentOrder: order }),
  getOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.ORDER}/get-single-order/${orderId}`,
        { withCredentials: true }
      );
      set({ isLoading: false, currentOrder: response.data });
      return response.data;
    } catch (error) {
      set({ error: "Failed to fetch all orders for admin", isLoading: false });
      return null;
    }
  },
}));
