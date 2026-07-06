"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  variantId: string;
  productName: string;
  variantName: string;
  priceFen: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  totalFen: number;
  add: (line: CartLine) => void;
  update: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("shanye-cart");
      if (saved) setLines(JSON.parse(saved) as CartLine[]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("shanye-cart", JSON.stringify(lines));
  }, [lines, ready]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalFen: lines.reduce((sum, line) => sum + line.priceFen * line.quantity, 0),
    add(line) {
      setLines((current) => {
        const existing = current.find((item) => item.variantId === line.variantId);
        if (!existing) return [...current, line];
        return current.map((item) => item.variantId === line.variantId ? { ...item, quantity: Math.min(9, item.quantity + line.quantity) } : item);
      });
    },
    update(variantId, quantity) {
      setLines((current) => quantity <= 0 ? current.filter((line) => line.variantId !== variantId) : current.map((line) => line.variantId === variantId ? { ...line, quantity: Math.min(9, quantity) } : line));
    },
    clear: () => setLines([]),
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
