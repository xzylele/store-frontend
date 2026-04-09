"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "../../../store/cartStore";
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

  // 🟢 State สำหรับจัดการสี รูปภาพ และสต็อกแยกสี
  const [mainImage, setMainImage] = useState(""); 
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColorStock, setSelectedColorStock] = useState<number | null>(null);

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    const loadData = async () => {
      const data = await getPhone(phoneId);
      if (data) {
        setPhone(data);
        setMainImage(data.image);
        // 🚩 ไม่ตั้งค่า selectedColorStock เริ่มต้น เพื่อบังคับให้เลือกสีจาก Variants ก่อน
      }
      setLoading(false);
    };
    loadData();
  }, [phoneId]);

  // 🚩 ตรวจสอบเงื่อนไขการเลือกสี
  const hasVariants = phone?.variants && phone.variants.length > 0;
  const isColorSelected = !hasVariants || selectedColor !== ""; // ถ้าไม่มีสีให้เลือก ถือว่าเลือกแล้ว (เช่น เคส/หูฟัง)
  const currentStock = selectedColorStock ?? 0;
  const isOutOfStock = isColorSelected && currentStock <= 0;

  const handleBuyNow = () => {
    if (!isColorSelected) {
        Swal.fire({ icon: 'info', title: 'กรุณาเลือกสี', text: 'โปรดเลือกสีที่คุณต้องการก่อนดำเนินการต่อ' });
        return;
    }

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
      }).then((result) => {
        if (result.isConfirmed) router.push("/login");
      });
      return;
    }

    addToCart({
      id: phone._id,
      name: `${phone.name} ${selectedColor ? `(${selectedColor})` : ""}`,
      price: phone.price,
      image: mainImage,
      quantity: 1
    });

    router.push("/cart");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
      <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Loading Device...</p>
    </div>
  );

  if (!phone) return <div className="p-20 text-center font-black uppercase text-red-500">Device Not Found</div>;

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
          
          {/* 🖼️ ฝั่งซ้าย: รูปภาพสินค้า */}
          <div className="w-full lg:w-1/2 flex justify-center bg-white rounded-[3rem] p-12 border-2 border-gray-100 shadow-xl shadow-gray-200/50 transition-all relative overflow-hidden group">
            <img 
                src={mainImage} 
                alt={phone.name} 
                className={`w-full max-w-md object-contain transition-all duration-700 ease-out ${isOutOfStock ? 'grayscale opacity-30' : 'group-hover:scale-110'}`} 
            />
            {selectedColor && (
              <button 
                onClick={() => {
                    setMainImage(phone.image); 
                    setSelectedColor("");
                    setSelectedColorStock(null);
                }}
                className="absolute bottom-6 right-6 bg-gray-100 hover:bg-gray-200 text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest transition-all"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* 📝 ฝั่งขวา: ข้อมูลสินค้า */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <p className="text-sm font-black text-[#007AFF] tracking-[0.4em] mb-4 uppercase">{phone.brand}</p>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-6 tracking-tighter leading-tight uppercase">
              {phone.name} <br />
              {selectedColor ? (
                <span className="text-2xl text-[#007AFF] block mt-2 animate-in fade-in slide-in-from-left-4">Finish: {selectedColor}</span>
              ) : (
                <span className="text-2xl text-gray-300 block mt-2">Please select a color</span>
              )}
            </h1>
            
            {/* 🚩 แสดงสต็อกแจ้งเตือน */}
            <div className={`flex items-center gap-3 mb-8 bg-white w-fit px-4 py-2 rounded-xl border-2 transition-all ${!isColorSelected ? 'border-orange-200' : isOutOfStock ? 'border-red-200' : 'border-green-200'}`}>
                <span className={`w-2 h-2 rounded-full ${!isColorSelected ? 'bg-orange-400' : isOutOfStock ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                <p className={`text-[10px] font-black uppercase tracking-widest ${!isColorSelected ? 'text-orange-500' : isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                    {!isColorSelected 
                        ? "รอยืนยันการเลือกสี" 
                        : isOutOfStock ? `สี${selectedColor} หมดชั่วคราว` : `สี${selectedColor} พร้อมส่ง ${currentStock} เครื่อง`
                    }
                </p>
            </div>

            {/* 🎨 ระบบเลือกสี (บังคับเลือก) */}
            {hasVariants && (
              <div className="mb-10 p-6 bg-white rounded-3xl border-2 border-gray-200 shadow-sm relative">
                {!isColorSelected && <div className="absolute -top-3 left-6 bg-[#007AFF] text-white text-[8px] font-black px-2 py-1 rounded uppercase animate-bounce">Select Here</div>}
                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em]">Select Finish</p>
                <div className="flex flex-wrap gap-4">
                  {phone.variants.map((v: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMainImage(v.variantImage);
                        setSelectedColor(v.colorName);
                        setSelectedColorStock(v.stock);
                      }}
                      className={`group relative w-16 h-16 rounded-2xl border-2 transition-all overflow-hidden p-1 ${
                        selectedColor === v.colorName 
                        ? "border-[#007AFF] scale-110 bg-blue-50 shadow-lg shadow-blue-100" 
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      } ${v.stock <= 0 ? 'opacity-40' : ''}`}
                    >
                      <img src={v.variantImage} className="w-full h-full object-contain rounded-xl" />
                      {v.stock <= 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-[8px] font-black text-red-600">OUT</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-lg text-gray-600 mb-10 leading-relaxed font-bold border-l-4 border-gray-300 pl-6 py-2">
              {phone.description}
            </p>

            <div className="mb-10 p-8 bg-[#1C1C1E] rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                <p className="text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.2em]">Price</p>
                <p className={`text-5xl font-black ${isOutOfStock ? 'text-gray-600 line-through' : 'text-white'}`}>
                    ฿{phone.price.toLocaleString()}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* 🟢 ปุ่ม AddToCart เช็คทั้งการเลือกสีและสต็อก */}
              {isColorSelected && !isOutOfStock ? (
                <AddToCartBtn phone={{
                    ...phone, 
                    image: mainImage, 
                    name: `${phone.name} ${selectedColor ? `(${selectedColor})` : ""}`,
                    stock: currentStock
                }} />
              ) : (
                <button disabled className="flex-1 py-5 rounded-2xl bg-gray-100 text-gray-400 font-black uppercase cursor-not-allowed border-2 border-gray-200 transition-all">
                    {!isColorSelected ? "กรุณาเลือกสี" : "สินค้าหมด"}
                </button>
              )}
              
              <button 
                onClick={handleBuyNow}
                disabled={!isColorSelected || isOutOfStock}
                className={`flex-1 py-5 rounded-2xl font-black text-lg uppercase transition-all shadow-xl active:scale-95
                  ${(!isColorSelected || isOutOfStock) 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-100" 
                    : "bg-[#007AFF] text-white hover:bg-blue-700 shadow-blue-200"
                  }`}
              >
                {!isColorSelected ? "โปรดเลือกสี" : isOutOfStock ? "Sold Out" : "ซื้อเลย"}
              </button>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-200 flex items-center gap-4 text-gray-400">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold">i</div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-loose">
                    Free Shipping in Thailand <br/> 
                    1-Year Official Warranty Included
                </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}