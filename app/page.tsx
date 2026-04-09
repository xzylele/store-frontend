"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavbarCart from "../components/NavbarCart";

// ฟังก์ชันดึงข้อมูลสินค้าจาก Backend
async function getPhones() {
  try {
    const res = await fetch('https://phone-store-api-hrdj.onrender.com/api/phones', { cache: 'no-store' });
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
    return res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return []; 
  }
}

export default function Home() {
  const [phones, setPhones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getPhones();
      setPhones(data);
    };
    loadData();
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // สร้างรายชื่อ Brand ทั้งหมดที่มีในระบบ
  const brands = ["All", ...new Set(phones.map((p: any) => p.brand))];

  // ระบบ Filter: ค้นหาตามชื่อ/แบรนด์ และเลือกตามแบรนด์
  let filteredPhones = phones.filter((phone: any) =>
    (phone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phone.brand.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedBrand === "All" || phone.brand === selectedBrand)
  );

  // ระบบ Sorting: เรียงราคา
  if (sortBy === "lowToHigh") {
    filteredPhones.sort((a: any, b: any) => a.price - b.price);
  } else if (sortBy === "highToLow") {
    filteredPhones.sort((a: any, b: any) => b.price - a.price);
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E]">
      {/* 1. Navbar: สไตล์ High Contrast */}
      <nav className="bg-white border-b border-gray-300 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <Link href="/">
            <h1 className="text-2xl font-black tracking-tight text-black cursor-pointer uppercase">
              PHONE<span className="text-[#007AFF]">STORE</span>
            </h1>
          </Link>
          
          {/* Search Bar ใน Navbar */}
          <div className="hidden md:flex flex-1 max-w-md mx-10">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อรุ่นหรือแบรนด์..." 
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-2 pl-12 pr-4 text-sm font-bold focus:border-[#007AFF] focus:bg-white outline-none transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3 bg-gray-100 p-1.5 pl-4 rounded-xl border border-gray-200">
                <div className="text-right hidden sm:block mr-2">
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{user.role}</p>
                  <p className="text-xs font-black text-black">{user.username}</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* ปุ่มประวัติการซื้อ */}
                    <Link href="/orders">
                      <button className="text-[10px] font-black text-[#007AFF] uppercase hover:underline px-2 tracking-tighter">
                        My Orders
                      </button>
                    </Link>

                    {/* ปุ่ม Admin (ถ้ามีสิทธิ์) */}
                    {user.role === 'admin' && (
                      <Link href="/admin">
                        <button className="bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-gray-800 transition-colors">
                          Admin
                        </button>
                      </Link>
                    )}
                    
                    <button onClick={handleLogout} className="text-[10px] text-red-600 font-black border-l border-gray-300 pl-3 uppercase hover:opacity-70">
                      Logout
                    </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-xs font-black text-[#007AFF] border-2 border-[#007AFF] px-5 py-2 rounded-xl hover:bg-[#007AFF] hover:text-white transition-all uppercase tracking-widest">
                Login
              </Link>
            )}
            <NavbarCart />
          </div>
        </div>
      </nav>

      {/* 2. Hero Section: แสดงเฉพาะตอนไม่ได้ค้นหา */}
      {!searchTerm && selectedBrand === "All" && (
        <section className="bg-[#1C1C1E] text-white py-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase leading-none">THE NEXT <br/><span className="text-[#007AFF]">GENERATION</span></h2>
            <p className="text-sm md:text-base text-gray-400 font-black uppercase tracking-[0.4em] opacity-80 mb-10">Experience Smartphones like never before</p>
            <div className="h-1 w-20 bg-[#007AFF] mx-auto"></div>
          </div>
        </section>
      )}

      {/* 3. Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border-2 border-gray-200 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                  selectedBrand === brand 
                    ? "bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-xl scale-105" 
                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:text-black"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Sort by</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-sm font-black outline-none cursor-pointer uppercase pr-2"
            >
              <option value="default">Default</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. Product List */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        {filteredPhones.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
             <div className="text-6xl mb-6 opacity-20">📱</div>
             <p className="text-lg font-black text-gray-300 uppercase tracking-widest">No devices found</p>
             <button onClick={() => {setSearchTerm(""); setSelectedBrand("All");}} className="mt-6 bg-[#007AFF] text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-100 transition-all">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPhones.map((phone: any) => (
              <div key={phone._id} className="bg-white rounded-[2.5rem] border-2 border-gray-200 p-8 flex flex-col hover:border-[#007AFF] hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500 group relative overflow-hidden">
                
                {/* Stock Label */}
                {phone.stock <= 0 && (
                   <div className="absolute top-6 right-6 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase z-10">Sold Out</div>
                )}

                <div className="w-full h-64 bg-white mb-10 flex items-center justify-center rounded-2xl transition-all overflow-hidden p-4">
                  <img src={phone.image} alt={phone.name} className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700" />
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] mb-3">{phone.brand}</p>
                  <h3 className="text-3xl font-black text-black mb-3 tracking-tighter leading-tight uppercase">{phone.name}</h3>
                  <div className="flex items-baseline gap-2 mb-8">
                     <span className="text-xs font-black text-gray-400">THB</span>
                     <p className="text-3xl font-black text-black">{phone.price.toLocaleString()}</p>
                  </div>
                </div>

                <Link href={`/phone/${phone._id}`} className="w-full">
                  <button className="w-full bg-[#1C1C1E] text-white py-5 rounded-2xl font-black text-sm uppercase group-hover:bg-[#007AFF] transition-all shadow-xl active:scale-95">
                    View Details
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Footer */}
      <footer className="bg-white border-t border-gray-200 py-20 text-center">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-xl font-black tracking-widest text-black mb-4 uppercase">PHONE<span className="text-[#007AFF]">STORE</span></h1>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em]">Premium Device Experience</p>
            <div className="mt-10 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[10px] font-bold text-gray-400">© 2026 PHONESTORE. ALL RIGHTS RESERVED.</p>
                <div className="flex gap-8">
                    <span className="text-[10px] font-black text-black uppercase cursor-pointer hover:text-[#007AFF]">Terms</span>
                    <span className="text-[10px] font-black text-black uppercase cursor-pointer hover:text-[#007AFF]">Privacy</span>
                    <span className="text-[10px] font-black text-black uppercase cursor-pointer hover:text-[#007AFF]">Support</span>
                </div>
            </div>
          </div>
      </footer>
    </main>
  );
}