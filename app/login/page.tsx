"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("https://phone-store-api-hrdj.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      // 🟢 บันทึกข้อมูลลง LocalStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ username: data.username, role: data.role }));
      
      alert(`ยินดีต้อนรับคุณ ${data.username}!`);
      router.push("/"); // กลับหน้าแรก
      setTimeout(() => window.location.reload(), 100); // รีโหลดเพื่อให้ Navbar อัปเดต
    } else {
      alert(data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fbfbfd] p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tighter">ยินดีต้อนรับกลับมา</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="อีเมล" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="รหัสผ่าน" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={e => setForm({...form, password: e.target.value})} required />
          
          <button className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 mt-4">
            เข้าสู่ระบบ
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-500">
          ยังไม่มีบัญชี? <Link href="/register" className="text-blue-600 font-bold hover:underline">สร้างบัญชีใหม่</Link>
        </p>
      </div>
    </main>
  );
}