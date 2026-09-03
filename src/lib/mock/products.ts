import type { Product, Category } from "./types";

export const categories: Category[] = [
  { id: "cat_laptops", name: "Laptops", slug: "laptops", products: 18, description: "Portable computers and ultrabooks" },
  { id: "cat_phones", name: "Smartphones", slug: "smartphones", products: 24, description: "Mobile phones and accessories" },
  { id: "cat_audio", name: "Audio", slug: "audio", products: 31, description: "Headphones, earbuds and speakers" },
  { id: "cat_wearables", name: "Wearables", slug: "wearables", products: 12, description: "Watches and fitness trackers" },
  { id: "cat_accessories", name: "Accessories", slug: "accessories", products: 47, description: "Cables, cases, chargers and stands" },
];

export const products: Product[] = [
  { id: "prd_01", name: 'MacBook Pro 14"', sku: "MBP-14-M3", category: "Laptops", price: 1999, stock: 42, status: "Published", updatedAt: "2025-08-28", image: "/images/product/product-01.jpg" },
  { id: "prd_02", name: "iPhone 15 Pro Max", sku: "IP15-PM-256", category: "Smartphones", price: 1199, stock: 7, status: "Published", updatedAt: "2025-08-30", image: "/images/product/product-02.jpg" },
  { id: "prd_03", name: "AirPods Pro (2nd gen)", sku: "APP-2", category: "Audio", price: 249, stock: 0, status: "Draft", updatedAt: "2025-08-19", image: "/images/product/product-03.jpg" },
  { id: "prd_04", name: "Apple Watch Ultra 2", sku: "AWU-2", category: "Wearables", price: 799, stock: 21, status: "Published", updatedAt: "2025-09-01", image: "/images/product/product-04.jpg" },
  { id: "prd_05", name: 'iPad Pro 12.9"', sku: "IPP-129", category: "Laptops", price: 1099, stock: 15, status: "Published", updatedAt: "2025-08-25", image: "/images/product/product-05.jpg" },
  { id: "prd_06", name: "Magic Keyboard", sku: "MK-US", category: "Accessories", price: 149, stock: 88, status: "Published", updatedAt: "2025-07-30", image: "/images/product/product-01.jpg" },
  { id: "prd_07", name: "USB-C Charge Cable", sku: "USBC-2M", category: "Accessories", price: 29, stock: 240, status: "Published", updatedAt: "2025-06-12", image: "/images/product/product-02.jpg" },
  { id: "prd_08", name: "HomePod mini", sku: "HP-MINI", category: "Audio", price: 99, stock: 4, status: "Archived", updatedAt: "2025-04-08", image: "/images/product/product-03.jpg" },
];

export const productName = (id: string) =>
  products.find((p) => p.id === id)?.name ?? "Unknown product";
