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

      // 🔥 lấy token (QUAN TRỌNG)
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `${API_URL}/api/checkout`,
        { origin_url: originUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Checkout:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Không nhận được link thanh toán");
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Checkout thất bại");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl mb-8">Giỏ Hàng</h1>

        {cart.length === 0 ? (
          <div className="text-center">
            <p>Giỏ hàng trống</p>
            <button onClick={() => navigate('/products')}>
              Mua ngay
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* CART LIST */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map(item => (
                <div key={item.cart_item_id} className="p-4 border rounded">
                  <h3>{item.product_name}</h3>
                  <p>${item.variant.price}</p>

                  <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}>+</button>
                  <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}>-</button>
                  <button onClick={() => removeFromCart(item.cart_item_id)}>Xóa</button>
                </div>
              ))}
            </div>

            {/* SUMMARY */}
            <div>
              <h2>Tổng: ${cartTotal}</h2>

              <button onClick={handleCheckout}>
                Thanh toán
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}