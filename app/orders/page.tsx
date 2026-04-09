"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavbarCart from "../../components/NavbarCart";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      setUser(userObj);
      
      // ดึงข้อมูลออเดอร์ทั้งหมดมา แล้วกรองเอาเฉพาะของ user คนนี้
      fetch("https://phone-store-api-hrdj.onrender.com/api/sales-summary")
        .then(res => res.json())
        .then(data => {
          // กรองข้อมูล: แสดงเฉพาะออเดอร์ที่ username ตรงกับคนที่ Login อยู่
          const myOrders = data.orders.filter((o: any) => o.username === userObj.username);
          setOrders(myOrders);
          setLoading(false);
        })
        .catch(err => {
          console.error("Fetch error:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
      <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">กำลังดึงข้อมูลประวัติ...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E] pb-20">
      {/* Navbar */}
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

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-black mb-4 uppercase tracking-tighter">My Orders</h1>
        <p className="text-gray-500 font-bold mb-10 uppercase text-xs tracking-widest">ติดตามสถานะการสั่งซื้อของคุณ</p>

        {!user ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-300">
            <p className="font-black text-red-500 uppercase mb-4">กรุณาเข้าสู่ระบบเพื่อดูประวัติ</p>
            <Link href="/login" className="text-[#007AFF] font-black underline">ไปหน้า Login</Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <p className="text-gray-400 font-black uppercase tracking-widest mb-6">คุณยังไม่มีรายการสั่งซื้อ</p>
            <Link href="/" className="bg-[#007AFF] text-white px-8 py-3 rounded-xl font-black uppercase shadow-lg hover:bg-blue-700">
              เริ่มช้อปปิ้งเลย
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order: any) => (
              <div key={order._id} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm transition-all hover:border-[#007AFF]/30">
                {/* Order Header */}
                <div className="bg-gray-50 p-6 border-b-2 border-gray-200 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">วันที่สั่งซื้อ</p>
                    <p className="font-bold text-sm text-black">{new Date(order.createdAt).toLocaleString('th-TH')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-right">สถานะจัดส่ง</p>
                    <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 block text-center
                      ${order.status === 'Pending' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}
                      ${order.status === 'Shipping' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                      ${order.status === 'Delivered' ? 'bg-green-50 border-green-200 text-green-600' : ''}
                      ${order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-600' : ''}
                    `}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* รายการสินค้า */}
                <div className="p-6 space-y-6">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-[#F2F2F7] rounded-xl p-2 border border-gray-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-black leading-tight text-lg">{item.name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">จำนวน: {item.quantity} เครื่อง</p>
                      </div>
                      <div className="text-right">
                         <p className="font-black text-black">฿{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ยอดรวม */}
                <div className="bg-gray-50 p-6 border-t-2 border-gray-100 flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ยอดชำระสุทธิ</p>
                  <p className="text-3xl font-black text-[#007AFF]">฿{order.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}