"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <main className="min-h-screen flex items-center justify-center bg-[#fbfbfd] p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tighter">สร้างบัญชีใหม่</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">เข้าร่วมเป็นส่วนหนึ่งของ PhoneStore</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="ชื่อผู้ใช้" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={e => setForm({...form, username: e.target.value})} required />
          <input type="email" placeholder="อีเมล" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="รหัสผ่าน" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={e => setForm({...form, password: e.target.value})} required />
          
          <button className="w-full bg-blue-600 text-white py-4 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-4">
            สมัครสมาชิก
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-500">
          มีบัญชีอยู่แล้ว? <Link href="/login" className="text-blue-600 font-bold hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </main>
  );
}