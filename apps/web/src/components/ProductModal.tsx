'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { Product, SelectedTopping } from '@/types';
import { useCartStore } from '@/stores/cartStore';

const SIZE_LABELS: Record<'S' | 'M' | 'L', string> = {
  S: 'Nhỏ (S)',
  M: 'Vừa (M)',
  L: 'Lớn (L)',
};

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const [qty, setQty] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (product) {
      setSelectedSize('S');
      setSelectedToppings([]);
      setQty(1);
      setAddedSuccess(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Tính phụ thu kích cỡ theo cấu hình của món
  const sizeExtra = product.sizeOptions.find((s) => s.size === selectedSize)?.extraPrice ?? 0;

  // Tính phụ thu topping
  const toppingsExtra = selectedToppings.reduce((acc, t) => acc + t.price, 0);

  // Đơn giá 1 cốc và tổng tiền theo số lượng
  const unitPrice = product.price + sizeExtra + toppingsExtra;
  const totalPrice = unitPrice * qty;

  const handleToggleTopping = (topping: { id: string; name: string; price: number }) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedToppings, qty);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md text-stone-600 hover:text-stone-900 shadow-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Product Hero Image */}
          <div className="relative h-56 w-full bg-stone-100 overflow-hidden">
            {/* URL ngoài (Unsplash), kích thước cố định bằng CSS */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 text-white">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-700/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-1">
                {product.category}
              </span>
              <h2 className="text-xl font-black drop-shadow-sm">{product.name}</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description & Base Price */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold text-stone-500">Giá cơ bản (Size S)</span>
                <span className="text-lg font-extrabold text-amber-900">
                  {Number(product.price).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/60">
                {product.description}
              </p>
            </div>

            {/* 1. Chọn Size (Kích cỡ) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Chọn kích cỡ (Size)</span>
                  <span className="text-[10px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full font-bold">
                    Bắt buộc
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {product.sizeOptions.map((s) => {
                  const isSelected = selectedSize === s.size;
                  return (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setSelectedSize(s.size)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-amber-700 bg-amber-50/70 text-amber-900 shadow-sm ring-2 ring-amber-700/20'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{SIZE_LABELS[s.size]}</span>
                      <span className="text-[11px] font-semibold text-stone-500 mt-0.5">
                        {s.extraPrice === 0
                          ? 'Giá gốc'
                          : `+${s.extraPrice.toLocaleString('vi-VN')}đ`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Chọn Topping */}
            {product.toppingOptions && product.toppingOptions.length > 0 && (
              <div>
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2.5">
                  2. Thêm Topping & Thành phần
                </label>
                <div className="space-y-2">
                  {product.toppingOptions.map((top) => {
                    const isChecked = selectedToppings.some((t) => t.id === top.id);
                    return (
                      <div
                        key={top.id}
                        onClick={() => handleToggleTopping(top)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'border-amber-700/60 bg-amber-50/60 text-amber-950 font-bold'
                            : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                              isChecked
                                ? 'bg-amber-800 border-amber-800 text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold">{top.name}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-800">
                          +{top.price.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/80 backdrop-blur-md flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-stone-300 rounded-xl bg-white shadow-sm">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="p-2.5 text-stone-600 hover:text-stone-900 transition"
              title="Giảm"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-stone-900">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="p-2.5 text-stone-600 hover:text-stone-900 transition"
              title="Tăng"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={addedSuccess}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-brew-float transition flex items-center justify-center gap-2 ${
              addedSuccess
                ? 'bg-emerald-600 scale-[0.98]'
                : 'bg-amber-800 hover:bg-amber-900 active:scale-[0.99]'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã thêm vào giỏ!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Thêm vào giỏ • {totalPrice.toLocaleString('vi-VN')} đ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
