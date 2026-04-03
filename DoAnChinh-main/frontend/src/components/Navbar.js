import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, List, X } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="text-2xl font-medium tracking-tight" data-testid="nav-logo">
            Cửa Hàng iPhone
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/products" className="text-[#A1A1A6] hover:text-white transition-colors" data-testid="nav-products">
              Sản Phẩm
            </Link>
            {user && (
              <Link to="/dashboard" className="text-[#A1A1A6] hover:text-white transition-colors" data-testid="nav-dashboard">
                Đơn Hàng Của Tôi
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-[#A1A1A6] hover:text-white transition-colors" data-testid="nav-admin">
                Quản Trị
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user && (
              <Link to="/cart" className="relative" data-testid="nav-cart-button">
                <ShoppingCart size={24} className="text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center" data-testid="cart-count-badge">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <p className="text-white font-medium" data-testid="nav-user-name">{user.name}</p>
                </div>
                <button onClick={handleLogout} className="btn-secondary text-sm" data-testid="nav-logout-button">
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary text-sm" data-testid="nav-login-button">
                  Đăng Nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm" data-testid="nav-register-button">
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10" data-testid="mobile-menu">
            <div className="flex flex-col gap-4">
              <Link to="/products" className="text-[#A1A1A6] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Sản Phẩm
              </Link>
              {user && (
                <>
                  <Link to="/dashboard" className="text-[#A1A1A6] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Đơn Hàng Của Tôi
                  </Link>
                  <Link to="/cart" className="text-[#A1A1A6] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Giỏ Hàng ({cartCount})
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-[#A1A1A6] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Quản Trị
                </Link>
              )}
              {user ? (
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn-secondary text-sm text-left">
                  Đăng Xuất
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm" onClick={() => setMobileMenuOpen(false)}>
                    Đăng Nhập
                  </Link>
                  <Link to="/register" className="btn-primary text-sm" onClick={() => setMobileMenuOpen(false)}>
                    Đăng Ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}