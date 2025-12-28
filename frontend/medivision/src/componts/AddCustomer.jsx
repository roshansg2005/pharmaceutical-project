import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AddCustomer.css";
import Navbar from "./Navbar";

const AddMedical = () => {
  const initialState = {
    code: "Loading...",
    name: "",
    owner_name: "",
    address: "",
    landmark: "",
    area: "", 
    city: "",
    state: "",
    pincode: "",
    mobile: "", 
    whatsapp: "",
    email: "",
    drug_license: "",
    gstin: "",
    refrigerator_detail: "",
    opening_balance: "", 
    tcs: false,
    tds: false,
  };

  const [medical, setMedical] = useState(initialState);

  useEffect(() => {
    const fetchNextCode = async () => {
      try {
        const response = await axios.get("http://localhost:8000/customers/");
        const nextNumber = response.data.length + 1;
        const generatedCode = `MED-${String(nextNumber).padStart(3, '0')}`;
        setMedical(prev => ({ ...prev, code: generatedCode }));
      } catch (err) {
        setMedical(prev => ({ ...prev, code: "MED-001" }));
      }
    };
    fetchNextCode();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMedical((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert empty strings to null for backend compatibility
    const cleanPayload = Object.fromEntries(
      Object.entries(medical).map(([key, value]) =>
        value === "" ? [key, null] : [key, value]
      )
    );

    try {
      await axios.post("http://localhost:8000/customers/", cleanPayload);
      alert("✅ Medical Record Saved Successfully!");
      window.location.reload(); 
    } catch (err) {
      console.error("Error Detail:", err.response?.data);
      alert("❌ Submission Failed. Check all required fields.");
    }
  };

  return (
    <div className="ayur-medical-bg">
      <div className="container-fluid py-3 px-4">
        <div className="medical-card full-window">
          <div className="medical-header d-flex justify-content-between align-items-center">
            <div>
              <h2 className="brand-title">🌿 Ayurvedic Medical Portal</h2>
              <p className="m-0 opacity-75">Full Medical & Pharmacy Profile</p>
            </div>
            <div className="medical-badge">CODE: {medical.code}</div>
          </div>

          <form className="p-4 mt-2" onSubmit={handleSubmit}>
            {/* --- SECTION 1: IDENTITY --- */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Basic Identity</h5>
              <div className="row g-3">
                <div className="col-md-2">
                  <label className="ayur-label">Code</label>
                  <input type="text" className="form-control ayur-input read-only-input" value={medical.code} readOnly />
                </div>
                <div className="col-md-5">
                  <label className="ayur-label">Medical / Shop Name *</label>
                  <input type="text" className="form-control ayur-input highlight-field" name="name" value={medical.name} onChange={handleChange} required />
                </div>
                <div className="col-md-5">
                  <label className="ayur-label">Owner Name</label>
                  <input type="text" className="form-control ayur-input" name="owner_name" value={medical.owner_name} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* --- SECTION 2: CONTACT & LOCATION --- */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Contact & Address</h5>
              <div className="row g-3">
                <div className="col-md-6"><label className="ayur-label">Full Address</label><input type="text" className="form-control ayur-input" name="address" value={medical.address} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Landmark</label><input type="text" className="form-control ayur-input" name="landmark" value={medical.landmark} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Area</label><input type="text" className="form-control ayur-input" name="area" value={medical.area} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">City</label><input type="text" className="form-control ayur-input" name="city" value={medical.city} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">State</label><input type="text" className="form-control ayur-input" name="state" value={medical.state} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Mobile Number *</label><input type="text" className="form-control ayur-input" name="mobile" value={medical.mobile} onChange={handleChange} required /></div>
                <div className="col-md-3"><label className="ayur-label">WhatsApp</label><input type="text" className="form-control ayur-input" name="whatsapp" value={medical.whatsapp} onChange={handleChange} /></div>
              </div>
            </div>

            {/* --- SECTION 3: PROFESSIONAL & REGULATORY --- */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Regulatory & Assets</h5>
              <div className="row g-3">
                <div className="col-md-3"><label className="ayur-label">Drug License</label><input type="text" className="form-control ayur-input" name="drug_license" value={medical.drug_license} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">GSTIN</label><input type="text" className="form-control ayur-input" name="gstin" value={medical.gstin} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Refrigerator Detail</label><input type="text" className="form-control ayur-input" name="refrigerator_detail" value={medical.refrigerator_detail} onChange={handleChange} placeholder="e.g. LG 200L" /></div>
                <div className="col-md-3"><label className="ayur-label">Opening Balance</label><input type="text" className="form-control ayur-input" name="opening_balance" value={medical.opening_balance} onChange={handleChange} /></div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="form-footer d-flex justify-content-between align-items-center">
              <div className="d-flex gap-4">
                <label className="ayur-checkbox"><input type="checkbox" name="tcs" checked={medical.tcs} onChange={handleChange} /> TCS</label>
                <label className="ayur-checkbox"><input type="checkbox" name="tds" checked={medical.tds} onChange={handleChange} /> TDS</label>
              </div>
              <button type="submit" className="btn btn-ayur-primary px-5">💾 Save Medical Portal Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMedical;