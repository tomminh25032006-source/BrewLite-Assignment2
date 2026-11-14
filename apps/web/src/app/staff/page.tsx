'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Bell,
  Check,
  RefreshCw,
  Coffee,
  Clock,
  ArrowLeft,
  AlertCircle,
  Filter,
  Lock,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { AuthModal } from '@/components/AuthModal';
import { Order, OrderStatus } from '@/types';

export default function StaffKDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ACTIVE');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { user, logout } = useAuthStore();
  const isStaff = user?.role === 'STAFF';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đơn quầy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // API chỉ trả danh sách đơn cho tài khoản STAFF
  useEffect(() => {
    if (isStaff) {
      fetchOrders();
    }
  }, [isStaff]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      await api.updateOrderStatus(orderId, nextStatus);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (filter === 'ACTIVE') {
      return ord.status === 'PAID' || ord.status === 'PREPARING' || ord.status === 'READY';
    }
    if (filter === 'DONE') {
      return ord.status === 'COMPLETED' || ord.status === 'CANCELLED';
    }
    return true;
  });

  if (!mounted) return null;

  // Màn hình KDS chỉ dành cho nhân viên quầy (vai trò STAFF)
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-stone-950 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black mb-1">BrewLite KDS</h1>
          <p className="text-xs text-stone-400 mb-4">
            Màn hình này chỉ dành cho nhân viên quầy. Vui lòng đăng nhập bằng tài khoản nhân viên.
          </p>
          {user && (
            <p className="text-[11px] text-amber-400 mb-4">
              Đang đăng nhập bằng {user.email} (không phải tài khoản nhân viên)
            </p>
          )}
          <button
            onClick={() => {
              if (user) logout();
              setShowAuthModal(true);
            }}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs transition"
          >
            Đăng nhập tài khoản nhân viên
          </button>
          <Link
            href="/"
            className="block mt-3 text-[11px] text-stone-400 hover:text-white underline"
          >
            Về trang khách hàng
          </Link>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          demoEmail="barista@brewlite.vn"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Barista KDS Header */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-stone-950 flex items-center justify-center font-black">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight">BrewLite KDS</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Kitchen Display System
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                Màn hình điều phối quầy pha chế &amp; trả nước tại quầy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 hover:bg-stone-700 transition"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Khách Hàng</span>
            </Link>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main KDS Board */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'ACTIVE'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Đang chờ &amp; chế biến ({orders.filter((o) => ['PAID', 'PREPARING', 'READY'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setFilter('DONE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'DONE'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Đã hoàn tất ({orders.filter((o) => ['COMPLETED', 'CANCELLED'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'ALL'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Tất cả ({orders.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-400">Đang đồng bộ danh sách đơn hàng quầy...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/40 border border-red-800 text-red-300 p-6 rounded-2xl max-w-md mx-auto text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-24 text-stone-500">
            <Coffee className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold">Không có đơn hàng nào trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((ord) => {
              const isUpdating = updatingId === ord.id;
              const isPaid = ord.status === 'PAID';
              const isPreparing = ord.status === 'PREPARING';
              const isReady = ord.status === 'READY';
              const isCompleted = ord.status === 'COMPLETED';

              return (
                <div
                  key={ord.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                    isPaid
                      ? 'bg-amber-950/30 border-amber-600/60 shadow-lg shadow-amber-950/30'
                      : isPreparing
                      ? 'bg-blue-950/30 border-blue-600/60'
                      : isReady
                      ? 'bg-emerald-950/30 border-emerald-600/60'
                      : 'bg-stone-900 border-stone-800 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                      <div>
                        <span className="text-base font-black text-white">
                          #{ord.orderCode}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(ord.createdAt).toLocaleTimeString('vi-VN')}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          isPaid
                            ? 'bg-amber-500 text-stone-950 animate-pulse'
                            : isPreparing
                            ? 'bg-blue-500 text-white'
                            : isReady
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-700 text-stone-300'
                        }`}
                      >
                        {isPaid
                          ? 'Mới nhận đơn'
                          : isPreparing
                          ? 'Đang pha chế'
                          : isReady
                          ? 'Đã xong nước'
                          : ord.status}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="py-4 space-y-2.5">
                      {ord.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between text-xs font-semibold"
                        >
                          <div>
                            <span className="text-white font-bold">{item.productName}</span>
                            <span className="text-amber-400 ml-1.5 font-bold">
                              Size {item.size}
                            </span>
                            {item.selectedToppings && item.selectedToppings.length > 0 && (
                              <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                                + {item.selectedToppings.map((t: any) => t.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-black text-white px-2 py-0.5 bg-stone-800 rounded-lg">
                            x{item.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Barista Action Footer */}
                  <div className="pt-3 border-t border-stone-800">
                    {isPaid && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                        disabled={isUpdating}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Nhận Đơn &amp; Bắt Đầu Pha Chế</span>
                      </button>
                    )}
                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'READY')}
                        disabled={isUpdating}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Pha Xong &amp; Báo Khách Lấy Nước</span>
                      </button>
                    )}
                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                        disabled={isUpdating}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>Giao Nước Cho Khách (Hoàn Tất)</span>
                      </button>
                    )}
                    {isCompleted && (
                      <div className="text-center text-[11px] text-emerald-400 font-semibold py-1">
                        ✓ Đơn hàng đã bàn giao hoàn tất
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-800 py-4 text-center text-xs text-stone-500 bg-stone-900">
        <p>BrewLite Kitchen Display System (KDS) • Dành riêng cho Barista &amp; Quầy Thu Ngân</p>
      </footer>
    </div>
  );
}
