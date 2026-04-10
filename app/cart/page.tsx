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

  // 📍 🟢 Shipping Address States
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    province: "",
    district: "",
    zipCode: ""
  });

  // 💸 🟢 Payment States
  const [paymentProof, setPaymentProof] = useState(""); // เก็บรูปสลิป (Base64)

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // ฟังก์ชันจัดการการเปลี่ยนรูปสลิป
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalPrice = totalPrice - discount;

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
        let discountAmount = data.discountType === "percentage" ? (totalPrice * data.discountValue) / 100 : data.discountValue;
        setDiscount(discountAmount);
        setCouponError("");
        Swal.fire({ icon: 'success', title: 'ใช้โค้ดสำเร็จ', text: `ลดไป ฿${discountAmount.toLocaleString()}`, timer: 1500, showConfirmButton: false });
      } else {
        setCouponError(data.message);
        setDiscount(0);
      }
    } catch (error) { setCouponError("เชื่อมต่อไม่สำเร็จ"); }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!user) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเข้าสู่ระบบ', confirmButtonColor: '#007AFF' }).then(() => router.push("/login"));
      return;
    }

    // 🚩 ตรวจสอบว่ากรอกที่อยู่และแนบสลิปหรือยัง
    if (!address.fullName || !address.phone || !address.addressLine || !paymentProof) {
      Swal.fire({ icon: 'error', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกที่อยู่จัดส่งและแนบสลิปโอนเงินให้เรียบร้อย', confirmButtonColor: '#007AFF' });
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการสั่งซื้อ?',
      text: `ยอดชำระสุทธิคือ ฿${finalPrice.toLocaleString()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007AFF',
      confirmButtonText: 'ยืนยันและส่งสลิป',
    });
    
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'กำลังบันทึกออเดอร์...', didOpen: () => { Swal.showLoading(); } });

        const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username: user.username,
            totalAmount: finalPrice,
            couponCode: discount > 0 ? couponCode : null, 
            shippingAddress: address, // 🟢 ส่งที่อยู่
            paymentProof: paymentProof, // 🟢 ส่งสลิป
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })) 
          }),
        });

        if (res.ok) {
          await Swal.fire({ icon: 'success', title: 'สั่งซื้อสำเร็จ!', text: 'เราจะรีบตรวจสอบสลิปและดำเนินการส่งของครับ', confirmButtonColor: '#007AFF' });
          clearCart(); 
          router.push("/orders");
        } else {
          const data = await res.json();
          Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: data.message });
        }
      } catch (error) { Swal.fire('Error', 'Server Connection Error', 'error'); }
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E] pb-20">
      <nav className="bg-white border-b border-gray-300 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <Link href="/"><h1 className="text-2xl font-black tracking-tight text-black">PHONE<span className="text-[#007AFF]">STORE</span></h1></Link>
          <NavbarCart />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-black mb-10 text-center uppercase tracking-tighter italic">Checkout / ตะกร้า</h1>

        {items.length === 0 ? (
          <div className="text-center bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-200 shadow-sm">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-2xl font-black text-gray-400 mb-6 uppercase">ตะกร้ายังว่างอยู่</h2>
            <Link href="/"><button className="bg-black text-white px-10 py-4 rounded-2xl font-black text-lg uppercase shadow-xl hover:bg-[#007AFF] transition-all">Go Shopping</button></Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 🛍️ สินค้าในตะกร้า */}
            <div className="grid grid-cols-1 gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-gray-200 flex flex-col md:flex-row items-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl p-2 flex-shrink-0 border border-gray-100"><img src={item.image} alt={item.name} className="w-full h-full object-contain" /></div>
                  <div className="mt-4 md:mt-0 md:ml-6 flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black text-black leading-tight uppercase">{item.name}</h3>
                    <p className="text-sm font-bold text-gray-400">฿{item.price.toLocaleString()} x {item.quantity}</p>
                    <div className="flex items-center justify-center md:justify-start space-x-6 mt-3">
                      <div className="flex items-center border-2 border-gray-100 rounded-xl px-2 py-0.5 bg-gray-50">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 font-black">-</button>
                        <span className="w-8 text-center font-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 font-black">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 text-right"><p className="text-xl font-black text-[#007AFF]">฿{(item.price * item.quantity).toLocaleString()}</p></div>
                </div>
              ))}
            </div>

            {/* 📍 🟢 Section: กรอกที่อยู่ และ อัปโหลดสลิป */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ฝั่งซ้าย: ที่อยู่จัดส่ง */}
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
                <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><span className="text-2xl">📍</span> Shipping Address</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="ชื่อ-นามสกุล ผู้รับ" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 font-bold text-sm" onChange={(e) => setAddress({...address, fullName: e.target.value})} required />
                  <input type="text" placeholder="เบอร์โทรศัพท์" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 font-bold text-sm" onChange={(e) => setAddress({...address, phone: e.target.value})} required />
                  <textarea placeholder="ที่อยู่ (บ้านเลขที่, ถนน, ซอย, ตำบล)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 font-bold text-sm h-28" onChange={(e) => setAddress({...address, addressLine: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="อำเภอ/เขต" className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" onChange={(e) => setAddress({...address, district: e.target.value})} required />
                    <input type="text" placeholder="จังหวัด" className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" onChange={(e) => setAddress({...address, province: e.target.value})} required />
                  </div>
                  <input type="text" placeholder="รหัสไปรษณีย์" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" onChange={(e) => setAddress({...address, zipCode: e.target.value})} required />
                </div>
              </div>

              {/* ฝั่งขวา: ชำระเงิน และ สรุปยอด */}
              <div className="space-y-6">
                <div className="bg-[#1C1C1E] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                  <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><span className="text-2xl">💸</span> Payment</h3>
                  <div className="bg-white/10 p-5 rounded-2xl border border-white/10 mb-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">ธนาคารกสิกรไทย (K-Bank)</p>
                    <p className="text-xl font-black tracking-[0.2em]">012-3-45678-9</p>
                    <p className="text-[10px] font-bold text-blue-400 mt-1 uppercase italic">Name: PHONE STORE CO., LTD.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase ml-1">แนบรูปภาพหลักฐานการโอนเงิน</p>
                    <label className="flex flex-col items-center justify-center w-full h-40 bg-white/5 border-2 border-dashed border-white/20 rounded-[2rem] cursor-pointer hover:bg-white/10 transition-all overflow-hidden">
                      {paymentProof ? (
                        <img src={paymentProof} className="h-full w-full object-contain p-2" />
                      ) : (
                        <div className="text-center">
                          <span className="text-3xl mb-2 block">📸</span>
                          <p className="text-[10px] font-black uppercase text-gray-500">Click to Upload Slip</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>

                {/* ส่วนสรุปยอดและคูปอง */}
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-200 shadow-sm">
                   <div className="flex gap-2 mb-6">
                     <input type="text" placeholder="โค้ดส่วนลด" value={couponCode} className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-black uppercase outline-none focus:border-[#007AFF]" onChange={(e) => setCouponCode(e.target.value)} />
                     <button onClick={handleApplyCoupon} className="bg-black text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Apply</button>
                   </div>
                   <div className="space-y-3 border-b-2 border-gray-50 pb-6 mb-6">
                     <div className="flex justify-between text-sm font-bold text-gray-500"><span>SUBTOTAL</span><span>฿{totalPrice.toLocaleString()}</span></div>
                     {discount > 0 && <div className="flex justify-between text-sm font-bold text-red-500"><span>DISCOUNT</span><span>- ฿{discount.toLocaleString()}</span></div>}
                     <div className="flex justify-between text-sm font-bold text-green-500"><span>SHIPPING</span><span>FREE</span></div>
                   </div>
                   <div className="flex justify-between items-center mb-8">
                     <span className="font-black text-gray-400 text-xs uppercase">Total Balance</span>
                     <span className="text-4xl font-black text-black">฿{finalPrice.toLocaleString()}</span>
                   </div>
                   <button onClick={handleCheckout} className="w-full bg-[#007AFF] text-white py-5 rounded-2xl font-black text-xl uppercase shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all">ยืนยันการสั่งซื้อ</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}