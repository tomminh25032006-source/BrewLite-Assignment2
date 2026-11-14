'use client';

import React, { useState, useEffect } from 'react';
import { Search, Coffee, Sparkles, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { Product } from '@/types';
import { api } from '@/services/api';
import { CATEGORY_FILTERS } from '@/lib/categories';


export default function MenuPage() {
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
      setError(err.message || 'Không thể kết nối đến máy chủ lấy danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Banner / Title */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full">
            Specialty Menu
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-2">
            Thực Đơn Đồ Uống BrewLite
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Chọn món đồ uống yêu thích, tùy biến size & topping và thanh toán không tiền mặt tại quầy.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
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

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cà phê, trà..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/40 shadow-sm"
            />
          </form>
        </div>

        {/* Content States */}
        {loading ? (
          /* Loading State: 6 Skeleton cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200/80 p-4 space-y-3 animate-pulse"
              >
                <div className="h-40 bg-stone-200 rounded-xl w-full" />
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
            <p className="text-xs text-stone-500 mb-6">
              Không có sản phẩm nào thuộc bộ lọc này hoặc theo từ khóa &ldquo;{searchQuery}&rdquo;.
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
      </main>

      {/* Product Customizer Modal (Task 4) */}
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
