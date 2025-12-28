import './App.css'
import LoginForm from './componts/LoginForm'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Userprofile from './componts/UserProfile';
import Home from './componts/home';
import AddProduct from "./componts/AddProductPage";
import AddCustomer from "./componts/AddCustomer";
import Addcompany from "./componts/Addcomany";
import Productinvoice from "./componts/AddProductStock"
import Saleinvoice from "./componts/SalesInvoice"
import AddSupplier from "./componts/AddSupplier";
import Navbar from './componts/Navbar';
import StockDashboard from './componts/StockDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check session on page load
  useEffect(() => {
    const user = localStorage.getItem("token"); // Assuming you store a 'token' on login
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  // Use this function inside your LoginForm component after successful login
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Use this function inside your Navbar for Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  // Helper component to protect routes
  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      {/* Navbar only shows if logged in */}
      {isLoggedIn && <Navbar onLogout={handleLogout} />}

      <Routes>
        {/* Public Route: Login */}
        <Route 
          path="/" 
          element={isLoggedIn ? <Navigate to="/home" /> : <LoginForm onLogin={handleLogin} />} 
        />

        {/* All internal routes wrapped in ProtectedRoute */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Userprofile /></ProtectedRoute>} />
        <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
        <Route path="/add-customer" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
        <Route path="/add-company" element={<ProtectedRoute><Addcompany /></ProtectedRoute>} />
        <Route path="/product invoice" element={<ProtectedRoute><Productinvoice /></ProtectedRoute>} />
        <Route path="/sales invoice" element={<ProtectedRoute><Saleinvoice /></ProtectedRoute>} />
        <Route path="/add-supplier" element={<ProtectedRoute><AddSupplier /></ProtectedRoute>} />
        <Route path="/stock-dashboard" element={<ProtectedRoute><StockDashboard /></ProtectedRoute>} />
        
        {/* Redirect any unknown routes to login/home */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/home" : "/"} />} />
      </Routes>
    </Router>
  );
}

export default App;