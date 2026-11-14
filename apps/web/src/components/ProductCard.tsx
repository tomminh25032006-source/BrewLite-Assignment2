'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '@/types';
import { CATEGORY_LABELS } from '@/lib/categories';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-brew-card hover:shadow-brew-float transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
    >
      <div>
        {/* Product Image */}
        <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
          {/* URL ngoài (Unsplash), kích thước cố định bằng CSS */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-amber-900 shadow-sm uppercase tracking-wider">
            {CATEGORY_LABELS[product.category]}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-extrabold text-stone-900 text-sm group-hover:text-amber-800 transition line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer / Price and CTA */}
      <div className="px-4 pb-4 pt-0 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-stone-400 font-semibold block uppercase">Giá từ</span>
          <span className="text-sm font-black text-amber-900">
            {Number(product.price).toLocaleString('vi-VN')} đ
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Chọn</span>
        </button>
      </div>
    </div>
  );
}
