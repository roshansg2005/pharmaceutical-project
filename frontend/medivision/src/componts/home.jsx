import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./home.css";

const API = "http://127.0.0.1:8000";

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  
  // --- States for date range ---
  const today = new Date();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [stats, setStats] = useState({
    totalSales: 0,
    lowStock: 0,
    nearExpiry: 0,
    orders: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

  // --- Live clock ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- API Fetching ---
  const fetchDashboardData = async () => {
    try {
      // Format dates to YYYY-MM-DD for FastAPI
      const start = fromDate.toISOString().split('T')[0];
      const end = toDate.toISOString().split('T')[0];

      // Fetch Stats
      const statsRes = await axios.get(`${API}/api/dashboard-stats`, {
        params: { from_date: start, to_date: end }
      });
      setStats(statsRes.data);

      // Fetch Recent Orders (Limited to 5)
      const ordersRes = await axios.get(`${API}/api/recent-orders`, {
        params: { limit: 5 }
      });
      setRecentOrders(ordersRes.data);
    } catch (err) {
      console.error("Dashboard Data Fetch Error:", err);
    }
  };

  // Update data when range changes
  useEffect(() => {
    fetchDashboardData();
  }, [fromDate, toDate]);

  // --- Period handlers ---
  const handleToday = () => {
    setSelectedPeriod("today");
    setFromDate(new Date());
    setToDate(new Date());
  };

  const handleThisWeek = () => {
    const t = new Date();
    const day = t.getDay(); 
    const monday = new Date(t);
    monday.setDate(t.getDate() - (day === 0 ? 6 : day - 1));

    setSelectedPeriod("week");
    setFromDate(monday);
    setToDate(t);
  };

  const handleThisMonth = () => {
    const t = new Date();
    const firstDay = new Date(t.getFullYear(), t.getMonth(), 1);

    setSelectedPeriod("month");
    setFromDate(firstDay);
    setToDate(t);
  };

  return (
    <div className="homepage-content">
      {/* Header */}
      <div className="dashboard-header">
        <h2>Welcome Back, Roshan!</h2>
        <div className="clock-display">
          <span>{currentTime.toLocaleDateString()}</span> | 
          <strong> {currentTime.toLocaleTimeString()}</strong>
        </div>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        <button onClick={handleToday} className={selectedPeriod === "today" ? "active" : ""}>Today</button>
        <button onClick={handleThisWeek} className={selectedPeriod === "week" ? "active" : ""}>This Week</button>
        <button onClick={handleThisMonth} className={selectedPeriod === "month" ? "active" : ""}>This Month</button>
      </div>

      {/* Date Range Picker */}
      <div className="date-range-picker">
        <div className="picker-group">
          <label>From: </label>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            dateFormat="dd-MM-yyyy"
          />
        </div>
        <div className="picker-group">
          <label>To: </label>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            dateFormat="dd-MM-yyyy"
          />
        </div>
        <button className="refresh-btn" onClick={fetchDashboardData}>Refresh Data</button>
      </div>

      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        <div className="card stat-card">
          <h3>Total Sales</h3>
          <p className="stat-value">₹{stats.totalSales.toLocaleString()}</p>
          <span className="stat-label">For selected period</span>
        </div>
        <div className="card stat-card">
          <h3>Low Stock</h3>
          <p className="stat-value" style={{color: stats.lowStock > 0 ? 'red' : 'inherit'}}>
            {stats.lowStock}
          </p>
          <button className="view-btn">Check Inventory</button>
        </div>
        <div className="card stat-card">
          <h3>Near Expiry</h3>
          <p className="stat-value" style={{color: stats.nearExpiry > 0 ? 'orange' : 'inherit'}}>
            {stats.nearExpiry}
          </p>
          <button className="view-btn">Check Expiry</button>
        </div>
        <div className="card stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.orders}</p>
          <button className="view-btn">Manage Orders</button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="card table-card">
        <h3>Recent Sales Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>Inv No.</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <tr key={order.invoice_no}>
                  <td>#{order.invoice_no}</td>
                  <td>{order.customer}</td>
                  <td>{new Date(order.invoice_date).toLocaleDateString()}</td>
                  <td className="bold">₹{order.grand_total.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{textAlign: 'center'}}>No recent orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Grid */}
      <div className="extra-sections">
        <div className="card">
          <h3>Notifications</h3>
          <ul className="notif-list">
            {stats.lowStock > 0 && <li>⚠️ {stats.lowStock} products are below minimum stock.</li>}
            {stats.nearExpiry > 0 && <li>📅 {stats.nearExpiry} products expiring within 90 days.</li>}
            <li>✅ System is up to date.</li>
          </ul>
        </div>

        <div className="card quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <button onClick={() => window.location.href='/sales'}>Create New Bill</button>
            <button onClick={() => window.location.href='/inventory'}>Add Product</button>
            <button>Generate Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}