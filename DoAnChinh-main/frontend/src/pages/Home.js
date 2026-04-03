import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, CreditCard } from '@phosphor-icons/react';
import Lenis from 'lenis';

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505]">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/a4d3fad4-3db0-44f5-a5ce-de38fedecc5b/images/e5eaa33f5e947219e716023e56fbd1f25ba2a54b8bd2cea53fad0b372eba9c91.png"
            alt="Abstract texture"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tighter font-medium mb-6" data-testid="hero-title">
            Trải Nghiệm
            <br />
            <span className="text-[#A1A1A6]">iPhone Đỉnh Cao</span>
          </h1>
          <p className="text-base sm:text-lg text-[#A1A1A6] max-w-2xl mx-auto mb-12 leading-relaxed">
            Khám phá các mẫu iPhone mới nhất với thiết kế titan cao cấp, hệ thống camera tiên tiến và hiệu năng mạnh mẽ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/products" className="btn-primary inline-flex items-center gap-2" data-testid="hero-shop-button">
              Mua Ngay
              <ArrowRight size={20} />
            </Link>
            <Link to="/products" className="btn-secondary" data-testid="hero-explore-button">
              Khám Phá Bộ Sưu Tập
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#050505] to-transparent z-5"></div>
      </section>

      <section className="py-24 bg-[#0A0A0A]" data-testid="featured-products-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#F5F5F7] mb-4">DÒNG SẢN PHẨM HÀNG ĐẦU</p>
            <h2 className="text-3xl sm:text-4xl tracking-tight font-medium">Bộ Sưu Tập Cao Cấp</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="product-card group" data-testid="featured-iphone-16-pro-max">
              <div className="aspect-square overflow-hidden">
                <img
                  src="https://static.prod-images.emergentagent.com/jobs/a4d3fad4-3db0-44f5-a5ce-de38fedecc5b/images/2c1c50bdfe2bbb379e252e56a91233f62daf65090440c5a8b686e9439567fd4e.png"
                  alt="iPhone 16 Pro Max"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-medium mb-2">iPhone 16 Pro Max</h3>
                <p className="text-[#A1A1A6] mb-4">iPhone đỉnh cao với thiết kế titan</p>
                <p className="text-xl font-semibold mb-4">Từ $1,199</p>
                <Link to="/products" className="btn-primary inline-block" data-testid="view-iphone-16-pro-max">
                  Xem Chi Tiết
                </Link>
              </div>
            </div>

            <div className="product-card group" data-testid="featured-iphone-16-pro">
              <div className="aspect-square overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1727079525588-4638ea8301e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHw0fHxpcGhvbmUlMjBwcm8lMjBtYXh8ZW58MHx8fHwxNzc1MjM5NzgxfDA&ixlib=rb-4.1.0&q=85"
                  alt="iPhone 16 Pro"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-medium mb-2">iPhone 16 Pro</h3>
                <p className="text-[#A1A1A6] mb-4">Hiệu năng Pro trong kích thước gọn nhẹ</p>
                <p className="text-xl font-semibold mb-4">Từ $999</p>
                <Link to="/products" className="btn-primary inline-block" data-testid="view-iphone-16-pro">
                  Xem Chi Tiết
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#050505]" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl tracking-tight font-medium mb-4">Tại Sao Chọn Chúng Tôi</h2>
            <p className="text-[#A1A1A6] text-lg">Dịch vụ cao cấp cho sản phẩm cao cấp</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="feature-warranty">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-medium mb-3">Chính Hãng 100%</h3>
              <p className="text-[#A1A1A6]">Sản phẩm Apple chính hãng với bảo hành đầy đủ</p>
            </div>

            <div className="text-center" data-testid="feature-shipping">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
                <Truck size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-medium mb-3">Giao Hàng Nhanh</h3>
              <p className="text-[#A1A1A6]">Miễn phí vận chuyển cho tất cả đơn hàng</p>
            </div>

            <div className="text-center" data-testid="feature-payment">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
                <CreditCard size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-medium mb-3">Thanh Toán An Toàn</h3>
              <p className="text-[#A1A1A6]">Nhiều phương thức thanh toán bảo mật</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0A0A0A]" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl sm:text-4xl tracking-tight font-medium mb-6">
            Sẵn Sàng Nâng Cấp?
          </h2>
          <p className="text-[#A1A1A6] text-lg mb-8">
            Khám phá toàn bộ bộ sưu tập và tìm chiếc iPhone hoàn hảo cho bạn ngay hôm nay.
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2" data-testid="cta-browse-button">
            Xem Tất Cả Sản Phẩm
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}