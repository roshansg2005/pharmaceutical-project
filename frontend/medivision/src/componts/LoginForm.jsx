import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";
import loginp from "../assets/loginp.jpeg";

export default function LoginPage({ onLogin }) { 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
    // Function to get current financial year
  const getFinancialYear = () => {
    const currentYear = new Date().getFullYear();
    const month = new Date().getMonth() + 1; // January = 0
    if (month >= 4) {
      // Financial year starts in April
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }
      
      const data = await res.json();
      
      // 1. Save token and user info to localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("company", data.company);
      localStorage.setItem("year", data.financial_year);

      // 2. IMPORTANT: Update the App.jsx state so Navbar shows
      onLogin(); 

      // 3. Navigate to home
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="container">
      <div className="left-panel">
        <img src={loginp} alt="Login Visual" />
      </div>

      <div className="right-panel">
        <h2>Authentication</h2>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">User Name</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <label htmlFor="company">Company Name</label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company name"
            required
            readOnly
          />

          <label htmlFor="year">Financial Year</label>
          <input
            type="text"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="YYYY-YYYY"
            required
            readOnly
          />

          <div className="button-group">
            <button type="submit" className="ok-btn">OK</button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => window.location.reload()}
            >
              Cancel
            </button>
            <button type="button" className="password-btn">Password</button>
          </div>
        </form>
      </div>
    </div>
  );
}
