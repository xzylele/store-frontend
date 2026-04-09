"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../store/cartStore";
import NavbarCart from "../../components/NavbarCart";
import Swal from "sweetalert2";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // 🎫 Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // คำนวณราคารวมทั้งหมด (ก่อนหักส่วนลด)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // คำนวณราคาสุทธิ (หลังหักส่วนลด)
  const finalPrice = totalPrice - discount;

  // 🟢 ฟังก์ชันตรวจสอบคูปอง
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();

      if (res.ok) {
        let discountAmount = 0;
        if (data.discountType === "percentage") {
          discountAmount = (totalPrice * data.discountValue) / 100;
        } else {
          discountAmount = data.discountValue;
        }
        setDiscount(discountAmount);
        setCouponError("");
        Swal.fire({ 
            icon: 'success', 
            title: data.message, 
            text: `ลดราคาไปแล้ว ฿${discountAmount.toLocaleString()}`,
            timer: 2000, 
            showConfirmButton: false 
        });
      } else {
        setCouponError(data.message);
        setDiscount(0);
      }
    } catch (error) {
      setCouponError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // 🟢 ฟังก์ชันสำหรับชำระเงิน (อัปเดตเพื่อส่ง couponCode ไปตัดโควตา)
  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!user) {
      Swal.fire({
        title: '🔒 กรุณาเข้าสู่ระบบ',
        text: "คุณต้อง Login ก่อนเพื่อดำเนินการชำระเงิน",
        icon: 'warning',
        confirmButtonColor: '#007AFF',
        confirmButtonText: 'ไปหน้า Login'
      }).then(() => router.push("/login"));
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการสั่งซื้อ?',
      text: `ยอดชำระสุทธิที่ต้องจ่ายคือ ฿${finalPrice.toLocaleString()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007AFF',
      cancelButtonColor: '#1C1C1E',
      confirmButtonText: 'ยืนยันชำระเงิน',
      cancelButtonText: 'ยกเลิก',
    });
    
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'กำลังประมวลผล...', didOpen: () => { Swal.showLoading(); } });

        const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username: user.username,
            totalAmount: finalPrice,
            // 🟢 ส่ง couponCode ไปด้วย (ส่งเฉพาะถ้ามีการใช้ส่วนลดจริง) เพื่อให้ Backend ไป +1 usageCount
            couponCode: discount > 0 ? couponCode : null, 
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })) 
          }),
        });

        const data = await res.json();

        if (res.ok) {
          await Swal.fire({ icon: 'success', title: 'ชำระเงินสำเร็จ!', text: data.message, confirmButtonColor: '#007AFF' });
          clearCart(); 
          router.push("/orders");
        } else {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: data.message, confirmButtonColor: '#007AFF' });
        }
      } catch (error) {
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E]">
      <nav className="bg-white border-b border-gray-300 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <Link href="/">
            <h1 className="text-2xl font-black tracking-tight text-black">
              PHONE<span className="text-[#007AFF]">STORE</span>
            </h1>
          </Link>
          <NavbarCart />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-black mb-10 text-center uppercase tracking-tighter">ตะกร้าสินค้า</h1>

        {items.length === 0 ? (
          <div className="text-center bg-white p-20 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-2xl font-black text-gray-400 mb-6 uppercase">ยังไม่มีสินค้าในตะกร้า</h2>
            <Link href="/">
              <button className="bg-[#007AFF] text-white px-10 py-4 rounded-xl font-black text-lg uppercase shadow-lg hover:bg-[#0051A8] transition-all">
                กลับไปเลือกซื้อสินค้า
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-300 flex items-center shadow-sm">
                  <div className="w-24 h-24 bg-white rounded-xl border border-gray-100 p-2 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="ml-6 flex-1">
                    <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-widest mb-1">Device</p>
                    <h3 className="text-xl font-bold text-black leading-tight">{item.name}</h3>
                    <p className="text-lg font-black text-black">฿{item.price.toLocaleString()}</p>
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center border-2 border-gray-200 rounded-xl px-2 py-1 bg-gray-50">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-black hover:text-[#007AFF] w-8 h-8 flex items-center justify-center font-black text-xl">-</button>
                        <span className="w-10 text-center font-black text-lg">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-black hover:text-[#007AFF] w-8 h-8 flex items-center justify-center font-black text-xl">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-xs font-black text-red-600 uppercase hover:underline">ลบออก</button>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">ราคารวม</p>
                    <p className="font-black text-xl text-black">฿{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ส่วนสรุปออเดอร์ */}
            <div className="w-full lg:w-96 bg-white p-8 rounded-2xl border-2 border-gray-300 h-fit sticky top-28 shadow-sm">
              <h2 className="text-xl font-black text-black mb-6 uppercase border-b-2 border-gray-100 pb-4">สรุปออเดอร์</h2>
              
              {/* 🎫 ช่องกรอกคูปอง */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">โค้ดส่วนลด</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="ใส่โค้ดที่นี่..." 
                    className="flex-1 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-bold uppercase outline-none focus:border-[#007AFF]"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="bg-[#1C1C1E] text-white px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-black transition-all"
                  >
                    ใช้
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase">{couponError}</p>}
                {discount > 0 && <p className="text-[10px] text-green-600 font-black mt-2 uppercase tracking-tight">ประหยัดไปแล้ว ฿{discount.toLocaleString()}</p>}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-bold text-gray-600 text-sm uppercase">
                    <span>มูลค่าสินค้า</span>
                    <span className="text-black">฿{totalPrice.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-bold text-red-500 text-sm uppercase">
                    <span>ส่วนลดคูปอง</span>
                    <span>- ฿{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-600 text-sm uppercase">
                    <span>ค่าจัดส่ง</span>
                    <span className="text-green-600 font-black">ฟรี</span>
                </div>
              </div>
              
              <div className="border-t-2 border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-500 uppercase text-xs">ยอดรวมสุทธิ</span>
                  <span className="text-3xl font-black text-[#007AFF]">฿{finalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-[#007AFF] text-white py-5 rounded-xl font-black text-xl uppercase shadow-xl shadow-blue-100 hover:bg-[#0051A8] transition-all active:scale-95"
              >
                ชำระเงิน
              </button>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                <span className="text-lg text-black">🛡️</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-center">SECURE SSL 256-BIT</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}