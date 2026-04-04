import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart } from '@phosphor-icons/react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const API_URL = "https://doan-urzg.onrender.com";

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products`);
      setProducts(data);
    } catch (error) {
      toast.error('Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (productId, variantIndex) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    const result = await addToCart(productId, variantIndex);
    if (result.success) {
      toast.success('Đã thêm vào giỏ hàng');
    } else {
      toast.error(result.error || 'Không thể thêm vào giỏ hàng');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-[#A1A1A6]">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20" data-testid="products-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl tracking-tighter font-medium mb-4" data-testid="products-title">Tất Cả Sản Phẩm</h1>
          <p className="text-[#A1A1A6] text-lg">Khám phá bộ sưu tập iPhone đầy đủ của chúng tôi</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.product_id} className="product-card group" data-testid={`product-card-${product.product_id}`}>
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-2" data-testid={`product-name-${product.product_id}`}>{product.name}</h3>
                <p className="text-[#A1A1A6] text-sm mb-4">{product.description}</p>
                
                <div className="mb-4">
                  <p className="text-xs text-[#A1A1A6] uppercase tracking-wider mb-2">Tính Năng</p>
                  <div className="flex flex-wrap gap-2">
                    {product.features.slice(0, 3).map((feature) => (
                      <span key={feature} className="text-xs bg-white/5 px-3 py-1 rounded-full">{feature}</span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-lg font-semibold" data-testid={`product-price-${product.product_id}`}>
                    Từ ${product.variants[0].price.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#A1A1A6]">{product.variants.length} phiên bản</p>
                </div>

                <button
                  onClick={() => setSelectedProduct(product)}
                  className="btn-primary w-full"
                  data-testid={`view-details-${product.product_id}`}
                >
                  Xem Chi Tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)} data-testid="product-modal">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full rounded-2xl"
                />
              </div>

              <div>
                <h2 className="text-3xl font-medium mb-4" data-testid="modal-product-name">{selectedProduct.name}</h2>
                <p className="text-[#A1A1A6] mb-6">{selectedProduct.description}</p>

                <div className="mb-6">
                  <p className="text-sm text-[#A1A1A6] uppercase tracking-wider mb-3">TÍNH NĂNG</p>
                  <ul className="space-y-2">
                    {selectedProduct.features.map((feature) => (
                      <li key={feature} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-[#A1A1A6] uppercase tracking-wider mb-3">CHỌN CẤU HÌNH</p>
                  <div className="space-y-3">
                    {selectedProduct.variants.map((variant, idx) => (
                      <button
                        key={`${variant.storage}-${variant.color}`}
                        onClick={() => setSelectedVariant(idx)}
                        className={`w-full p-4 rounded-xl border transition-all ${
                          selectedVariant === idx
                            ? 'border-white bg-white/5'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        data-testid={`variant-option-${idx}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-left">
                            <p className="font-medium">{variant.storage} - {variant.color}</p>
                            <p className="text-xs text-[#A1A1A6]">Còn hàng: {variant.stock}</p>
                          </div>
                          <p className="text-lg font-semibold">${variant.price.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct.product_id, selectedVariant);
                    setSelectedProduct(null);
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  data-testid="modal-add-to-cart-button"
                >
                  <ShoppingCart size={20} />
                  Thêm Vào Giỏ - ${selectedProduct.variants[selectedVariant].price.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}