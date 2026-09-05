import { IProduct } from "@/interfaces";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = IProduct & {
  quantity: number;
};

type CartStore = {
  cart: CartItem[];
  hasHydrated: boolean;
  addCartItem: (product: IProduct, quantity?: number) => void;
  editCartItem: (productId: string, quantity: number) => void;
  deleteCartItem: (productId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],
      hasHydrated: false,
      addCartItem: (product, quantity = 1) =>
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (item) => item.id === product.id
          );

          if (existingIndex !== -1) {
            return {
              cart: state.cart.map((item, index) =>
                index === existingIndex
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            cart: [...state.cart, { ...product, quantity }],
          };
        }),
      editCartItem: (productId, quantity) =>
        set((state) => {
          if (quantity < 1) {
            return {
              cart: state.cart.filter((item) => item.id !== productId),
            };
          }

          return {
            cart: state.cart.map((item) =>
              item.id === productId ? { ...item, quantity } : item
            ),
          };
        }),
      deleteCartItem: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "eshop-cart",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);
