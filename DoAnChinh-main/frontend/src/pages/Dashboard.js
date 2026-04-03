import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Package, Clock } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/orders`, { withCredentials: true });
      setOrders(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching orders:', error);
      toast.error('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-[#30D158]';
      case 'pending':
        return 'text-[#FFD60A]';
      case 'shipped':
        return 'text-[#64D2FF]';
      case 'delivered':
        return 'text-[#30D158]';
      default:
        return 'text-[#A1A1A6]';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-[#A1A1A6]">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <h1 className="text-4xl sm:text-5xl tracking-tighter font-medium mb-8" data-testid="dashboard-title">Đơn Hàng Của Tôi</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16" data-testid="no-orders-message">
            <Package size={64} className="text-[#A1A1A6] mx-auto mb-4" />
            <p className="text-[#A1A1A6] text-lg mb-6">Bạn chưa có đơn hàng nào</p>
            <a href="/products" className="btn-primary" data-testid="start-shopping-button">
              Bắt Đầu Mua Sắm
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6" data-testid={`order-${order.order_id}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm text-[#A1A1A6] mb-1">Mã đơn hàng</p>
                    <p className="font-mono text-sm" data-testid={`order-id-${order.order_id}`}>{order.order_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#A1A1A6] mb-1">Trạng thái</p>
                    <p className={`font-semibold ${getStatusColor(order.status)}`} data-testid={`order-status-${order.order_id}`}>
                      {getStatusText(order.status)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {order.items.map((item) => (
                    <div key={`${item.product_id || item.product_name}-${item.variant.storage}-${item.variant.color}`} className="flex justify-between items-center py-2" data-testid={`order-item-${item.product_name}`}>
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-[#A1A1A6]">
                          {item.variant.storage} - {item.variant.color} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-[#A1A1A6]">
                    <Clock size={16} />
                    {new Date(order.created_at).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#A1A1A6] mb-1">Tổng cộng</p>
                    <p className="text-2xl font-semibold" data-testid={`order-total-${order.order_id}`}>${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}