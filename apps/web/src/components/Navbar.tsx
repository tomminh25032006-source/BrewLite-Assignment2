'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Coffee, ShoppingBag, User as UserIcon, LogOut, Award, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { AuthModal } from '@/components/AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, isAuthenticated, logout } = useAuthStore();

  // Phần thực đơn trên trang chủ đang hiện trên màn hình -> gạch chân "Thực đơn"
  const [menuInView, setMenuInView] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      setMenuInView(false);
      return;
    }
    const updateActiveSection = () => {
      const menuSection = document.getElementById('menu-section');
      // 120px = chiều cao header sticky + khoảng đệm
      setMenuInView(!!menuSection && menuSection.getBoundingClientRect().top <= 120);
    };
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, [pathname]);

  const isHomeActive = pathname === '/' && !menuInView;
  const isMenuActive = pathname === '/menu' || (pathname === '/' && menuInView);

  const handleScrollToTop = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
    }
  };

  const handleScrollToMenu = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (pathname === '/') {
      const menuSection = document.getElementById('menu-section');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 450, behavior: 'smooth' });
      }
    } else {
      router.push('/#menu-section');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo with Smooth Scroll to Top */}
          <Link
            href="/"
            onClick={handleScrollToTop}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 flex items-center justify-center shadow-md group-hover:scale-105 transition duration-200">
              <Coffee className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-stone-900 leading-none block">
                Brew<span className="text-amber-700">Lite</span>
              </span>
              <span className="text-[10px] text-stone-500 font-semibold tracking-wider uppercase">
                Specialty Coffee
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Independent Text-Links with Refined Hover) */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={handleScrollToTop}
              className={`text-sm font-semibold transition-colors duration-200 relative py-1 hover:text-amber-800 cursor-pointer ${
                isHomeActive
                  ? 'text-amber-800 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-amber-800'
                  : 'text-stone-600 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-amber-800/80 after:transition-all after:duration-200'
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={handleScrollToMenu}
              className={`text-sm font-semibold transition-colors duration-200 relative py-1 hover:text-amber-800 cursor-pointer ${
                isMenuActive
                  ? 'text-amber-800 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-amber-800'
                  : 'text-stone-600 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-amber-800/80 after:transition-all after:duration-200'
              }`}
            >
              Thực đơn
            </button>
            <Link
              href="/orders"
              className={`text-sm font-semibold transition-colors duration-200 relative py-1 hover:text-amber-800 cursor-pointer ${
                pathname.startsWith('/orders')
                  ? 'text-amber-800 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-amber-800'
                  : 'text-stone-600 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-amber-800/80 after:transition-all after:duration-200'
              }`}
            >
              Lịch sử đơn
            </Link>
          </nav>

          {/* Right Actions: Auth & Cart */}
          <div className="flex items-center gap-3">
            {/* User Account / Login */}
            {mounted && isAuthenticated && user ? (
              <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 pl-3 pr-2 py-1.5 rounded-xl">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-stone-900 truncate max-w-[120px]">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 justify-end">
                    <Award className="w-3 h-3 text-amber-600" />
                    {user.loyaltyPoints} điểm
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Cart Button with Animated Badge */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-md transition hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-amber-200" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {mounted && totalItems > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 md:hidden rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-2">
            <button
              onClick={(e) => {
                handleScrollToTop(e);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-stone-700 hover:text-amber-800"
            >
              Trang chủ
            </button>
            <button
              onClick={(e) => {
                handleScrollToMenu(e);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-stone-700 hover:text-amber-800"
            >
              Thực đơn
            </button>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-stone-700 hover:text-amber-800"
            >
              Lịch sử đơn
            </Link>
            {!isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-amber-800 border-t border-stone-100 pt-3"
              >
                Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal Popup */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
