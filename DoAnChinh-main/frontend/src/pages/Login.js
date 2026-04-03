import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Đăng nhập thành công');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 pt-20" data-testid="login-page">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-medium tracking-tight mb-2" data-testid="login-title">Chào Mừng Trở Lại</h1>
          <p className="text-[#A1A1A6]">Đăng nhập để tiếp tục mua sắm</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition-colors"
                placeholder="email@example.com"
                required
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Mật Khẩu</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition-colors"
                placeholder="••••••••"
                required
                data-testid="login-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
              data-testid="login-submit-button"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0A0A0A] text-[#A1A1A6]">HOẶC</span>
            </div>
          </div>

          <button
            onClick={loginWithGoogle}
            className="btn-secondary w-full"
            data-testid="google-login-button"
          >
            Tiếp Tục Với Google
          </button>

          <p className="text-center text-sm text-[#A1A1A6] mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-white font-medium hover:underline" data-testid="register-link">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}