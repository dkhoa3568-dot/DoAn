import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://doan-urzg.onrender.com";

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // lấy giỏ hàng
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/cart`, {
          withCredentials: true,
        });
        setCart(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchCart();
  }, []);

  // tính tổng tiền
  const total = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // xử lý checkout
  const handleCheckout = async () => {
    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/api/orders`,
        { items: cart },
        { withCredentials: true }
      );

      alert("Đặt hàng thành công!");
      window.location.href = "/";
    } catch (err) {
      alert("Checkout lỗi!");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Checkout</h2>

      {cart.map((item) => (
        <div key={item._id}>
          <p>{item.name}</p>
          <p>{item.quantity} x {item.price}</p>
        </div>
      ))}

      <h3>Tổng: {total} VND</h3>

      <button onClick={handleCheckout} disabled={loading}>
        {loading ? "Đang xử lý..." : "Thanh toán"}
      </button>
    </div>
  );
};

export default Checkout;