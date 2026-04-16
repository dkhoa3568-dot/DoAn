import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash, Plus, Minus } from '@phosphor-icons/react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { toast } from 'sonner';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, loading } = useCart();
  const navigate = useNavigate();
  const API_URL = "https://doan-urzg.onrender.com";

  const handleCheckout = async () => {
    try {
      const originUrl = window.location.origin;
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API_URL}/api/checkout`,
        { origin_url: originUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      window.location.href = data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể tạo phiên thanh toán');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-[#A1A1A6]">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <h1 className="text-4xl sm:text-5xl tracking-tighter font-medium mb-8" data-testid="cart-title">Giỏ Hàng</h1>

        {cart.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-cart-message">
            <p className="text-[#A1A1A6] text-lg mb-6">Giỏ hàng của bạn đang trống</p>
            <button onClick={() => navigate('/products')} className="btn-primary" data-testid="continue-shopping-button">
              Tiếp Tục Mua Sắm
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.cart_item_id} className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6" data-testid={`cart-item-${item.cart_item_id}`}>
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-medium mb-2" data-testid={`cart-item-name-${item.cart_item_id}`}>{item.product_name}</h3>
                      <p className="text-[#A1A1A6] text-sm mb-4">
                        {item.variant.storage} - {item.variant.color}
                      </p>
                      <p className="text-lg font-semibold mb-4" data-testid={`cart-item-price-${item.cart_item_id}`}>
                        ${item.variant.price.toFixed(2)} mỗi cái
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                            data-testid={`decrease-quantity-${item.cart_item_id}`}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center" data-testid={`cart-item-quantity-${item.cart_item_id}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                            data-testid={`increase-quantity-${item.cart_item_id}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.cart_item_id)}
                          className="text-[#FF3B30] hover:text-[#FF6B65] transition-colors flex items-center gap-2"
                          data-testid={`remove-item-${item.cart_item_id}`}
                        >
                          <Trash size={20} />
                          Xóa
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-semibold" data-testid={`cart-item-subtotal-${item.cart_item_id}`}>
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 sticky top-24" data-testid="cart-summary">
                <h2 className="text-2xl font-medium mb-6">Tóm Tắt Đơn Hàng</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-[#A1A1A6]">Tạm tính</span>
                    <span data-testid="cart-subtotal">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1A6]">Vận chuyển</span>
                    <span className="text-[#30D158]">MIỄN PHÍ</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between text-xl font-semibold">
                    <span>Tổng cộng</span>
                    <span data-testid="cart-total">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full"
                  data-testid="checkout-button"
                >
                  Tiến Hành Thanh Toán
                </button>

                <button
                  onClick={() => navigate('/products')}
                  className="btn-secondary w-full mt-3"
                  data-testid="continue-shopping-from-cart"
                >
                  Tiếp Tục Mua Sắm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 