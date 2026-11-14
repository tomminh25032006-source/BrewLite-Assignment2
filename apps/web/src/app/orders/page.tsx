'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Coffee, ArrowRight, Clock, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { api } from '@/services/api';
import { Order } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { AuthModal } from '@/components/AuthModal';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated, user } = useAuthStore();

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full">
            Lịch sử giao dịch
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight mt-2">
            Đơn Hàng Của Bạn
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Theo dõi tất cả đơn hàng đã thanh toán không tiền mặt và tích lũy điểm thưởng.
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center max-w-md mx-auto shadow-brew-card">
            <Coffee className="w-12 h-12 text-amber-800 mx-auto mb-3" />
            <h3 className="font-extrabold text-stone-900 text-base mb-1">
              Bạn chưa đăng nhập
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Vui lòng đăng nhập tài khoản để xem lịch sử đơn hàng và quyền lợi thành viên.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition shadow-sm"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border p-5 animate-pulse space-y-3"
              >
                <div className="h-4 bg-stone-200 rounded w-1/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
                <div className="h-4 bg-stone-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-xs font-bold">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center max-w-md mx-auto shadow-brew-card">
            <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="font-extrabold text-stone-900 text-base mb-1">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Bạn chưa thực hiện đơn đặt đồ uống nào. Hãy ghé menu thử món nhé!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition shadow-sm"
            >
              <span>Xem Thực Đơn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-stone-900">
                      #{ord.orderCode}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        ord.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ord.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ord.status === 'PAYMENT_FAILED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500">
                    {ord.items.map((i) => `${i.productName} (x${i.qty})`).join(', ')}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-stone-400 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ord.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <span className="text-base font-black text-amber-900">
                    {Number(ord.finalAmount).toLocaleString('vi-VN')} đ
                  </span>
                  <Link
                    href={`/orders/${ord.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 underline"
                  >
                    <span>Chi tiết & Tiến trình</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={fetchOrders}
      />

      {/* Commercial F&B Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-16 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-800 text-white flex items-center justify-center font-black text-xs">
              B
            </div>
            <span className="font-extrabold text-stone-900 text-sm">BrewLite Coffee Roasters</span>
          </div>
          <p className="font-medium text-stone-500">
            Lịch sử giao dịch &amp; điểm tích lũy thành viên
          </p>
          <div className="text-stone-400 font-semibold">
            Hotline: 1900 6868 • 07:00 - 22:30
          </div>
        </div>
      </footer>
    </div>
  );
}
