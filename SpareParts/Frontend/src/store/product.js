import { create } from "zustand";

const API_URL = "http://localhost:5001/api";
export const useProductStore = create((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
  fetchProducts: async () => {
    const res = await fetch(API_URL + "/product");
    const data = await res.json();
    set({ products: data.data });
  },
  deleteProduct: async (pid) => {
    const res = await fetch(`/api/products/${pid}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };

    // update the ui immediately, without needing a refresh
    set((state) => ({
      products: state.products.filter((product) => product._id !== pid),
    }));
    return { success: true, message: data.message };
  },
  updateProduct: async (pid, updatedProduct) => {
    const res = await fetch(`/api/products/${pid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedProduct),
    });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };

    // update the ui immediately, without needing a refresh
    set((state) => ({
      products: state.products.map((product) =>
        product._id === pid ? data.data : product
      ),
    }));

    return { success: true, message: data.message };
  },
  buyProduct: async (part_id) => {
    try {
      // Send the request to purchase the product
      console.log(part_id);
      const res = await fetch(`${API_URL}/product/${part_id}`, {
        method: "GET", // Adjust according to your API
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (data.success) {
        set((state) => ({
          products: state.products.map((product) =>
            product.part_id === part_id
              ? { ...product, stock: product.stock - 1 }
              : product
          ),
        }));
        return { success: true, message: "Product purchased successfully" };
      } else {
        return {
          success: false,
          message: data.message || "Failed to purchase product",
        };
      }
    } catch (error) {
      console.error("Error purchasing product:", error);
      return { success: false, message: "Error purchasing product" };
    }
  },
}));
