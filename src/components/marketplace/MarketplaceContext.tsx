"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Product, CartItem } from "@/types/marketplace";
import { getProducts } from "@/services/marketplaceService";
import { getFirestoreCart, saveFirestoreCart } from "@/services/cartService";
import { getFirestoreWishlist, saveFirestoreWishlist } from "@/services/wishlistService";

interface MarketplaceContextType {
  products: Product[];
  loadingProducts: boolean;
  cartItems: CartItem[];
  wishlistIds: string[];
  loadingCart: boolean;
  loadingWishlist: boolean;
  refreshProducts: () => Promise<Product[]>;
  addToCart: (product: Product) => Promise<void>;
  addMultipleToCart: (items: { product: Product; quantity: number }[]) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeCartItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Fetch active products on mount
  const refreshProducts = async () => {
    setLoadingProducts(true);
    try {
      const activeList = await getProducts({ status: "approved" });
      setProducts(activeList);
      return activeList;
    } catch (err) {
      console.error("Failed to load approved products:", err);
      return [];
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  // Helper to join simple DB items to full CartItem object
  const joinCartItems = async (dbItems: { productId: string; quantity: number }[], allProducts: Product[]) => {
    const joined: CartItem[] = [];
    for (const item of dbItems) {
      let prod = allProducts.find((p) => p.id === item.productId);
      if (!prod) {
        try {
          const docRef = doc(db, "products", item.productId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            prod = { id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) } as Product;
          }
        } catch (e) {
          console.error("Error loading product fallback:", e);
        }
      }
      if (prod) {
        joined.push({ product: prod, quantity: item.quantity });
      }
    }
    return joined;
  };

  // 2. Auth State Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setLoadingCart(true);
        setLoadingWishlist(true);

        try {
          // Load active products first to join correctly
          const latestProducts = await refreshProducts();
          
          // Fetch cart
          const dbCart = await getFirestoreCart(user.uid);
          const joinedCart = await joinCartItems(dbCart, latestProducts);
          setCartItems(joinedCart);
          
          // Fetch wishlist
          const dbWishlist = await getFirestoreWishlist(user.uid);
          setWishlistIds(dbWishlist);
        } catch (err) {
          console.error("Error loading cart/wishlist on login:", err);
        } finally {
          setLoadingCart(false);
          setLoadingWishlist(false);
        }
      } else {
        // Logged out
        setUserId(null);
        setCartItems([]);
        setWishlistIds([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Cart Actions
  const addToCart = async (product: Product) => {
    if (!userId) {
      alert("Please login to add items to your cart.");
      return;
    }

    const existing = cartItems.find((item) => item.product.id === product.id);
    let updatedCart: CartItem[];

    if (existing) {
      if (existing.quantity >= product.quantity) {
        alert("Cannot add more. Available stock limit reached!");
        return;
      }
      updatedCart = cartItems.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cartItems, { product, quantity: 1 }];
    }

    setCartItems(updatedCart);

    // Save to Firestore
    const dbItems = updatedCart.map((item) => ({
      productId: item.product.id!,
      quantity: item.quantity,
    }));
    await saveFirestoreCart(userId, dbItems);
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!userId) return;

    if (quantity <= 0) {
      await removeCartItem(productId);
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);

    const dbItems = updatedCart.map((item) => ({
      productId: item.product.id!,
      quantity: item.quantity,
    }));
    await saveFirestoreCart(userId, dbItems);
  };

  const removeCartItem = async (productId: string) => {
    if (!userId) return;

    const updatedCart = cartItems.filter((item) => item.product.id !== productId);
    setCartItems(updatedCart);

    const dbItems = updatedCart.map((item) => ({
      productId: item.product.id!,
      quantity: item.quantity,
    }));
    await saveFirestoreCart(userId, dbItems);
  };

  const clearCart = async () => {
    if (!userId) return;
    setCartItems([]);
    await saveFirestoreCart(userId, []);
  };

  // 4. Wishlist Actions
  const toggleWishlist = async (productId: string) => {
    if (!userId) {
      alert("Please login to add items to your wishlist.");
      return;
    }

    let updatedWishlist: string[];
    const exists = wishlistIds.includes(productId);

    if (exists) {
      updatedWishlist = wishlistIds.filter((id) => id !== productId);
    } else {
      updatedWishlist = [...wishlistIds, productId];
    }

    setWishlistIds(updatedWishlist);
    await saveFirestoreWishlist(userId, updatedWishlist);
  };

  const isInWishlist = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  const addMultipleToCart = async (itemsToAdd: { product: Product; quantity: number }[]) => {
    if (!userId) {
      alert("Please login to add items to your cart.");
      return;
    }

    let updatedCart = [...cartItems];

    for (const item of itemsToAdd) {
      const existingIndex = updatedCart.findIndex((i) => i.product.id === item.product.id);
      if (existingIndex > -1) {
        const existing = updatedCart[existingIndex];
        const newQty = existing.quantity + item.quantity;
        if (newQty > item.product.quantity) {
          updatedCart[existingIndex] = { ...existing, quantity: item.product.quantity };
        } else {
          updatedCart[existingIndex] = { ...existing, quantity: newQty };
        }
      } else {
        const qty = Math.min(item.quantity, item.product.quantity);
        updatedCart.push({ product: item.product, quantity: qty });
      }
    }

    setCartItems(updatedCart);

    const dbItems = updatedCart.map((item) => ({
      productId: item.product.id!,
      quantity: item.quantity,
    }));
    await saveFirestoreCart(userId, dbItems);
  };

  return (
    <MarketplaceContext.Provider
      value={{
        products,
        loadingProducts,
        cartItems,
        wishlistIds,
        loadingCart,
        loadingWishlist,
        refreshProducts,
        addToCart,
        addMultipleToCart,
        updateCartQuantity,
        removeCartItem,
        clearCart,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error("useMarketplace must be used within a MarketplaceProvider");
  }
  return context;
}
