"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavbarCart from "../../components/NavbarCart"; // 🟢 เพิ่ม Navbar เพื่อความเป็นแบรนด์เดียวกัน

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      router.push("/login");
    } else {
      alert("เกิดข้อผิดพลาดในการสมัคร");
    }
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
          <div className="flex items-center space-x-6">
            <Link href="/login" className="text-sm font-bold text-[#007AFF] hover:underline uppercase tracking-widest">Login</Link>
            <NavbarCart />
          </div>
        </div>
      </nav>

      {/* 2. Register Form: สไตล์ High Contrast */}
      <div className="flex items-center justify-center py-20 px-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-blue-50 border-2 border-gray-100 w-full max-w-md relative overflow-hidden">
          
          {/* แถบสีน้ำเงินด้านบน */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#007AFF]"></div>
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-black leading-none mb-4 tracking-tighter uppercase">SIGN UP</h1>
            
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 tracking-widest">Username</label>
              <input type="text" placeholder="your_name" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 text-sm font-bold focus:border-[#007AFF] focus:bg-white outline-none transition-all" 
                onChange={e => setForm({...form, username: e.target.value})} required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 tracking-widest">Email Address</label>
              <input type="email" placeholder="email@example.com" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 text-sm font-bold focus:border-[#007AFF] focus:bg-white outline-none transition-all" 
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 tracking-widest">Password</label>
              <input type="password" placeholder="••••••••••••" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 text-sm font-bold focus:border-[#007AFF] focus:bg-white outline-none transition-all" 
                onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            
            <button className="w-full bg-[#1C1C1E] text-white py-5 rounded-2xl font-black text-sm uppercase group-hover:bg-[#007AFF] transition-all shadow-xl active:scale-95 shadow-gray-100 hover:bg-black mt-6">
              สมัครสมาชิก
            </button>
          </form>
          
          <div className="mt-10 pt-10 border-t border-gray-100 text-center">
            
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              มีบัญชีอยู่แล้ว? <Link href="/login" className="text-[#007AFF] font-black hover:underline uppercase text-xs">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-gray-200 py-16 text-center">
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