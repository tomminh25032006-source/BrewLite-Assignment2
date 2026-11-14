'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  CheckCircle2,
  AlertCircle,
  Coffee,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/services/api';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const { items, updateQty, removeItem, clearCart, getSubtotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const subtotal = getSubtotal();
  const appliedCode = appliedVoucher?.code;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Giỏ hàng thay đổi thì hỏi lại backend số tiền giảm (mã có thể không còn đủ điều kiện)
  useEffect(() => {
    if (!appliedCode) return;
    let cancelled = false;
    api
      .quotePromotion(appliedCode, subtotal)
      .then((quote) => {
        if (!cancelled) setAppliedVoucher({ code: quote.code, discount: quote.discountAmount });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setAppliedVoucher(null);
          setVoucherError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appliedCode, subtotal]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-stone-500">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);
    const code = voucherCode.trim();
    if (!code) return;

    setApplyingVoucher(true);
    try {
      const quote = await api.quotePromotion(code, subtotal);
      setAppliedVoucher({ code: quote.code, discount: quote.discountAmount });
    } catch (err) {
      setAppliedVoucher(null);
      setVoucherError(err instanceof Error ? err.message : 'Mã ưu đãi không hợp lệ hoặc đã hết hạn');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleCheckoutClick = () => {
    // Lưu mã trước khi kiểm tra đăng nhập: popup đăng nhập chuyển thẳng sang /checkout
    if (appliedVoucher) {
      sessionStorage.setItem('brewlite_applied_voucher', appliedVoucher.code);
    } else {
      sessionStorage.removeItem('brewlite_applied_voucher');
    }
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // Chuyển sang trang thanh toán không tiền mặt (Checkout)
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Breadcrumb / Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tiếp tục chọn đồ uống</span>
            </Link>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">
              Giỏ Hàng Của Bạn
            </h1>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-stone-400 hover:text-red-600 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn sạch giỏ</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center max-w-md mx-auto my-12 shadow-brew-card">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-stone-900 mb-1">
              Giỏ hàng của bạn đang trống
            </h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Bạn chưa chọn món đồ uống nào. Hãy duyệt thực đơn và chọn món cà phê yêu thích nhé!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-brew-float transition"
            >
              <span>Xem thực đơn ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm flex gap-4 items-start"
                >
                  {/* Item Image: URL ngoài (Unsplash), kích thước cố định bằng CSS */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover border border-stone-100 flex-shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-sm text-stone-900 truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-300 hover:text-red-600 p-1 transition"
                        title="Xóa món"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                        Size {item.size}
                      </span>
                      {item.toppings.length > 0 && (
                        <span className="text-[11px] text-amber-800 font-medium truncate">
                          +{item.toppings.map((t) => t.name).join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Price and Counter */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-black text-amber-900">
                        {(item.unitPrice * item.qty).toLocaleString('vi-VN')} đ
                      </span>

                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50/50">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="p-1.5 text-stone-500 hover:text-stone-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-stone-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="p-1.5 text-stone-500 hover:text-stone-900"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Summary & Voucher */}
            <div className="lg:col-span-5 space-y-4">
              {/* Voucher Box */}
              <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-stone-900 font-bold text-xs uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-amber-700" />
                  <span>Mã khuyến mãi & Ưu đãi</span>
                </div>

                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã, ví dụ BREW10"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  />
                  <button
                    type="submit"
                    disabled={applyingVoucher}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {applyingVoucher ? 'Đang kiểm tra…' : 'Áp dụng'}
                  </button>
                </form>

                {voucherError && (
                  <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{voucherError}</span>
                  </p>
                )}

                {appliedVoucher && (
                  <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mã &ldquo;{appliedVoucher.code}&rdquo; đã áp dụng!
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedVoucher(null)}
                      className="text-stone-400 hover:text-stone-700 text-[10px]"
                    >
                      Bỏ
                    </button>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>Gợi ý: Thử mã &ldquo;BREW10&rdquo; (Giảm 10%)</span>
                </div>
              </div>

              {/* Order Calculation Summary */}
              <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-brew-card space-y-3">
                <h3 className="font-extrabold text-stone-900 text-sm pb-2 border-b border-stone-100">
                  Tóm tắt chi phí
                </h3>

                <div className="flex justify-between text-xs text-stone-600">
                  <span>Tạm tính tiền món</span>
                  <span className="font-bold text-stone-900">
                    {subtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {appliedVoucher && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Khuyến mãi ({appliedVoucher.code})</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-stone-600">
                  <span>Hình thức phục vụ</span>
                  <span className="font-semibold text-stone-800">Nhận nước tại quầy</span>
                </div>

                <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-extrabold text-stone-900 block">
                      Tổng thanh toán
                    </span>
                    <span className="text-[10px] text-stone-400">Đã bao gồm thuế phí</span>
                  </div>
                  <span className="text-xl font-black text-amber-900">
                    {finalTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  className="w-full mt-4 py-3.5 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white font-extrabold text-sm shadow-brew-float transition flex items-center justify-center gap-2"
                >
                  <span>Tiến hành Thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal if user is not logged in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => router.push('/checkout')}
      />

      {/* Commercial F&B Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-16 text-center text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
