
import axios from 'axios';
import { Routes, Route } from 'react-router'
import { useState, useEffect } from 'react';
import { HomePage } from './Pages/home/HomePage'
import { CheckoutPage } from './checkout/CheckoutPage';
import { OrdersPage } from './Pages/orders/OrdersPage';
import { TrackingPage } from './Pages/TrackingPage';
import { NotFoundPage } from './Pages/NotFoundPage';

import './App.css'

function App() {
 const [cart, setCart] = useState([]);

  const loadCart = async () => {
const response = await axios.get('/api/cart-items?expand=product');
          setCart(response.data);
  };

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <Routes>
      <Route index element={<HomePage cart={cart} loadCart={loadCart} />} />
      <Route path="checkout" element={<CheckoutPage cart={cart} loadCart={loadCart} />} />
      <Route path="orders" element={<OrdersPage cart={cart} />} />
      <Route path="tracking" element={<TrackingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>

  )
}

export default App
