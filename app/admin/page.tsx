"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

interface Phone {
  _id: string;
  name: string;
  price: number;
  brand: string;
  image: string;
  description: string;
  stock: number;
}

interface Coupon {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  expiryDate?: string;
  isActive: boolean;
  usageLimit: number | null; // 🟢 เพิ่มโควตา
  usageCount: number;        // 🟢 เพิ่มจำนวนที่ใช้ไปแล้ว
}

export default function AdminPage() {
  const router = useRouter();
  
  const [phones, setPhones] = useState<Phone[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any>({ totalSales: 0, totalOrders: 0, orders: [] });
  const [coupons, setCoupons] = useState<Coupon[]>([]); 
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", price: 0, brand: "", image: "", description: "", stock: 0 });
  
  // 🟢 เพิ่ม usageLimit ในฟอร์ม (0 = ไม่จำกัด)
  const [couponForm, setCouponForm] = useState({ 
    code: "", 
    discountType: "percentage", 
    discountValue: 0,
    usageLimit: 0 
  }); 

  const [editId, setEditId] = useState<string | null>(null);

  const fetchPhones = async () => {
    const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/phones");
    const data = await res.json();
    setPhones(data);
  };

  const fetchUsers = async () => {
    const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchSales = async () => {
    try {
        const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/sales-summary");
        const data = await res.json();
        setSalesData(data);
    } catch (error) {
        console.error("Sales fetch error:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/coupons"); 
      const data = await res.json();
      if (Array.isArray(data)) setCoupons(data);
    } catch (error) { console.log(error); }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`https://phone-store-api-hrdj.onrender.com/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'อัปเดตสถานะแล้ว', timer: 1000, showConfirmButton: false });
        fetchSales();
      }
    } catch (error) { Swal.fire('Error', 'ไม่สามารถอัปเดตได้', 'error'); }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 🟢 ถ้ากรอก 0 ให้ส่งเป็น null เพื่อให้ Backend รู้ว่าไม่จำกัดจำนวน
      const dataToSend = {
        ...couponForm,
        usageLimit: couponForm.usageLimit === 0 ? null : couponForm.usageLimit
      };

      const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'สร้างคูปองสำเร็จ', timer: 1000, showConfirmButton: false });
        setCouponForm({ code: "", discountType: "percentage", discountValue: 0, usageLimit: 0 });
        fetchCoupons();
      } else {
        const data = await res.json();
        Swal.fire('Error', data.message, 'error');
      }
    } catch (error) { Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error'); }
  };

  const deleteCoupon = async (id: string) => {
    const result = await Swal.fire({
      title: 'ลบคูปองนี้?',
      text: "ลูกค้าจะไม่สามารถใช้โค้ดนี้ได้อีก",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบเลย'
    });
    
    if (result.isConfirmed) {
      await fetch(`https://phone-store-api-hrdj.onrender.com/api/coupons/${id}`, { method: "DELETE" });
      fetchCoupons();
      Swal.fire('Deleted!', 'ลบคูปองแล้ว', 'success');
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) { router.push("/login"); return; }
    const userObj = JSON.parse(savedUser);
    if (userObj.role !== "admin") { router.push("/"); return; }

    Promise.all([fetchPhones(), fetchUsers(), fetchSales(), fetchCoupons()]).then(() => {
        setLoading(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId ? `https://phone-store-api-hrdj.onrender.com/api/phones/${editId}` : "https://phone-store-api-hrdj.onrender.com/api/phones";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", price: 0, brand: "", image: "", description: "", stock: 0 });
    setEditId(null);
    fetchPhones();
    Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1000, showConfirmButton: false });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'ลบเลย' });
    if (result.isConfirmed) {
      await fetch(`https://phone-store-api-hrdj.onrender.com/api/phones/${id}`, { method: "DELETE" });
      fetchPhones();
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase text-gray-400 animate-pulse">Loading Dashboard...</div>;

  return (
    <main className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E] pb-20">
      <nav className="bg-white border-b border-gray-300 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <Link href="/"><h1 className="text-2xl font-black tracking-tight text-black uppercase">Admin<span className="text-[#007AFF]">Panel</span></h1></Link>
          <button onClick={() => router.push("/")} className="text-sm font-black text-gray-600 uppercase border-2 border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all">กลับหน้าร้าน</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* รายงานยอด */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">รายได้สุทธิ</p>
            <h3 className="text-4xl font-black text-[#007AFF]">฿{salesData.totalSales.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ออเดอร์</p>
            <h3 className="text-4xl font-black text-black">{salesData.totalOrders}</h3>
          </div>
          <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">สมาชิก</p>
            <h3 className="text-4xl font-black text-black">{users.length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* 📦 จัดการสินค้า */}
            <section className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-sm">
              <h2 className="text-xl font-black mb-8 uppercase tracking-tight border-b-2 pb-4">📦 จัดการสต็อกสินค้า</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="ชื่อรุ่น" value={form.name} className="border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, name: e.target.value})} required />
                <input type="text" placeholder="แบรนด์" value={form.brand} className="border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, brand: e.target.value})} required />
                <input type="number" placeholder="ราคา" value={form.price || ""} className="border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} required />
                <input type="number" placeholder="สต็อก" value={form.stock || ""} className="border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} required />
                <input type="text" placeholder="URL รูปภาพ" value={form.image} className="md:col-span-2 border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none" onChange={e => setForm({...form, image: e.target.value})} required />
                <textarea placeholder="คำอธิบาย" value={form.description} className="md:col-span-2 border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none h-24" onChange={e => setForm({...form, description: e.target.value})} />
                <button className={`md:col-span-2 py-4 rounded-xl font-black text-lg uppercase transition-all shadow-lg ${editId ? 'bg-orange-500 text-white' : 'bg-[#007AFF] text-white hover:bg-blue-700'}`}>{editId ? "Update Product" : "Add Product"}</button>
              </form>
            </section>

            {/* ตารางสินค้า */}
            <section className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b-2 border-gray-200"><tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest"><th className="p-5">สินค้า</th><th className="p-5 text-center">สต็อก</th><th className="p-5 text-right">ราคา</th><th className="p-5 text-center">จัดการ</th></tr></thead>
                <tbody>{phones.map((phone: any) => (<tr key={phone._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors"><td className="p-5 flex items-center gap-4"><img src={phone.image} className="w-10 h-10 object-contain" /><span className="font-bold">{phone.name}</span></td><td className="p-5 text-center font-black">{phone.stock}</td><td className="p-5 text-right font-black">฿{phone.price.toLocaleString()}</td><td className="p-5 text-center space-x-4"><button onClick={() => {setForm({ ...phone }); setEditId(phone._id); window.scrollTo({top:0, behavior:'smooth'})}} className="text-orange-600 font-black text-xs uppercase hover:underline">Edit</button><button onClick={() => handleDelete(phone._id)} className="text-red-600 font-black text-xs uppercase hover:underline">Delete</button></td></tr>))}</tbody>
              </table>
            </section>
          </div>

          <div className="space-y-10">
             {/* รายการขายล่าสุด */}
             <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                <h2 className="text-lg font-black mb-6 uppercase tracking-tight border-b-2 pb-4 text-[#007AFF]">รายการขายล่าสุด</h2>
                <div className="space-y-6">
                  {salesData.orders.map((order: any) => (
                    <div key={order._id} className="pb-6 border-b last:border-0">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-black text-black">฿{order.totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border-2 outline-none transition-all ${order.status === 'Pending' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''} ${order.status === 'Shipping' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''} ${order.status === 'Delivered' ? 'bg-green-50 border-green-200 text-green-600' : ''} ${order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
                          {['Pending', 'Shipping', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="text-[10px] text-gray-500 italic">{order.items.map((i: any) => i.name).join(", ")}</div>
                    </div>
                  ))}
                </div>
             </section>

             {/* 🎫 ระบบจัดการคูปอง */}
             <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm border-t-4 border-t-black">
                <h2 className="text-lg font-black mb-6 uppercase tracking-tight border-b-2 pb-4">🎫 ระบบคูปอง</h2>
                <form onSubmit={handleCouponSubmit} className="space-y-4 mb-10">
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Coupon Code</label>
                      <input type="text" placeholder="เช่น PHONE10" value={couponForm.code} className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-[#007AFF] outline-none font-bold uppercase" onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} required />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Type</label>
                        <select className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-[#007AFF] outline-none font-bold text-xs" value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}>
                           <option value="percentage">% Percentage</option>
                           <option value="fixed">฿ Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Value</label>
                        <input type="number" placeholder="ค่าลด" value={couponForm.discountValue || ""} className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-[#007AFF] outline-none font-bold" onChange={e => setCouponForm({...couponForm, discountValue: parseInt(e.target.value) || 0})} required />
                      </div>
                   </div>
                   {/* 🟢 เพิ่มช่อง Usage Limit */}
                   <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Usage Limit (0 = ไม่จำกัด)</label>
                      <input type="number" placeholder="โควตาจำนวนครั้ง" value={couponForm.usageLimit || ""} className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-[#007AFF] outline-none font-bold" onChange={e => setCouponForm({...couponForm, usageLimit: parseInt(e.target.value) || 0})} />
                   </div>
                   <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-black uppercase text-xs hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200">สร้างโค้ดส่วนลด</button>
                </form>

                {/* 🟢 รายการคูปองพร้อมโควตา */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  <p className="text-[11px] font-black uppercase text-gray-400 mb-2">โค้ดที่มีอยู่</p>
                  {coupons.length === 0 ? (
                    <p className="text-center text-gray-400 text-[10px] font-bold py-4 italic">ไม่มีข้อมูลคูปอง</p>
                  ) : (
                    coupons.map((cp) => (
                      <div key={cp._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                        <div className="flex-1">
                          <p className="font-black text-sm text-black uppercase leading-none mb-1">{cp.code}</p>
                          <p className="text-[9px] font-bold text-gray-500 uppercase">
                            ลด {cp.discountValue} {cp.discountType === 'percentage' ? '%' : '฿'}
                          </p>
                          {/* 🟢 แสดง Used / Limit */}
                          <p className={`text-[9px] font-black mt-1 uppercase ${cp.usageLimit && cp.usageCount >= cp.usageLimit ? 'text-red-500' : 'text-[#007AFF]'}`}>
                            Used: {cp.usageCount} / {cp.usageLimit ?? "∞"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                             (cp.expiryDate && new Date() > new Date(cp.expiryDate)) || (cp.usageLimit && cp.usageCount >= cp.usageLimit)
                             ? 'bg-red-50 border-red-200 text-red-600' 
                             : 'bg-green-50 border-green-200 text-green-600'
                           }`}>
                             {(cp.expiryDate && new Date() > new Date(cp.expiryDate)) || (cp.usageLimit && cp.usageCount >= cp.usageLimit) ? 'Inactive' : 'Active'}
                           </span>
                           <button onClick={() => deleteCoupon(cp._id)} className="text-red-500 hover:text-red-700 transition-colors">🗑️</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </section>

             <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                <h2 className="text-lg font-black mb-4 uppercase tracking-tight">สมาชิก</h2>
                <div className="max-h-60 overflow-y-auto">
                  {users.map((u: any) => (
                    <div key={u._id} className="flex justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-bold">{u.username}</span>
                      <span className="text-[9px] font-black text-green-600 uppercase bg-green-50 px-2 py-1 rounded-md">{u.role}</span>
                    </div>
                  ))}
                </div>
             </section>
          </div>
        </div>
      </div>
    </main>
  );
}