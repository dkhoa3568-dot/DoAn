import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './components/AuthCallback';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import '@/App.css';

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppRouter />
            <Toaster position="top-center" />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
