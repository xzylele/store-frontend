import { create } from 'zustand'

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, amount: number) => void;
  clearCart: () => void; // 🟢 เพิ่มฟังก์ชันล้างตะกร้า
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  
  // เพิ่มสินค้าเข้าตะกร้า
  addToCart: (newItem) => set((state) => {
    const existingItem = state.items.find(item => item.id === newItem.id);
    if (existingItem) {
      return {
        items: state.items.map(item =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    return { items: [...state.items, { ...newItem, quantity: 1 }] };
  }),

  // ลบสินค้าออกจากตะกร้า
  removeFromCart: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  // อัปเดตจำนวนสินค้า (+ หรือ -)
  updateQuantity: (id, amount) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + amount;
        // ป้องกันไม่ให้จำนวนต่ำกว่า 1
        return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return item;
    })
  })),

  // 🟢 ล้างตะกร้าสินค้าทั้งหมด (ใช้หลังจากชำระเงินสำเร็จ)
  clearCart: () => set({ items: [] }),
}));