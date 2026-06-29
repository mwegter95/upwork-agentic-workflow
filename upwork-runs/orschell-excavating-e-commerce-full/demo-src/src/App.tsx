import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Account from './pages/Account';
import OrderDetail from './pages/Orders';
import Admin from './pages/Admin';

export default function App() {
  return (
    <div className="page">
      <Navbar />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders/:id/confirmation" element={<OrderConfirmation />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/orders" element={<Account />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}
