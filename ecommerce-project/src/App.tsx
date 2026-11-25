
import axios from 'axios';
import { Routes, Route } from 'react-router'
import { useState, useEffect } from 'react';
import { HomePage } from './Pages/home/HomePage'
import { CheckoutPage } from './checkout/CheckoutPage';
import { OrdersPage } from './Pages/orders/OrdersPage';
import { TrackingPage } from './Pages/TrackingPage';
import { NotFoundPage } from './Pages/NotFoundPage';

import type { CartItemWithProduct } from './types';

import './App.css'

function App() {
  const [cart, setCart] = useState<CartItemWithProduct[]>([]);
  // Until the first load, an empty `cart` doesn't mean the cart is empty.
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  const loadCart = async () => {
    try {
      const response = await axios.get<CartItemWithProduct[]>('/api/cart-items?expand=product');
      setCart(response.data);
      setIsCartLoaded(true);
    } catch (error) {
      // Keep showing the last cart we had; pages report their own load errors.
      console.error('Could not load the cart', error);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <Routes>
      <Route index element={<HomePage cart={cart} loadCart={loadCart} />} />
      <Route path="checkout" element={<CheckoutPage cart={cart} isCartLoaded={isCartLoaded} loadCart={loadCart} />} />
      <Route path="orders" element={<OrdersPage cart={cart} loadCart={loadCart} />} />
      <Route path="tracking/:orderId/:productId" element={<TrackingPage cart={cart} />} />
      <Route path="*" element={<NotFoundPage cart={cart} />} />
    </Routes>

  )
}

export default App
