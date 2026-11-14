'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Smartphone,
  Wallet,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { Order } from '@/types';

type PaymentMethodType = 'MOMO' | 'VNPAY' | 'CARD';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('MOMO');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Đơn PENDING/PAYMENT_FAILED đã tạo trên server; số tiền hiển thị lấy theo đơn này
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  // Idempotency-Key của lần thanh toán đang thực hiện: giữ nguyên khi gửi lại sau lỗi mạng,
  // chỉ sinh key mới khi cổng thanh toán đã trả kết quả thất bại
  const [paymentKey, setPaymentKey] = useState<string | null>(null);

  // Mã giảm giá chọn ở giỏ hàng; số tiền giảm dự kiến do backend tính (GET /api/promotions/:code)
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | undefined>(undefined);
  const [discount, setDiscount] = useState(0);

  const { items, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated, user, updateLoyaltyPoints } = useAuthStore();
  const subtotal = getSubtotal();

  useEffect(() => {
    setMounted(true);
    setAppliedVoucherCode(sessionStorage.getItem('brewlite_applied_voucher') || undefined);
  }, []);

  useEffect(() => {
    if (!appliedVoucherCode) {
      setDiscount(0);
      return;
    }
    let cancelled = false;
    api
      .quotePromotion(appliedVoucherCode, subtotal)
      .then((quote) => {
        if (!cancelled) setDiscount(quote.discountAmount);
      })
      .catch(() => {
        // Mã không còn hợp lệ: tạo đơn sẽ báo lỗi cụ thể từ backend
        if (!cancelled) setDiscount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedVoucherCode, subtotal]);

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto p-8 my-16 bg-white rounded-2xl border text-center shadow-sm">
          <Lock className="w-10 h-10 text-amber-700 mx-auto mb-3" />
          <h2 className="text-base font-bold text-stone-900 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-xs text-stone-600 mb-6">
            Bạn cần đăng nhập tài khoản thành viên để hoàn tất thanh toán không tiền mặt.
          </p>
          <Link
            href="/cart"
            className="px-5 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs"
          >
            Quay lại Giỏ hàng
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !pendingOrder) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto p-8 my-16 bg-white rounded-2xl border text-center shadow-sm">
          <p className="text-sm font-semibold text-stone-700 mb-4">
            Giỏ hàng của bạn đang trống!
          </p>
          <Link
            href="/menu"
            className="px-5 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs"
          >
            Xem Thực đơn
          </Link>
        </div>
      </div>
    );
  }

  const estimatedAmount = Math.max(0, subtotal - discount);
  // Sau khi tạo đơn, luôn hiển thị số tiền backend tính (đó là số tiền thực trừ)
  const payAmount = pendingOrder ? pendingOrder.finalAmount : estimatedAmount;
  const shownDiscount = pendingOrder ? pendingOrder.discountAmount : discount;

  const handlePay = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      let order = pendingOrder;

      // Bước 1: Tạo đơn hàng PENDING nếu chưa có
      if (!order) {
        const orderPayload = {
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            toppingIds: item.toppings.map((t) => t.id),
            qty: item.qty,
          })),
          promotionCode: appliedVoucherCode,
        };

        const createdOrder: Order = await api.createOrder(orderPayload);
        order = createdOrder;
        setPendingOrder(createdOrder);

        // Không trừ tiền khác với số khách vừa thấy: báo số mới và chờ khách xác nhận lại
        if (createdOrder.finalAmount !== estimatedAmount) {
          setError(
            `Tổng tiền đã được cập nhật theo bảng giá hiện tại: ${createdOrder.finalAmount.toLocaleString('vi-VN')} đ. Vui lòng kiểm tra và bấm xác nhận lại.`,
          );
          return;
        }
      }

      // Bước 2: Thanh toán không tiền mặt với Idempotency-Key
      const idempotencyKey =
        paymentKey ??
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `idemp_cli_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`);
      setPaymentKey(idempotencyKey);
      const paymentRes = await api.processPayment({
        orderId: order.id,
        method: selectedMethod,
        amount: order.finalAmount,
        idempotencyKey,
        simulateFailure,
      });

      if (paymentRes.status === 'SUCCESS') {
        setPaymentKey(null);
        // Thanh toán thành công -> Xóa giỏ hàng, cập nhật điểm, chuyển trang xác nhận
        clearCart();
        sessionStorage.removeItem('brewlite_applied_voucher');
        if (paymentRes.totalLoyaltyPoints !== undefined) {
          updateLoyaltyPoints(paymentRes.totalLoyaltyPoints);
        }
        router.push(`/orders/${paymentRes.orderId}`);
      } else {
        // Mô phỏng thanh toán lỗi -> Trạng thái PAYMENT_FAILED, giỏ hàng giữ nguyên
        setPaymentKey(null);
        setError(
          'Thanh toán không thành công (Trạng thái đơn: PAYMENT_FAILED). Giỏ hàng của bạn được bảo lưu. Bạn có thể thanh toán lại hoặc hủy đơn.',
        );
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Hủy đơn chưa thanh toán (luồng ngoại lệ 2 của use-case): đơn → CANCELLED, giỏ hàng giữ nguyên
  const handleCancel = async () => {
    if (!pendingOrder) return;
    setCancelling(true);
    try {
      await api.cancelOrder(pendingOrder.id);
      setNotice(
        `Đã hủy đơn #${pendingOrder.orderCode}. Giỏ hàng vẫn được giữ, bạn có thể chỉnh sửa và đặt lại.`,
      );
      setPendingOrder(null);
      setPaymentKey(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Giỏ hàng</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Thanh Toán Không Tiền Mặt
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Chọn phương thức thanh toán an toàn, xác nhận đơn và nhận đồ uống tại quầy.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Thông báo lỗi:</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {notice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>{notice}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Order Snapshot Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider mb-3">
              Thông tin đơn đặt
            </h3>
            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="font-bold text-stone-900">{user?.fullName} ({user?.email})</span>
              </div>
              <div className="flex justify-between">
                <span>Số lượng cốc:</span>
                <span className="font-bold text-stone-900">
                  {items.reduce((s, i) => s + i.qty, 0)} cốc
                </span>
              </div>
              {pendingOrder && (
                <div className="flex justify-between">
                  <span>Mã đơn:</span>
                  <span className="font-bold text-stone-900">#{pendingOrder.orderCode}</span>
                </div>
              )}
              {appliedVoucherCode && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Ưu đãi áp dụng:</span>
                  <span>Mã {appliedVoucherCode} (-{shownDiscount.toLocaleString('vi-VN')} đ)</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-stone-100 items-baseline">
                <span className="font-bold text-stone-900 text-sm">Tổng cần thanh toán:</span>
                <span className="text-xl font-black text-amber-900">
                  {payAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider mb-4">
              Chọn phương thức thanh toán
            </h3>

            <div className="space-y-3">
              {/* MoMo */}
              <div
                onClick={() => setSelectedMethod('MOMO')}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition select-none ${
                  selectedMethod === 'MOMO'
                    ? 'border-pink-600 bg-pink-50/50 shadow-sm ring-2 ring-pink-600/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    MoMo
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-stone-900">Ví Điện Tử MoMo</h4>
                    <p className="text-[11px] text-stone-500">
                      Mô phỏng quét mã QR hoặc liên kết ví tức thì
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === 'MOMO'
                      ? 'border-pink-600 bg-pink-600'
                      : 'border-stone-300'
                  }`}
                >
                  {selectedMethod === 'MOMO' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>

              {/* VNPay */}
              <div
                onClick={() => setSelectedMethod('VNPAY')}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition select-none ${
                  selectedMethod === 'VNPAY'
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    VNPay
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-stone-900">Cổng VNPay-QR</h4>
                    <p className="text-[11px] text-stone-500">
                      Hỗ trợ ứng dụng ngân hàng và ví ZaloPay/VNPay
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === 'VNPAY'
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-stone-300'
                  }`}
                >
                  {selectedMethod === 'VNPAY' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>

              {/* Credit / Debit Card */}
              <div
                onClick={() => setSelectedMethod('CARD')}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition select-none ${
                  selectedMethod === 'CARD'
                    ? 'border-amber-700 bg-amber-50/50 shadow-sm ring-2 ring-amber-700/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shadow-sm">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-stone-900">Thẻ Ngân Hàng / Quốc Tế</h4>
                    <p className="text-[11px] text-stone-500">
                      Thẻ ATM Napas, Visa, Mastercard không tiền mặt
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === 'CARD'
                      ? 'border-amber-700 bg-amber-700'
                      : 'border-stone-300'
                  }`}
                >
                  {selectedMethod === 'CARD' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Simulation Dev Options */}
            <details className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              <summary className="cursor-pointer font-semibold text-stone-400 hover:text-stone-600 transition select-none flex items-center gap-1">
                <span>⚙️ Tùy chọn kiểm thử thanh toán</span>
              </summary>
              <div className="mt-2 p-3 bg-stone-50 rounded-xl flex items-center justify-between">
                <span>Mô phỏng giao dịch bị từ chối (thử nghiệm xử lý lỗi mạng)</span>
                <input
                  type="checkbox"
                  id="failToggle"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="w-4 h-4 accent-amber-800 cursor-pointer"
                />
              </div>
            </details>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handlePay}
            disabled={loading || cancelling}
            className="w-full py-4 rounded-2xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white font-black text-sm shadow-brew-float transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý giao dịch qua cổng...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-200" />
                <span>Xác nhận trả {payAmount.toLocaleString('vi-VN')} đ</span>
              </>
            )}
          </button>

          {pendingOrder && (
            <button
              onClick={handleCancel}
              disabled={loading || cancelling}
              className="w-full py-3 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition disabled:opacity-50"
            >
              {cancelling ? 'Đang hủy đơn...' : `Hủy đơn #${pendingOrder.orderCode}`}
            </button>
          )}
        </div>
      </main>

      {/* Commercial F&B Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-16 text-center text-xs text-stone-500">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-800 text-white flex items-center justify-center font-black text-xs">
              B
            </div>
            <span className="font-extrabold text-stone-900 text-sm">BrewLite Coffee Roasters</span>
          </div>
          <p className="font-medium text-stone-500">
            Hệ thống thanh toán bảo mật không tiền mặt
          </p>
          <div className="text-stone-400 font-semibold">
            Hotline: 1900 6868 • 07:00 - 22:30
          </div>
        </div>
      </footer>
    </div>
  );
}
