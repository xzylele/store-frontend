"use client";

import { useCartStore } from "../store/cartStore";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2"; // 🟢 นำเข้า SweetAlert2

export default function AddToCartBtn({ phone }: { phone: any }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();

  const isOutOfStock = phone.stock <= 0;

  const handleAdd = () => {
    const savedUser = localStorage.getItem("user");

    // 1. ตรวจสอบการ Login ด้วย Popup สวยๆ
    if (!savedUser) {
      Swal.fire({
        title: '🔒 เข้าสู่ระบบก่อน',
        text: "คุณต้อง Login เพื่อเริ่มเลือกสินค้าลงตะกร้า",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#007AFF', // สีน้ำเงินหลัก
        cancelButtonColor: '#1C1C1E', // สีดำ
        confirmButtonText: 'ไปหน้า LOGIN',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/login");
        }
      });
      return;
    }

    if (isOutOfStock) return;

    // 2. เพิ่มของลงตะกร้า
    addToCart({
      id: phone._id,
      name: phone.name,
      price: phone.price,
      image: phone.image,
      quantity: 1
    });
    
    // 3. Popup แจ้งเตือนว่าเพิ่มสำเร็จ (หายไปเองใน 1.5 วินาที)
    Swal.fire({
      icon: 'success',
      title: 'เพิ่มลงตะกร้าแล้ว',
      text: `เตรียมพบกับ ${phone.name} ของคุณได้เลย`,
      showConfirmButton: false,
      timer: 1500,
      confirmButtonColor: '#007AFF',
    });
  };

  return (
    <button 
      onClick={handleAdd}
      disabled={isOutOfStock}
      className={`flex-1 py-4 rounded-xl font-black text-lg uppercase transition-all shadow-lg 
        ${isOutOfStock 
          ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-2 border-gray-300" 
          : "bg-[#007AFF] text-white hover:bg-[#0051A8] shadow-blue-100 active:scale-95"
        }`}
    >
      {isOutOfStock ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
    </button>
  );
}