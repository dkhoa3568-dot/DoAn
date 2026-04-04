import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Package, Users, CurrencyDollar } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = "https://doan-urzg.onrender.com";

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/orders`, { withCredentials: true });
      setOrders(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching orders:', error);
      toast.error('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [user, navigate, fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/orders/${orderId}/status?status=${newStatus}`,
        {},
        { withCredentials: true }
      );
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Đang xử lý',
      'confirmed': 'Đã xác nhận',
      'shipped': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      'confirmed': 'bg-[#30D158]/10 text-[#30D158]',
      'pending': 'bg-[#FFD60A]/10 text-[#FFD60A]',
      'shipped': 'bg-[#64D2FF]/10 text-[#64D2FF]',
      'delivered': 'bg-[#30D158]/10 text-[#30D158]'
    };
    return classMap[status] || 'bg-white/10 text-white';
  };

  const totalRevenue = orders
    .filter(o => o.status !== 'pending')
    .reduce((sum, order) => sum + order.total, 0);

  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-[#A1A1A6]">Đang tải trang quản trị...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <h1 className="text-4xl sm:text-5xl tracking-tighter font-medium mb-8" data-testid="admin-title">Bảng Điều Khiển Quản Trị</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6" data-testid="stat-total-orders">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#A1A1A6] text-sm uppercase tracking-wider">TỔNG ĐƠN HÀNG</p>
              <Package size={24} className="text-white" />
            </div>
            <p className="text-4xl font-semibold">{orders.length}</p>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6" data-testid="stat-confirmed-orders">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#A1A1A6] text-sm uppercase tracking-wider">ĐÃ XÁC NHẬN</p>
              <Users size={24} className="text-[#30D158]" />
            </div>
            <p className="text-4xl font-semibold text-[#30D158]">{confirmedOrders}</p>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6" data-testid="stat-revenue">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#A1A1A6] text-sm uppercase tracking-wider">DOANH THU</p>
              <CurrencyDollar size={24} className="text-white" />
            </div>
            <p className="text-4xl font-semibold">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-medium">Tất Cả Đơn Hàng</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-[#A1A1A6] uppercase tracking-wider">Mã ĐH</th>
                  <th className="text-left p-4 text-sm font-medium text-[#A1A1A6] uppercase tracking-wider">Ngày</th>
                  <th className="text-left p-4 text-sm font-medium text-[#A1A1A6] uppercase tracking-wider">SP</th>
                  <th className="text-left p-4 text-sm font-medium text-[#A1A1A6] uppercase tracking-wider">Tổng</th>
                  <th className="text-left p-4 text-sm font-medium text-[#A1A1A6] uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left p-4 text-sm font-medium text-[#A1A1A6] uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id} className="border-b border-white/10 hover:bg-white/5" data-testid={`admin-order-${order.order_id}`}>
                    <td className="p-4 font-mono text-sm" data-testid={`admin-order-id-${order.order_id}`}>{order.order_id}</td>
                    <td className="p-4 text-sm text-[#A1A1A6]">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-sm">{order.items.length} sản phẩm</td>
                    <td className="p-4 font-semibold" data-testid={`admin-order-total-${order.order_id}`}>${order.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`} data-testid={`admin-order-status-${order.order_id}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none focus:border-white"
                        data-testid={`admin-status-select-${order.order_id}`}
                      >
                        <option value="pending">Đang xử lý</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="shipped">Đang giao</option>
                        <option value="delivered">Đã giao</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}