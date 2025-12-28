import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added for navigation
import axios from "axios";
import "./addProduct.css";
import Navbar from "./Navbar";

const AddProduct = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  
  const initialState = {
    code: "Loading...",
    name: "",
    packing: "",
    manufacturer: "",
    division: "",
    category: "",
    genericGroup: "",
    therapeuticGroup: "",
    drugSchedule: "",
    tabPack: "",
    tabPacking: "",
    unitInBox: "",
    unitInCase: "",
    weight: "",
    maxMRP: "",
    maxQty: "",
    rowColor: "#2d6a4f",
    flashMessage: "",
  };

  const [product, setProduct] = useState(initialState);
  const [companies, setCompanies] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const prodRes = await axios.get("http://localhost:8000/products/");
        const nextID = prodRes.data.length + 1;
        const uniqueCode = `PRD-${String(nextID).padStart(3, '0')}`;
        
        const compRes = await axios.get("http://localhost:8000/companies/");
        
        setCompanies(compRes.data);
        setProduct(prev => ({ ...prev, code: uniqueCode }));
      } catch (err) {
        setProduct(prev => ({ ...prev, code: "PRD-001" }));
      }
    };
    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));

    if (name === "manufacturer") {
      const selectedCompany = companies.find(c => c.name === value);
      setDivisions(selectedCompany?.divisions || []);
      setProduct(prev => ({ ...prev, manufacturer: value, division: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPayload = {
      ...product,
      unitInBox: product.unitInBox ? parseInt(product.unitInBox) : null,
      unitInCase: product.unitInCase ? parseInt(product.unitInCase) : null,
      maxQty: product.maxQty ? parseInt(product.maxQty) : null,
      weight: product.weight ? parseFloat(product.weight) : null,
      maxMRP: product.maxMRP ? parseFloat(product.maxMRP) : null,
    };

    try {
      await axios.post("http://localhost:8000/products/", cleanPayload);
      alert(`✅ Product ${product.code} Added Successfully!`);
      window.location.reload(); 
    } catch (err) {
      alert("❌ Failed to add product.");
    }
  };

  return (
    <div className="ayur-product-bg">
      <div className="container-fluid py-3 px-4">
        {/* Navigation Breadcrumb / Back Button Row */}


        <div className="product-card full-window shadow-lg">
          <div className="product-header d-flex justify-content-between align-items-center">
            <div>
              <h2 className="brand-title">🌿 Ayurvedic Inventory</h2>
              <p className="m-0 opacity-75">Product Registration Portal</p>
            </div>
            <div className="auto-code-display text-center">
               <small>NEXT PRODUCT ID:</small>
               <h3 className="m-0">{product.code}</h3>
            </div>
          </div>

          <form className="p-4" onSubmit={handleSubmit}>
            {/* Identity Section */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Identity & Source</h5>
              <div className="row g-3">
                <div className="col-md-2">
                  <label className="ayur-label">Product ID</label>
                  <input type="text" className="form-control ayur-input read-only-input" value={product.code} readOnly />
                </div>
                <div className="col-md-4">
                  <label className="ayur-label">Product Name *</label>
                  <input type="text" className="form-control ayur-input" name="name" onChange={handleChange} required />
                </div>
                <div className="col-md-3">
                  <label className="ayur-label">Manufacturer</label>
                  <select className="form-select ayur-input" name="manufacturer" onChange={handleChange}>
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="ayur-label">Division</label>
                  <select className="form-select ayur-input" name="division" value={product.division} onChange={handleChange} disabled={divisions.length === 0}>
                    <option value="">Select Division</option>
                    {divisions.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Medical Classification</h5>
              <div className="row g-3">
                <div className="col-md-3"><label className="ayur-label">Packing</label><input type="text" className="form-control ayur-input" name="packing" onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Generic Group</label><input type="text" className="form-control ayur-input" name="genericGroup" onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Therapeutic Group</label><input type="text" className="form-control ayur-input" name="therapeuticGroup" onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Drug Schedule</label><input type="text" className="form-control ayur-input" name="drugSchedule" onChange={handleChange} /></div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Pricing & Packaging</h5>
              <div className="row g-3">
                <div className="col-md-2"><label className="ayur-label">Unit/Box</label><input type="number" className="form-control ayur-input" name="unitInBox" onChange={handleChange} /></div>
                <div className="col-md-2"><label className="ayur-label">Unit/Case</label><input type="number" className="form-control ayur-input" name="unitInCase" onChange={handleChange} /></div>
                <div className="col-md-2"><label className="ayur-label">Weight</label><input type="number" step="0.01" className="form-control ayur-input" name="weight" onChange={handleChange} /></div>
                <div className="col-md-2"><label className="ayur-label">Max MRP</label><input type="number" step="0.01" className="form-control ayur-input" name="maxMRP" onChange={handleChange} /></div>
                <div className="col-md-4"><label className="ayur-label">Flash Message</label><input type="text" className="form-control ayur-input" name="flashMessage" onChange={handleChange} /></div>
              </div>
            </div>

            <div className="text-end">
              <button type="button" onClick={() => navigate("/home")} className="btn btn-outline-secondary me-3 px-4">Cancel/Back to home</button>
              <button type="submit" className="btn btn-ayur-primary px-5">💾 Save Product {product.code}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;