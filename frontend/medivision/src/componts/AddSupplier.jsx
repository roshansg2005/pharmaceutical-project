import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AddSupplier.css";
import Navbar from "./Navbar";

const AddSupplier = () => {
  const initialState = {
    code: "Loading...",
    supplier_name: "",
    owner_name: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    mobile: "",
    whatsapp: "",
    email: "",
    drug_license: "",
    gstin: "",
    opening_balance: "",
    tds: false,
  };

  const [supplier, setSupplier] = useState(initialState);
  const [errors, setErrors] = useState({});

  // --- Auto-Increment Logic ---
  useEffect(() => {
    const fetchNextCode = async () => {
      try {
        const response = await axios.get("http://localhost:8000/suppliers/");
        const nextNumber = response.data.length + 1;
        const generatedCode = `SUP-${String(nextNumber).padStart(3, '0')}`;
        setSupplier(prev => ({ ...prev, code: generatedCode }));
      } catch (err) {
        setSupplier(prev => ({ ...prev, code: "SUP-001" }));
      }
    };
    fetchNextCode();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSupplier(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    let tempErrors = {};
    if (!supplier.supplier_name.trim()) tempErrors.supplier_name = "Supplier Name is required";
    if (!supplier.owner_name.trim()) tempErrors.owner_name = "Owner Name is required";
    if (!supplier.mobile.match(/^[0-9]{10}$/)) tempErrors.mobile = "Valid 10-digit mobile required";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.post("http://localhost:8000/suppliers/", supplier);
      alert("✅ Ayurvedic Supplier Registered Successfully!");
      window.location.reload(); 
    } catch (err) {
      alert("❌ Failed to add supplier");
    }
  };

  return (
    <div className="ayur-supplier-bg">
      <div className="container-fluid py-3 px-4">
        <div className="supplier-card full-window">
          {/* Header */}
          <div className="supplier-header d-flex justify-content-between align-items-center">
            <div>
              <h2 className="brand-title">🌿 Ayurvedic Supplier Portal</h2>
              <p className="m-0 opacity-75">Vendor & Distribution Management</p>
            </div>
            <div className="auto-code-badge">SUPPLIER CODE: {supplier.code}</div>
          </div>

          <form className="p-4 mt-2" onSubmit={handleSubmit}>
            {/* Identity Section */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Primary Identity</h5>
              <div className="row g-3">
                <div className="col-md-2">
                  <label className="ayur-label">Code</label>
                  <input type="text" className="form-control ayur-input read-only-input" value={supplier.code} readOnly />
                </div>
                <div className="col-md-5">
                  <label className="ayur-label">Supplier / Agency Name *</label>
                  <input type="text" className={`form-control ayur-input highlight-field ${errors.supplier_name ? 'is-invalid' : ''}`} name="supplier_name" onChange={handleChange} />
                  {errors.supplier_name && <div className="error-msg">{errors.supplier_name}</div>}
                </div>
                <div className="col-md-5">
                  <label className="ayur-label">Owner Name *</label>
                  <input type="text" className={`form-control ayur-input highlight-field ${errors.owner_name ? 'is-invalid' : ''}`} name="owner_name" onChange={handleChange} />
                  {errors.owner_name && <div className="error-msg">{errors.owner_name}</div>}
                </div>
              </div>
            </div>

            {/* Location & Contact Section */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Contact & Communication</h5>
              <div className="row g-3">
                <div className="col-md-6"><label className="ayur-label">Address</label><input type="text" className="form-control ayur-input" name="address" onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">City</label><input type="text" className="form-control ayur-input" name="city" onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Pincode</label><input type="text" className="form-control ayur-input" name="pincode" onChange={handleChange} /></div>
                <div className="col-md-4"><label className="ayur-label">Mobile *</label><input type="text" className={`form-control ayur-input ${errors.mobile ? 'is-invalid' : ''}`} name="mobile" onChange={handleChange} />{errors.mobile && <div className="error-msg">{errors.mobile}</div>}</div>
                <div className="col-md-4"><label className="ayur-label">WhatsApp</label><input type="text" className="form-control ayur-input" name="whatsapp" onChange={handleChange} /></div>
                <div className="col-md-4"><label className="ayur-label">Email</label><input type="email" className="form-control ayur-input" name="email" onChange={handleChange} /></div>
              </div>
            </div>

            {/* Regulatory Section */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Regulatory & Financials</h5>
              <div className="row g-3">
                <div className="col-md-3"><label className="ayur-label">GSTIN</label><input type="text" className="form-control ayur-input" name="gstin" onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Drug License</label><input type="text" className="form-control ayur-input" name="drug_license" onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Opening Bal.</label><input type="text" className="form-control ayur-input" name="opening_balance" onChange={handleChange} /></div>
                <div className="col-md-3 d-flex align-items-end pb-2">
                  <label className="ayur-checkbox"><input type="checkbox" name="tds" onChange={handleChange} /> TDS Applicable</label>
                </div>
              </div>
            </div>

            <div className="form-footer text-end">
              <button type="reset" className="btn btn-ayur-secondary me-3" onClick={() => window.location.reload()}>↺ Reset</button>
              <button type="submit" className="btn btn-ayur-primary px-5">💾 Save Supplier Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSupplier;