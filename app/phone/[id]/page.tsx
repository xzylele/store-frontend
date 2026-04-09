"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "../../../store/cartStore"; // 🟢 นำเข้า Store เพื่อใช้สั่งการเพิ่มสินค้า
import AddToCartBtn from "../../../components/AddToCartBtn";
import NavbarCart from "../../../components/NavbarCart";
import Swal from "sweetalert2";

// ฟังก์ชันดึงข้อมูลจาก Backend
async function getPhone(id: string) {
  try {
    const res = await fetch(`https://phone-store-api-hrdj.onrender.com/api/phones/${id}`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

export default function PhoneDetail() {
  const params = useParams();
  const router = useRouter();
  const phoneId = params.id as string;
  const [phone, setPhone] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ดึงฟังก์ชัน addToCart มาใช้สำหรับปุ่ม "ซื้อเลย"
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    const loadData = async () => {
      const data = await getPhone(phoneId);
      setPhone(data);
      setLoading(false);
    };
    loadData();
  }, [phoneId]);

  // 🟢 ฟังก์ชันสำหรับปุ่ม "ซื้อเลย" (Buy Now Logic)
  const handleBuyNow = () => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      Swal.fire({
        title: '🔒 เข้าสู่ระบบก่อน',
        text: "คุณต้อง Login เพื่อทำการสั่งซื้อสินค้า",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#007AFF',
        cancelButtonColor: '#1C1C1E',
        confirmButtonText: 'ไปหน้า LOGIN',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) router.push("/login");
      });
      return;
    }

    // เพิ่มสินค้าลงตะกร้าทันที
    addToCart({
      id: phone._id,
      name: phone.name,
      price: phone.price,
      image: phone.image,
      quantity: 1
    });

    // ดีดไปหน้าตะกร้าสินค้าทันทีเพื่อชำระเงิน
    router.push("/cart");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
      <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Loading Device...</p>
    </div>
  );

  if (!phone) return null; // 404 UI ส่วนเดิมของคุณ

  const isOutOfStock = phone.stock <= 0;

  return (
    <main className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E]">
      <nav className="bg-white border-b border-gray-300 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <Link href="/">
            <h1 className="text-2xl font-black tracking-tight text-black uppercase">
              PHONE<span className="text-[#007AFF]">STORE</span>
            </h1>
          </Link>
          <NavbarCart />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* รูปภาพสินค้า */}
          <div className="w-full lg:w-1/2 flex justify-center bg-white rounded-[2.5rem] p-12 border-2 border-gray-200 shadow-sm transition-all">
            <img 
                src={phone.image} 
                alt={phone.name} 
                className={`w-full max-w-md object-contain transition-all duration-700 ${isOutOfStock ? 'grayscale opacity-30' : 'hover:scale-105'}`} 
            />
          </div>

          {/* ข้อมูลสินค้า */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <p className="text-sm font-black text-[#007AFF] tracking-[0.4em] mb-4 uppercase">{phone.brand}</p>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-6 tracking-tighter leading-none uppercase">{phone.name}</h1>
            
            <div className="flex items-center gap-3 mb-8 bg-white w-fit px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <span className={`w-3 h-3 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`}></span>
                <p className={`text-xs font-black uppercase tracking-widest ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                    {isOutOfStock ? "สินค้าหมดชั่วคราว" : `สต็อก: ${phone.stock} เครื่อง`}
                </p>
            </div>

            <p className="text-lg text-gray-600 mb-10 leading-relaxed font-bold border-l-4 border-[#007AFF] pl-6 py-2 bg-white/50 rounded-r-xl">
              {phone.description}
            </p>

            {/* ราคา */}
            <div className="mb-10 p-8 bg-white rounded-[2rem] border-2 border-gray-300 relative overflow-hidden shadow-sm">
                {isOutOfStock && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest">Sold Out</div>
                )}
                <p className="text-[11px] font-black text-gray-400 uppercase mb-2 tracking-[0.2em]">ราคาพิเศษ</p>
                <p className={`text-5xl font-black ${isOutOfStock ? 'text-gray-300 line-through' : 'text-black'}`}>
                    ฿{phone.price.toLocaleString()}
                </p>
            </div>

            {/* 🟢 ปุ่ม Action คู่กัน */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* ปุ่มใส่ตะกร้า (สีน้ำเงิน) */}
              <AddToCartBtn phone={phone} />
              
              {/* ปุ่มซื้อเลย (สีดำ High Contrast) */}
              <button 
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`flex-1 py-4 rounded-xl font-black text-lg uppercase transition-all shadow-lg active:scale-95
                  ${isOutOfStock 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200" 
                    : "bg-[#1C1C1E] text-white hover:bg-black shadow-gray-200"
                  }`}
              >
                {isOutOfStock ? "หมด" : "ซื้อเลย"}
              </button>
            </div>

            <button className="w-full bg-transparent text-gray-400 border-2 border-gray-200 py-3 rounded-xl font-bold text-xs uppercase hover:bg-white hover:text-black transition-all">
              เปรียบเทียบสเปคผลิตภัณฑ์
            </button>

            <div className="mt-10 pt-8 border-t border-gray-200 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#007AFF] font-bold italic">i</div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                    รับประกันศูนย์ไทย 1 ปีเต็ม <br/> ราคานี้รวมภาษีมูลค่าเพิ่มแล้ว
                </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}