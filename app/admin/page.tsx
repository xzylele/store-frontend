"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

// 🟢 Interfaces
interface Variant {
  colorName: string;
  variantImage: string;
  stock: number;
}

interface Phone {
  _id: string;
  name: string;
  price: number;
  brand: string;
  image: string;
  description: string;
  stock: number;
  category: string;
  variants: Variant[];
}

interface Coupon {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  
  const [phones, setPhones] = useState<Phone[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any>({ totalSales: 0, totalOrders: 0, orders: [] });
  const [coupons, setCoupons] = useState<Coupon[]>([]); 
  const [loading, setLoading] = useState(true);

  // 🟢 State ของฟอร์ม
  const [form, setForm] = useState({ 
    name: "", price: 0, brand: "", image: "", description: "", stock: 0, category: "Phone",
    variants: [] as Variant[]
  });
  
  const [couponForm, setCouponForm] = useState({ 
    code: "", 
    discountType: "percentage", 
    discountValue: 0,
    usageLimit: 0 
  }); 

  const [editId, setEditId] = useState<string | null>(null);

  // --- 📡 Data Fetching ---
  const fetchData = async () => {
    try {
      const [resP, resU, resS, resC] = await Promise.all([
        fetch("https://phone-store-api-hrdj.onrender.com/api/phones"),
        fetch("https://phone-store-api-hrdj.onrender.com/api/users"),
        fetch("https://phone-store-api-hrdj.onrender.com/api/sales-summary"),
        fetch("https://phone-store-api-hrdj.onrender.com/api/coupons")
      ]);
      setPhones(await resP.json());
      setUsers(await resU.json());
      setSalesData(await resS.json());
      const cData = await resC.json();
      if (Array.isArray(cData)) setCoupons(cData);
      setLoading(false);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) { router.push("/login"); return; }
    const userObj = JSON.parse(savedUser);
    if (userObj.role !== "admin") { router.push("/"); return; }
    fetchData();
  }, [router]);

  // --- 🎨 Variant Logic ---
  const addVariantField = () => setForm({ ...form, variants: [...form.variants, { colorName: "", variantImage: "", stock: 0 }] });
  const removeVariantField = (index: number) => setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  const handleVariantChange = (index: number, field: keyof Variant, value: string | number) => {
    const updated = [...form.variants];
    // @ts-ignore
    updated[index][field] = field === "stock" ? parseInt(value as string) || 0 : value;
    setForm({ ...form, variants: updated });
  };

  // --- 🛒 Actions ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalVariantStock = form.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const finalForm = { ...form, stock: form.variants.length > 0 ? totalVariantStock : form.stock };
    const method = editId ? "PUT" : "POST";
    const url = editId ? `https://phone-store-api-hrdj.onrender.com/api/phones/${editId}` : "https://phone-store-api-hrdj.onrender.com/api/phones";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(finalForm) });
    if (res.ok) {
      setForm({ name: "", price: 0, brand: "", image: "", description: "", stock: 0, category: "Phone", variants: [] });
      setEditId(null);
      fetchData();
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1000, showConfirmButton: false });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบสินค้า?',
      text: "ข้อมูลสินค้านี้จะถูกลบออกจากระบบถาวร",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบเลย'
    });
    if (result.isConfirmed) {
      await fetch(`https://phone-store-api-hrdj.onrender.com/api/phones/${id}`, { method: "DELETE" });
      fetchData();
      Swal.fire('Deleted!', 'ลบสินค้าสำเร็จ', 'success');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await fetch(`https://phone-store-api-hrdj.onrender.com/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...couponForm, usageLimit: couponForm.usageLimit === 0 ? null : couponForm.usageLimit };
    await fetch("https://phone-store-api-hrdj.onrender.com/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });
    setCouponForm({ code: "", discountType: "percentage", discountValue: 0, usageLimit: 0 });
    fetchData();
    Swal.fire({ icon: 'success', title: 'สร้างคูปองสำเร็จ' });
  };

  const deleteCoupon = async (id: string) => {
    const result = await Swal.fire({ title: 'ลบคูปอง?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await fetch(`https://phone-store-api-hrdj.onrender.com/api/coupons/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  // 🟢 ฟังก์ชันดูรายละเอียดลูกค้าแบบเจาะลึก (รวมรายการสินค้า สี และจำนวน)
  const viewCustomerDetail = (username: string) => {
    const customerOrders = salesData.orders.filter((o: any) => o.username === username);
    const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
    
    Swal.fire({
      title: `<div class="flex flex-col items-center">
                <span class="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] mb-1">Customer Insight</span>
                <span class="uppercase font-black text-2xl text-black">${username}</span>
              </div>`,
      html: `
        <div class="text-left space-y-4 p-2">
          <div class="bg-black p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
             <p class="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Lifetime Value</p>
             <p class="text-4xl font-black italic">฿${totalSpent.toLocaleString()}</p>
             <p class="text-[10px] font-bold text-blue-400 mt-2 uppercase">Total: ${customerOrders.length} Orders</p>
          </div>

          <div>
            <p class="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest pl-2">Detailed History</p>
            <div class="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              ${customerOrders.length > 0 ? customerOrders.map((o: any) => `
                <div class="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-black text-gray-400 uppercase">${new Date(o.createdAt).toLocaleDateString()}</span>
                    <span class="text-[8px] font-black uppercase px-2 py-1 rounded-md ${o.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}">${o.status}</span>
                  </div>
                  
                  <div class="space-y-2">
                    ${o.items.map((item: any) => `
                      <div class="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                        <div class="flex items-center gap-2">
                          <img src="${item.image}" class="w-8 h-8 object-contain rounded-md" />
                          <div>
                            <p class="text-[10px] font-black text-black leading-none">${item.name}</p>
                            <p class="text-[8px] font-bold text-gray-400 uppercase">Qty: ${item.quantity}</p>
                          </div>
                        </div>
                        <p class="text-[10px] font-black">฿${(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    `).join('')}
                  </div>

                  <div class="mt-3 pt-2 border-t border-dashed flex justify-between items-center">
                    <span class="text-[9px] font-black text-gray-400 uppercase">Grand Total</span>
                    <span class="text-sm font-black text-[#007AFF]">฿${o.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              `).join('') : '<p class="text-center text-gray-300 py-10 font-bold">No Records</p>'}
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'CLOSE INSIGHT',
      confirmButtonColor: '#000',
      width: '450px',
      customClass: { popup: 'rounded-[3rem]' }
    });
  };

  if (loading) return <div className="p-20 text-center font-black uppercase text-gray-400 animate-pulse tracking-widest">Loading Admin...</div>;

  return (
    <main className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E] pb-20">
      <nav className="bg-white border-b border-gray-300 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <Link href="/"><h1 className="text-2xl font-black tracking-tight text-black uppercase">Admin<span className="text-[#007AFF]">Panel</span></h1></Link>
          <button onClick={() => router.push("/")} className="text-sm font-black text-gray-600 uppercase border-2 border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all">กลับหน้าร้าน</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Net Revenue</p>
            <h3 className="text-4xl font-black text-[#007AFF]">฿{salesData.totalSales?.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Orders</p>
            <h3 className="text-4xl font-black text-black">{salesData.totalOrders}</h3>
          </div>
          <div className="bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Members</p>
            <h3 className="text-4xl font-black text-black">{users.length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* 📦 Manage Products Section */}
            <section className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-200 shadow-sm">
              <h2 className="text-xl font-black mb-8 uppercase tracking-tight border-b-2 pb-4 text-[#007AFF]">📦 Product & Stock Management</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="Device Name" value={form.name} className="border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, name: e.target.value})} required />
                  <input type="text" placeholder="Brand" value={form.brand} className="border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, brand: e.target.value})} required />
                  <input type="number" placeholder="Price (฿)" value={form.price || ""} className="border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} required />
                  <input type="number" placeholder="Total Stock (Auto)" value={form.stock || ""} className="border-2 border-gray-200 p-3 rounded-xl font-bold bg-gray-50 cursor-not-allowed" readOnly />
                  <div className="md:col-span-2">
                    <select value={form.category} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="Phone">Phone</option>
                      <option value="Case">Case</option>
                      <option value="AirPods">AirPods</option>
                      <option value="Apple Watch">Apple Watch</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Image URL" value={form.image} className="md:col-span-2 border-2 border-gray-200 p-3 rounded-xl focus:border-[#007AFF] outline-none font-bold" onChange={e => setForm({...form, image: e.target.value})} required />
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">Color Variant Stock</h3>
                    <button type="button" onClick={addVariantField} className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-[#007AFF] transition-all">+ Add New Variant</button>
                  </div>
                  <div className="space-y-4">
                    {form.variants.map((v, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm items-center">
                        <input type="text" placeholder="Color" value={v.colorName} className="md:col-span-3 text-xs font-bold p-2 border-b-2 outline-none" onChange={(e) => handleVariantChange(index, "colorName", e.target.value)} required />
                        <input type="text" placeholder="URL" value={v.variantImage} className="md:col-span-5 text-xs font-bold p-2 border-b-2 outline-none" onChange={(e) => handleVariantChange(index, "variantImage", e.target.value)} required />
                        <input type="number" placeholder="Stock" value={v.stock || ""} className="md:col-span-2 text-xs font-black p-2 border-b-2 border-blue-100 outline-none" onChange={(e) => handleVariantChange(index, "stock", e.target.value)} required />
                        <button type="button" onClick={() => removeVariantField(index)} className="md:col-span-2 text-red-500 font-black text-[10px] uppercase">Delete</button>
                      </div>
                    ))}
                  </div>
                </div>

                <textarea placeholder="Description..." value={form.description} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none h-24 font-bold" onChange={e => setForm({...form, description: e.target.value})} />
                <button type="submit" className={`w-full py-4 rounded-xl font-black text-lg uppercase transition-all shadow-lg ${editId ? 'bg-orange-500 text-white' : 'bg-[#007AFF] text-white hover:bg-black'}`}>
                  {editId ? "Update Product" : "Confirm & Save"}
                </button>
              </form>
            </section>

            {/* 📋 Inventory Table */}
            <section className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b-2 border-gray-200 text-[10px] font-black uppercase text-gray-400">
                    <tr>
                        <th className="p-5">Device</th>
                        <th className="p-5 text-center">Colors</th>
                        <th className="p-5 text-center">Total Stock</th>
                        <th className="p-5 text-right">Price</th>
                        <th className="p-5 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="text-xs font-bold text-gray-600">
                  {phones.map((p) => (
                    <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-5 flex items-center gap-4">
                            <img src={p.image} className="w-10 h-10 object-contain rounded-lg" />
                            <span className="uppercase">{p.name}</span>
                        </td>
                        <td className="p-5 text-center">
                           <span className="bg-blue-50 text-[#007AFF] text-[9px] font-black px-2 py-1 rounded-full uppercase">{p.variants?.length || 0} สี</span>
                        </td>
                        <td className="p-5 text-center font-black text-[#1C1C1E]">{p.stock}</td>
                        <td className="p-5 text-right font-black text-black">฿{p.price.toLocaleString()}</td>
                        <td className="p-5 text-center space-x-3">
                            <button onClick={() => { setForm({ ...p, variants: p.variants || [] }); setEditId(p._id); window.scrollTo({top: 0, behavior: 'smooth'});}} className="text-orange-500 hover:underline uppercase text-[10px] font-black">Edit</button>
                            <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:underline uppercase text-[10px] font-black">Del</button>
                        </td>
                    </tr>
                ))}</tbody>
              </table>
            </section>
          </div>

          <div className="space-y-10">
             {/* 📜 Recent Sales Feed - อัปเกรดใหม่โชว์รูปและสินค้า */}
             <section className="bg-white p-6 rounded-[2rem] border-2 border-gray-200 shadow-sm">
                <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-[#007AFF] border-b pb-2">Recent Sales Feed</h2>
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {salesData.orders?.slice(0, 10).map((order: any) => (
                    <div key={order._id} className="pb-6 border-b last:border-0 border-gray-100 group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-black text-black leading-none mb-1">฿{order.totalAmount.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                            {order.username} • {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)} 
                          className={`text-[8px] font-black uppercase p-1.5 rounded-lg border-2 outline-none transition-all cursor-pointer
                            ${order.status === 'Pending' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''} 
                            ${order.status === 'Shipping' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''} 
                            ${order.status === 'Delivered' ? 'bg-green-50 border-green-200 text-green-600' : ''} 
                            ${order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
                        >
                          {['Pending', 'Shipping', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* 🛍️ รายการสินค้าตัวเล็กๆ ในออเดอร์นั้น */}
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 pr-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 border border-gray-200 shadow-sm">
                              <img src={item.image} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-gray-800 leading-tight truncate max-w-[100px]">{item.name}</p>
                              <p className="text-[8px] font-bold text-[#007AFF] uppercase">x{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
             </section>

             {/* 🎫 Coupon Logic */}
             <section className="bg-white p-6 rounded-[2rem] border-2 border-gray-200 shadow-sm border-t-4 border-t-black">
                <h2 className="text-sm font-black mb-4 uppercase tracking-widest">🎫 Voucher Management</h2>
                <form onSubmit={handleCouponSubmit} className="space-y-3 mb-6">
                   <input type="text" placeholder="CODE" value={couponForm.code} className="w-full border-2 p-2 rounded-xl text-xs font-bold uppercase outline-none focus:border-black" onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} required />
                   <div className="grid grid-cols-2 gap-2">
                      <select className="border-2 p-2 rounded-xl text-[10px] font-bold" value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}>
                         <option value="percentage">% Percentage</option>
                         <option value="fixed">฿ Fixed Amount</option>
                      </select>
                      <input type="number" placeholder="Value" value={couponForm.discountValue || ""} className="border-2 p-2 rounded-xl text-xs font-bold outline-none focus:border-black" onChange={e => setCouponForm({...couponForm, discountValue: parseInt(e.target.value) || 0})} required />
                   </div>
                   <div>
                     <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">Usage Limit (0 = ∞)</label>
                     <input type="number" placeholder="Max uses" value={couponForm.usageLimit || ""} className="w-full border-2 p-2 rounded-xl text-xs font-bold outline-none focus:border-black" onChange={e => setCouponForm({...couponForm, usageLimit: parseInt(e.target.value) || 0})} />
                   </div>
                   <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-[#007AFF] transition-all">Create Coupon</button>
                </form>
                <div className="max-h-48 overflow-y-auto space-y-3">
                   {coupons.map(cp => (
                      <div key={cp._id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-xs uppercase text-[#007AFF]">{cp.code}</span>
                            <button onClick={() => deleteCoupon(cp._id)} className="text-red-400 text-[10px] font-bold hover:text-red-600 transition-colors">Del</button>
                         </div>
                         <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                            <span>ลด: {cp.discountValue}${cp.discountType === 'percentage' ? '%' : '฿'}</span>
                            <span>ใช้: {cp.usageCount} / ${cp.usageLimit || '∞'}</span>
                         </div>
                         <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden shadow-inner">
                            <div className="bg-[#007AFF] h-full transition-all duration-700" style={{ width: `${cp.usageLimit ? Math.min((cp.usageCount / cp.usageLimit) * 100, 100) : 0}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* 👥 Member History System */}
             <section className="bg-white p-6 rounded-[2rem] border-2 border-gray-200 shadow-sm">
                <h2 className="text-sm font-black mb-4 uppercase tracking-widest text-[#007AFF]">👥 Customer Insight</h2>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {users.map((u: any) => (
                    <div 
                      key={u._id} 
                      onClick={() => viewCustomerDetail(u.username)}
                      className="flex justify-between items-center py-2 px-3 border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl cursor-pointer transition-all group shadow-sm bg-gray-50"
                    >
                      <div>
                        <p className="text-[11px] font-black uppercase text-black leading-none mb-1">{u.username}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{u.role}</p>
                      </div>
                      <span className="text-[8px] opacity-0 group-hover:opacity-100 text-[#007AFF] font-black uppercase transition-all bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-sm">View History →</span>
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