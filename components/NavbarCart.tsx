"use client";

import Link from "next/link";
import { useCartStore } from "../store/cartStore";

export default function NavbarCart() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    // 🟢 เปลี่ยนจาก div เป็น Link
    <Link href="/cart" className="relative cursor-pointer hover:text-black flex items-center transition-transform hover:scale-110">
      <span className="text-2xl">🛒</span>
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
          {totalItems}
        </span>
      )}
    </Link>
  );
}