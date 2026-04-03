import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  ususeEffect(() => {
    const sessionId = new URLSearchParams(location.search).get('session_id');
  
    if (!sessionId) {
      navigate('/cart');
      return;
    }
  
    pollPaymentStatus(sessionId, 0);
  }, [location, navigate, pollPaymentStatus]);

  const pollPaymentStatus = useCallback(async (sessionId, attempts) => {
    const maxAttempts = 5;
    const pollInterval = 2000;
  
    if (attempts >= maxAttempts) {
      setChecking(false);
      toast.error('Hết thời gian kiểm tra thanh toán');
      return;
    }
  
    try {
      const { data } = await axios.get(
        `${API_URL}/api/checkout/status/${sessionId}`,
        { withCredentials: true }
      );
  
      if (data.payment_status === 'paid') {
        setPaymentStatus('success');
        setChecking(false);
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        setChecking(false);
        return;
      }
  
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setChecking(false);
      toast.error('Lỗi kiểm tra trạng thái thanh toán');
    }
  }, [API_URL]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-[#A1A1A6]">Đang xác minh thanh toán...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20 px-4" data-testid="order-success-page">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#30D158]/10 mb-6">
            <CheckCircle size={48} className="text-[#30D158]" weight="fill" />
          </div>
          
          <h1 className="text-4xl font-medium tracking-tight mb-4" data-testid="success-title">Đặt Hàng Thành Công!</h1>
          <p className="text-[#A1A1A6] text-lg mb-8">
            Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận và sẽ sớm được giao.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full"
              data-testid="view-orders-button"
            >
              Xem Đơn Hàng Của Tôi
            </button>
            <button
              onClick={() => navigate('/products')}
              className="btn-secondary w-full"
              data-testid="continue-shopping-success"
            >
              Tiếp Tục Mua Sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-medium tracking-tight mb-4">Vấn Đề Thanh Toán</h1>
        <p className="text-[#A1A1A6] text-lg mb-8">
          Có vấn đề khi xử lý thanh toán của bạn. Vui lòng thử lại.
        </p>
        <button onClick={() => navigate('/cart')} className="btn-primary">
          Quay Lại Giỏ Hàng
        </button>
      </div>
    </div>
  );
}