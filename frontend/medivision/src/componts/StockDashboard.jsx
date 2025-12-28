import React, { useState } from "react";
import axios from "axios";
import { FaSearch, FaBoxes, FaExclamationTriangle } from "react-icons/fa";
import "./StockDashboard.css";

const API = "http://127.0.0.1:8000";

export default function StockDashboard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/stock/search?q=${val}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-dashboard">
      <div className="dashboard-header">
        <h2><FaBoxes /> Inventory Stock Status</h2>
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Product Name or Code..."
            value={query}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="results-container">
        {loading && <p className="info-txt">Searching inventory...</p>}
        
        {!loading && results.length > 0 ? (
          <table className="stock-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Product Name</th>
                <th>Packing</th>
                <th>Division</th>
                <th>MRP</th>
                <th>Current Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((p) => (
                <tr key={p.id}>
                  <td>{p.pcode}</td>
                  <td className="bold">{p.name}</td>
                  <td>{p.packing}</td>
                  <td>{p.division}</td>
                  <td>₹{p.mrp}</td>
                  <td className={`stock-val ${p.stock <= 5 ? "low-stock" : ""}`}>
                    {p.stock}
                  </td>
                  <td>
                    {p.stock <= 0 ? (
                      <span className="badge out">Out of Stock</span>
                    ) : p.stock <= 5 ? (
                      <span className="badge low">Low Stock</span>
                    ) : (
                      <span className="badge available">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && query.length > 1 && <p className="info-txt">No products found.</p>
        )}
      </div>
    </div>
  );
}