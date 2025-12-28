import React, { useState, useRef, useEffect } from "react";
import { 
  FaClipboardList, FaChartBar, FaTools, FaFileAlt, 
  FaHome, FaChevronDown, FaBars, FaTimes, FaSearch, FaBell, FaUser 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import './Navbar.css';

const menuItems = {
  Setup: { icon: <FaHome />, items: ["User Settings", "Database Setup", "New Product", "New customer", "New Company", "New Supplier"] },
  Transactions: { icon: <FaClipboardList />, items: ["Purchase Invoice", "Stock Inward", "Stock Outward", "Daily Collection", "Purchase Order"] },
  "Ayurvedic Tools": { icon: <FaTools />, items: ["Stock Report", "Batch Expiry Tracking", "Dosage Calculator", "Formulation Check"] },
  Reports: { icon: <FaFileAlt />, items: ["Sales Analysis", "Tax Report", "Inventory Valuation"] },
  Invoices: { icon: <FaChartBar />, items: ["Sales Invoice", "Product Invoice", "Return Invoice","stock"] }
};

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();

  const [shouldLogout, setShouldLogout] = useState(false);
  const socket = useRef(null);
const [showLogoutModal, setShowLogoutModal] = useState(false);
  // 2. The useEffect listens for 'shouldLogout' to become true
  useEffect(() => {
    if (shouldLogout) {
      // Clear the session
      localStorage.removeItem("token");

      // Close WebSocket if active
      if (socket.current) {
        socket.current.close();
      }

      // Force a hard reload to the login path
      // This resets all React state and memory
      window.location.href = "/";
    }
  }, [shouldLogout]); // Dependency array ensures this runs only when state changes
  
const handleConfirmLogout = () => {
  localStorage.removeItem("token");
  if (socket.current) {
    socket.current.close();
  }
  // Hard reload to login
  window.location.href = "/";
};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (e, item) => {
    e.stopPropagation(); 
    const routeMap = {
      "New Product": "/add-product",
      "New customer": "/add-customer",
      "New Company": "/add-company",
      "New Supplier": "/add-supplier",
      "Product Invoice": "/product invoice",
      "Sales Invoice": "/sales invoice",
      "stock": "/stock-dashboard"
    };
    if (routeMap[item]) navigate(routeMap[item]);
    setActiveMenu(null);
  };

  return (
    <nav className="navbar ayur-navbar" ref={navRef}>
      <div className="navbar-container">
        {/* LOGO */}
        <div className="navbar-brand" onClick={() => navigate("/home")}>
          <div className="logo-leaf">🌿</div>
          <div className="brand-text-container">
            <span className="brand-main">PIRENS</span>
            <span className="brand-sub">AYURVEDIC HOSPITAL & RESEARCH CENTRE</span>
          </div>
        </div>

        {/* SEARCH */}
        <div className="navbar-search">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search features..." />
          </div>
        </div>

        {/* MENU - The logic here ensures dropdowns are clickable */}
        <ul className="navbar-menu">
          {Object.entries(menuItems).map(([menu, { icon, items }]) => (
            <li 
              key={menu} 
              className="menu-item"
              onMouseEnter={() => setActiveMenu(menu)}
              onMouseLeave={() => setActiveMenu(null)}
              onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
            >
              <div className="menu-trigger">
                {icon} <span className="menu-label">{menu}</span>
                <FaChevronDown className={`chevron ${activeMenu === menu ? 'rotated' : ''}`} />
              </div>
              
              {activeMenu === menu && (
                <ul className="dropdown-menu">
                  {items.map((item, i) => (
                    <li key={i} onClick={(e) => handleItemClick(e, item)}>{item}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* ACTIONS */}
        <div className="navbar-actions">
          <div className="action-item"><FaBell /><span className="badge">2</span></div>
          <div className="action-item" onClick={() => navigate("/profile")}><FaUser /></div>
        < button className="logout-btn bg-danger" onClick={() => setShowLogoutModal(true)}>
        ⎋ Logout
      </button>
         {showLogoutModal && (
      <div className="modal-overlay">
        <div className="confirm-modal">
          <div className="modal-icon">⚠️</div>
          <h3>Confirm Logout</h3>
          <p>Are you sure you want to end your session at PIRENS Ayurvedic Portal?</p>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>
              Stay Logged In
            </button>
            <button className="btn-confirm" onClick={handleConfirmLogout}>
              Yes, Logout
            </button>
          </div>
        </div>
      </div>
    )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;