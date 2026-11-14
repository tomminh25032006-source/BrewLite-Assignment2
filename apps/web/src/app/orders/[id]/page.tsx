'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Coffee,
  RefreshCw,
  AlertCircle,
  Check,
  ChefHat,
  Bell,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { api } from '@/services/api';
import { Order, OrderStatus } from '@/types';

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'PENDING', label: 'Đã nhận đơn', icon: Clock },
  { status: 'PAID', label: 'Đã thanh toán', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Đang chuẩn bị', icon: ChefHat },
  { status: 'READY', label: 'Sẵn sàng lấy nước', icon: Bell },
  { status: 'COMPLETED', label: 'Hoàn tất', icon: Coffee },
];

// FR-07: tự tải lại trạng thái để khách thấy ngay khi barista báo đồ uống sẵn sàng
const POLL_INTERVAL_MS = 5000;
const FINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED'];

const STATUS_BADGES: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  PAID: 'Thanh toán thành công',
  PREPARING: 'Đang chuẩn bị món',
  READY: 'Đồ uống đã sẵn sàng',
  COMPLETED: 'Đã hoàn tất đơn hàng',
  CANCELLED: 'Đơn hàng đã hủy',
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // silent = true khi tự tải lại định kỳ: không hiện spinner, không ghi đè lỗi
  const fetchOrder = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        const data = await api.getOrderById(orderId);
        setOrder(data);
      } catch (err: any) {
        if (!silent) {
          setError(err.message || 'Không thể tải chi tiết đơn hàng');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [orderId],
  );

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const status = order?.status;
  useEffect(() => {
    if (!status || FINAL_STATUSES.includes(status)) return;
    const timer = setInterval(() => fetchOrder(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [status, fetchOrder]);

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'PAID':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10 flex-1 w-full">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border shadow-sm my-10">
            <RefreshCw className="w-8 h-8 text-amber-800 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-stone-600">Đang tải thông tin đơn hàng...</p>
          </div>
        ) : error || !order ? (
          <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-200 text-red-800 my-10">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-xs font-bold">{error || 'Không tìm thấy đơn hàng'}</p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-bold"
            >
              Về Trang Chủ
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Commercial Confirmation Card */}
            <div className="bg-white rounded-3xl border border-stone-200/90 p-8 text-center shadow-brew-card">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {STATUS_BADGES[order.status]}
              </span>

              <h1 className="text-2xl font-black text-stone-900 mt-2 mb-1">
                {order.status === 'CANCELLED'
                  ? 'Đơn Hàng Đã Hủy'
                  : order.status === 'PENDING' || order.status === 'PAYMENT_FAILED'
                  ? 'Đơn Hàng Chưa Thanh Toán'
                  : 'Đặt Hàng Thành Công!'}
              </h1>

              <div className="inline-block my-3 px-4 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs text-stone-500 font-medium">Mã đơn hàng: </span>
                <span className="text-sm font-black text-amber-900">#{order.orderCode}</span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto font-medium">
                Cảm ơn bạn đã trải nghiệm đặt món tại BrewLite. Vui lòng tới quầy Barista đọc mã đơn khi đồ uống sẵn sàng.
              </p>
            </div>

            {/* Order Progress Timeline */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
              <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider mb-6 flex items-center justify-between">
                <span>Tiến trình phục vụ</span>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                  Cập nhật liên tục
                </span>
              </h3>

              <div className="relative flex justify-between items-center px-2">
                {/* Connecting background bar */}
                <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-stone-100 -z-0" />
                <div
                  className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                  style={{
                    width: `${(getStepIndex(order.status) / (TIMELINE_STEPS.length - 1)) * 100}%`,
                  }}
                />

                {TIMELINE_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(order.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center z-10 select-none text-center"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100'
                            : 'bg-white border-2 border-stone-300 text-stone-400'
                        } ${isCurrent ? 'scale-110 ring-emerald-200' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] mt-2 font-bold max-w-[65px] truncate ${
                          isDone ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
              <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider mb-4">
                Danh sách đồ uống đã đặt
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{item.productName}</span>
                      <span className="text-stone-500 ml-1.5 font-medium">
                        (Size {item.size} x{item.qty})
                      </span>
                    </div>
                    <span className="font-bold text-stone-900">
                      {Number(item.lineTotal).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}

                <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-stone-900">Tổng thanh toán:</span>
                  <span className="font-black text-amber-900 text-base">
                    {Number(order.finalAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex gap-3 justify-center pt-2">
              <Link
                href="/"
                className="flex-1 py-3 text-center rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md transition"
              >
                Về Trang Chủ Đặt Thêm
              </Link>
              <Link
                href="/orders"
                className="flex-1 py-3 text-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border transition"
              >
                Xem Lịch Sử Đơn
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Commercial F&B Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-16 text-center text-xs text-stone-500">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
