'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Tài khoản demo điền sẵn khi bấm "Điền nhanh" (mặc định là khách hàng mẫu)
  demoEmail?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  demoEmail = 'customer@brewlite.vn',
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginAction = useAuthStore((state) => state.login);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await api.login({ email, password });
        loginAction(res.accessToken, res.user);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const res = await api.register({ email, password, fullName });
        loginAction(res.accessToken, res.user);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Thao tác không thành công, vui lòng kiểm tra lại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginTest = () => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-stone-100 text-center">
          <h3 className="text-xl font-extrabold text-stone-900">
            {tab === 'login' ? 'Đăng nhập vào BrewLite' : 'Tạo tài khoản BrewLite mới'}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Đặt đồ uống không dùng tiền mặt và tích lũy điểm thưởng thành viên
          </p>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-xl mt-5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                tab === 'login'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                tab === 'register'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Mật khẩu (Tối thiểu 6 ký tự)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : tab === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
          </button>

          {/* Quick Fill Test Account */}
          <div className="pt-2 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={handleQuickLoginTest}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 underline flex items-center justify-center gap-1 mx-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
              Điền nhanh tài khoản dùng thử (Demo Account)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
