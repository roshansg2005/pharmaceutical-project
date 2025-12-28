import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AddCompany.css";
import Navbar from "./Navbar";

export default function AddCompany() {
  const initialState = {
    regd_code: "Loading...",
    name: "",
    divisions: [""], // Dynamic array for multiple divisions
    balance_sheet_head: "",
    incorporated: "",
    contact_person: "",
    address: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    telephone: "",
    mobile: "",
    email: "",
    cc_email: "",
    medical_representative: "",
    opening_balance: "",
    debit_credit: "",
    transporter: "",
    tmode: "",
    distance: "",
    cheque_given_to: "",
    import_purch_vendor: "",
    tds: false,
    notds: false,
    pi_round: false,
    einv: false,
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  // --- 1. Auto-Increment Logic ---
  useEffect(() => {
    const fetchNextCode = async () => {
      try {
        const response = await axios.get("http://localhost:8000/companies/");
        const nextNumber = response.data.length + 1;
        const generatedCode = `COMP-${String(nextNumber).padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, regd_code: generatedCode }));
      } catch (err) {
        console.error("Auto-increment error:", err);
        setFormData(prev => ({ ...prev, regd_code: "COMP-001" })); // Fallback
      }
    };
    fetchNextCode();
  }, []);

  // --- 2. Dynamic Division Management ---
  const handleDivisionChange = (index, value) => {
    const updatedDivisions = [...formData.divisions];
    updatedDivisions[index] = value;
    setFormData({ ...formData, divisions: updatedDivisions });
  };

  const addDivisionField = () => {
    setFormData({ ...formData, divisions: [...formData.divisions, ""] });
  };

  const removeDivisionField = (index) => {
    const updatedDivisions = formData.divisions.filter((_, i) => i !== index);
    setFormData({ ...formData, divisions: updatedDivisions });
  };

  // --- 3. Form Handling & Validation ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    // Clear error for this field as the user types
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Company Name is required";
    if (!formData.address.trim()) tempErrors.address = "Address is required";
    
    const mobileRegex = /^[0-9]{10}$/;
    if (!formData.mobile || !mobileRegex.test(formData.mobile)) {
      tempErrors.mobile = "A valid 10-digit mobile number is required";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.post("http://localhost:8000/companies/", formData);
      alert("✅ Ayurvedic Company & Divisions saved successfully!");
      window.location.reload(); // Refresh to reset and fetch new Auto-ID
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add company. Check backend connection.");
    }
  };

  return (
    <div className="ayur-company-bg">
      <div className="container-fluid py-3 px-4">
        <div className="company-card full-window">
          
          <div className="company-header d-flex justify-content-between align-items-center">
            <div>
              <h2 className="brand-title">🌿 Ayurvedic Company Registration</h2>
              <p className="m-0 opacity-75">Multi-Division Management System</p>
            </div>
            <div className="auto-code-badge">REGD CODE: {formData.regd_code}</div>
          </div>

          <form className="p-4 mt-2" onSubmit={handleSubmit}>
            {/* SECTION 1: IDENTITY & DIVISIONS */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Company Identity</h5>
              <div className="row g-3">
                <div className="col-md-2">
                  <label className="ayur-label">Regd Code</label>
                  <input type="text" className="form-control ayur-input read-only-input" value={formData.regd_code} readOnly />
                </div>
                <div className="col-md-5">
                  <label className="ayur-label">Company Name *</label>
                  <input 
                    type="text" 
                    className={`form-control ayur-input highlight-field ${errors.name ? 'is-invalid' : ''}`} 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                  />
                  {errors.name && <div className="error-msg">{errors.name}</div>}
                </div>
                <div className="col-md-5">
                  <label className="ayur-label">Divisions (Add Multiple)</label>
                  {formData.divisions.map((div, index) => (
                    <div key={index} className="d-flex gap-2 mb-2">
                      <input 
                        type="text" 
                        className="form-control ayur-input" 
                        placeholder="Division Name" 
                        value={div} 
                        onChange={(e) => handleDivisionChange(index, e.target.value)} 
                      />
                      {index > 0 && <button type="button" className="btn-remove-div" onClick={() => removeDivisionField(index)}>×</button>}
                    </div>
                  ))}
                  <button type="button" className="btn-add-div" onClick={addDivisionField}>+ Add Division</button>
                </div>
              </div>
            </div>

            {/* SECTION 2: OFFICE & CONTACT */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Contact & Location</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="ayur-label">Mobile *</label>
                  <input type="text" className={`form-control ayur-input ${errors.mobile ? 'is-invalid' : ''}`} name="mobile" value={formData.mobile} onChange={handleChange} />
                  {errors.mobile && <div className="error-msg">{errors.mobile}</div>}
                </div>
                <div className="col-md-3">
                  <label className="ayur-label">Contact Person</label>
                  <input type="text" className="form-control ayur-input" name="contact_person" value={formData.contact_person} onChange={handleChange} />
                </div>
                <div className="col-md-3">
                  <label className="ayur-label">Telephone</label>
                  <input type="text" className="form-control ayur-input" name="telephone" value={formData.telephone} onChange={handleChange} />
                </div>
                <div className="col-md-3">
                  <label className="ayur-label">Email</label>
                  <input type="email" className="form-control ayur-input" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="col-md-8">
                  <label className="ayur-label">Full Address *</label>
                  <input type="text" className={`form-control ayur-input ${errors.address ? 'is-invalid' : ''}`} name="address" value={formData.address} onChange={handleChange} />
                  {errors.address && <div className="error-msg">{errors.address}</div>}
                </div>
                <div className="col-md-2">
                  <label className="ayur-label">Area</label>
                  <input type="text" className="form-control ayur-input" name="area" value={formData.area} onChange={handleChange} />
                </div>
                <div className="col-md-2">
                  <label className="ayur-label">City</label>
                  <input type="text" className="form-control ayur-input" name="city" value={formData.city} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* SECTION 3: LOGISTICS & FINANCE */}
            <div className="form-section-box mb-4">
              <h5 className="section-heading">Logistics & Regulatory</h5>
              <div className="row g-3">
                <div className="col-md-3"><label className="ayur-label">Transporter</label><input type="text" className="form-control ayur-input" name="transporter" value={formData.transporter} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Opening Bal.</label><input type="text" className="form-control ayur-input" name="opening_balance" value={formData.opening_balance} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Medical Rep.</label><input type="text" className="form-control ayur-input" name="medical_representative" value={formData.medical_representative} onChange={handleChange} /></div>
                <div className="col-md-3"><label className="ayur-label">Distance (KM)</label><input type="text" className="form-control ayur-input" name="distance" value={formData.distance} onChange={handleChange} /></div>
                
                <div className="col-md-12 d-flex align-items-end gap-5 pb-2 mt-2">
                  <label className="ayur-checkbox"><input type="checkbox" name="tds" checked={formData.tds} onChange={handleChange} /> TDS</label>
                  <label className="ayur-checkbox"><input type="checkbox" name="einv" checked={formData.einv} onChange={handleChange} /> E-INV</label>
                  <label className="ayur-checkbox"><input type="checkbox" name="pi_round" checked={formData.pi_round} onChange={handleChange} /> PI Rounding</label>
                </div>
              </div>
            </div>

            <div className="form-footer text-end mt-4">
              <button type="reset" className="btn btn-ayur-secondary me-3" onClick={() => window.location.reload()}>↺ Reset</button>
              <button type="submit" className="btn btn-ayur-primary px-5">💾 Save Company Record</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}