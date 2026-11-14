'use client';

import React, { useState, useEffect } from 'react';
import { Search, Coffee, Sparkles, AlertCircle, Flame, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { Product } from '@/types';
import { api } from '@/services/api';
import { CATEGORY_FILTERS } from '@/lib/categories';


export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProducts(selectedCategory, searchQuery);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối máy chủ để tải thực đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // F5 luôn mở lại từ đầu trang chủ thay vì để trình duyệt khôi phục vị trí cuộn cũ
    window.history.scrollRestoration = 'manual';
    if (window.location.hash !== '#menu-section') {
      window.scrollTo(0, 0);
    }
    return () => {
      window.history.scrollRestoration = 'auto';
    };
  }, []);

  useEffect(() => {
    fetchProducts();
    if (typeof window !== 'undefined' && window.location.hash === '#menu-section') {
      setTimeout(() => {
        document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
        // Xóa #menu-section khỏi địa chỉ để F5 không tự cuộn xuống thực đơn nữa
        window.history.replaceState(null, '', window.location.pathname);
      }, 200);
    }
  // Chỉ tải lại khi đổi danh mục; tìm kiếm chạy khi khách bấm Enter (handleSearchSubmit)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full">
        {/* Commercial Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-100/60 via-amber-50/40 to-[#FDFBF7] py-12 sm:py-16 border-b border-amber-100/60">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-800/10 text-amber-900 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Cà Phê Đặc Sản • Rang Mộc 100%</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight max-w-3xl mx-auto">
              Cà Phê Pha Chuẩn Vị <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-800 via-amber-700 to-amber-600">
                Đặt Nhanh Không Tiền Mặt
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto mt-4 leading-relaxed font-medium">
              Thưởng thức từng ngụm cà phê đặc sản được tuyển chọn từ nông trường Buôn Ma Thuột &amp; Cầu Đất.
              Đặt trước và nhận tại quầy chỉ sau vài chạm.
            </p>

            {/* Commercial Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 text-xs font-semibold text-stone-700">
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-stone-200/60 shadow-sm">
                <Coffee className="w-4 h-4 text-amber-700" />
                <span>Hạt Robusta &amp; Arabica Tuyển Chọn</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-stone-200/60 shadow-sm">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Nhận Nước Nhanh Tại Quầy</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-stone-200/60 shadow-sm">
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Thanh Toán MoMo, VNPay, Thẻ</span>
              </div>
            </div>
          </div>
        </section>

        {/* Storefront Menu Section */}
        <section className="max-w-6xl mx-auto px-4 py-10 w-full scroll-mt-20" id="menu-section">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                Thực Đơn Đồ Uống
              </h2>
              <p className="text-xs text-stone-500 mt-1 font-medium">
                Khám phá danh sách đồ uống thủ công được pha chế tươi mỗi ngày
              </p>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món cà phê, trà..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/40 shadow-sm"
              />
            </form>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-amber-800 text-white shadow-md'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Content States */}
          {loading ? (
            /* Loading State: Skeleton Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-stone-200/80 p-4 space-y-3 animate-pulse"
                >
                  <div className="h-44 bg-stone-200 rounded-xl w-full" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-full" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-7 bg-stone-200 rounded-lg w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center max-w-md mx-auto my-12">
              <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
              <h3 className="font-bold text-base mb-1">Không thể tải thực đơn</h3>
              <p className="text-xs text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition"
              >
                Thử lại kết nối
              </button>
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center max-w-md mx-auto my-12 shadow-brew-card">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-stone-900 text-base mb-1">
                Chưa tìm thấy món phù hợp
              </h3>
              <p className="text-xs text-stone-500 mb-6 font-medium">
                Không tìm thấy đồ uống nào với từ khóa &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition shadow-sm"
              >
                Xem tất cả thực đơn
              </button>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Product Customizer Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Commercial F&B Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-16 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-800 text-white flex items-center justify-center font-black text-xs">
              B
            </div>
            <span className="font-extrabold text-stone-900 text-sm">BrewLite Coffee Roasters</span>
          </div>
          <p className="font-medium text-stone-500">
            Trải nghiệm đặt món nhanh chóng &amp; thanh toán không tiền mặt tại quầy
          </p>
          <div className="text-stone-400 font-semibold">
            Hotline: 1900 6868 • 07:00 - 22:30
          </div>
        </div>
      </footer>
    </div>
  );
}
