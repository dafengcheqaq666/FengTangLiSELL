import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "山野蜜境 · 蜂糖李鲜果", template: "%s · 山野蜜境" },
  description: "贵州蜂糖李，树上自然熟，现摘现发。清甜多汁，脆嫩离核。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><CartProvider>{children}</CartProvider></body></html>;
}
