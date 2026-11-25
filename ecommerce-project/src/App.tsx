import { Routes, Route } from 'react-router'
import { HomePage } from './Pages/home/HomePage'
import { CheckoutPage } from './checkout/CheckoutPage';
import { OrdersPage } from './Pages/orders/OrdersPage';
import { TrackingPage } from './Pages/TrackingPage';
import { NotFoundPage } from './Pages/NotFoundPage';

import './App.css'

// Pages load their own data (see api.ts), so nothing needs passing down.
function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="tracking/:orderId/:productId" element={<TrackingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
