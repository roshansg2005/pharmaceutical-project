import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaSave, FaSearch, FaEraser } from "react-icons/fa";
import "./SalesInvoice.css";

const API = "http://127.0.0.1:8000";

const emptyRow = () => ({
  pcode: "",
  name: "",
  batch: "",
  exp: "", 
  qty: 0,
  free: 0,
  rate: 0,
  gst: 0,
  discount: 0,
  _lineTotal: 0,
});

export default function SalesInvoice() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchId, setSearchId] = useState("");
  
  const [header, setHeader] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    tradingAccount: "LOCAL SALE A/C",
    customer: "",
    area: "",
    city: "",
    state: "",
    paymentMode: "Retail",
    dueDays: 0,
  });

  const [rows, setRows] = useState([emptyRow()]);
  const [notes, setNotes] = useState("");
  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    totalGST: 0,
    grandTotal: 0,
  });

  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState({});

  useEffect(() => {
    if (!isEditMode) fetchNextInvoiceNo();
  }, [isEditMode]);

  const fetchNextInvoiceNo = async () => {
    try {
      const res = await axios.get(`${API}/sales-invoice/next-no`);
      setHeader((prev) => ({ ...prev, invoiceNo: res.data.next_no }));
    } catch (err) {
      console.error("Error fetching next number", err);
    }
  };

  useEffect(() => {
    let subtotal = 0, disc = 0, gst = 0;
    rows.forEach((r) => {
      const q = parseFloat(r.qty) || 0;
      const rt = parseFloat(r.rate) || 0;
      const ds = parseFloat(r.discount) || 0;
      const g_pct = parseFloat(r.gst) || 0;

      const gross = q * rt;
      const d_amt = (gross * ds) / 100;
      const taxable = gross - d_amt;
      const g_amt = (taxable * g_pct) / 100;
      
      subtotal += taxable; disc += d_amt; gst += g_amt;
    });

    setTotals({
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(disc * 100) / 100,
      totalGST: Math.round(gst * 100) / 100,
      grandTotal: Math.round((subtotal + gst) * 100) / 100,
    });
  }, [JSON.stringify(rows)]);

  const handleCustomerSearch = async (val) => {
    setHeader({ ...header, customer: val });
    if (!val) { setCustomerSuggestions([]); return; }
    try {
      const res = await axios.get(`${API}/customers/search?q=${val}`);
      setCustomerSuggestions(res.data || []);
    } catch (err) { console.error(err); }
  };

  const selectCustomer = (c) => {
    setHeader({ ...header, customer: c.name, area: c.area || "", city: c.city || "", state: c.state || "" });
    setCustomerSuggestions([]);
  };

  const handleProductSearch = async (val, i) => {
    updateRow(i, "name", val);
    if (!val) return;
    try {
      const res = await axios.get(`${API}/products/search?q=${val}`);
      setProductSuggestions(prev => ({ ...prev, [i]: res.data || [] }));
    } catch (err) { console.error(err); }
  };

  const selectProduct = (p, i) => {
    const copy = [...rows];
    copy[i] = { 
        ...copy[i], 
        name: p.name, 
        pcode: p.pcode, 
        batch: p.batch || "", 
        exp: p.exp || "", 
        rate: p.rate || 0, 
        gst: p.gst || 18, 
        qty: 1 
    };
    setRows(copy);
    setProductSuggestions(prev => ({ ...prev, [i]: [] }));
  };

  const updateRow = (index, field, value) => {
    const copy = [...rows];
    copy[index][field] = value;
    setRows(copy);
  };

  const saveInvoice = async () => {
    const invalidRow = rows.find(r => !r.exp || r.exp.length < 10);
    if (invalidRow) return alert(`❌ Expiry date missing for: ${invalidRow.name}`);

    const payload = { 
      header: { ...header, invoiceNo: String(header.invoiceNo) }, 
      rows: rows.map(r => ({
        name: r.name, batch: r.batch, exp: r.exp, 
        qty: parseInt(r.qty) || 0, free: parseInt(r.free) || 0,
        rate: parseFloat(r.rate) || 0, gst: parseFloat(r.gst) || 0, discount: parseFloat(r.discount) || 0
      })), 
      totals, notes 
    };

    try {
      if (isEditMode) {
        await axios.put(`${API}/sales-invoice/${header.invoiceNo}`, payload);
        alert("✅ Invoice Updated");
      } else {
        await axios.post(`${API}/sales-invoice`, payload);
        alert("✅ Invoice Saved");
      }
      resetForm();
    } catch (err) { alert("❌ Save Failed"); }
  };

  const loadInvoice = async () => {
    if (!searchId) return alert("Enter invoice number");
    try {
      const res = await axios.get(`${API}/sales-invoice/${searchId}`);
      if (!res.data) throw new Error("No data");
      setHeader(res.data.header);
      setRows(res.data.rows || [emptyRow()]);
      setTotals(res.data.totals);
      setNotes(res.data.notes || "");
      setIsEditMode(true);
    } catch (err) { alert("❌ Invoice not found"); }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setSearchId("");
    setHeader({
      invoiceNo: "", invoiceDate: new Date().toISOString().slice(0, 10),
      tradingAccount: "LOCAL SALE A/C", customer: "", area: "", city: "", state: "",
      paymentMode: "Retail", dueDays: 0,
    });
    setRows([emptyRow()]);
    setNotes("");
  };

  return (
    <div className="sales-fullpage">
      <div className="top-nav">
        <h2>{isEditMode ? `Invoice: ${header.invoiceNo}` : "New Sales Invoice"}</h2>
        <div className="search-bar">
          <input type="text" placeholder="Invoice No..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          <button onClick={loadInvoice} className="load-btn"><FaSearch /> Load</button>
          <button onClick={resetForm} className="clear-btn"><FaEraser /> New Bill</button>
        </div>
      </div>

      <div className="header-card">
        <div className="header-grid">
          <div className="f-group"><label>Invoice No</label><input value={header.invoiceNo || ""} readOnly className="readonly-input" /></div>
          <div className="f-group"><label>Date</label><input type="date" value={header.invoiceDate || ""} onChange={(e) => setHeader({...header, invoiceDate: e.target.value})} /></div>
          <div className="f-group rel">
            <label>Customer Name</label>
            <input value={header.customer || ""} onChange={(e) => handleCustomerSearch(e.target.value)} />
            {customerSuggestions.length > 0 && (
              <ul className="dropdown">
                {customerSuggestions.map(c => <li key={c.id} onClick={() => selectCustomer(c)}>{c.name} ({c.city})</li>)}
              </ul>
            )}
          </div>
          <div className="f-group">
            <label>Mode</label>
            <select value={header.paymentMode || "Retail"} onChange={(e) => setHeader({...header, paymentMode: e.target.value})}>
              <option>Retail</option><option>Credit</option>
            </select>
          </div>
        </div>
        <div className="header-grid mt-10" style={{borderTop: '1px solid #eee', paddingTop: '10px'}}>
            <div className="f-group"><label>Area</label><input value={header.area || ""} readOnly className="readonly-input" /></div>
            <div className="f-group"><label>City</label><input value={header.city || ""} readOnly className="readonly-input" /></div>
            <div className="f-group"><label>State</label><input value={header.state || ""} readOnly className="readonly-input" /></div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th width="30%">Product Name</th><th>Batch</th><th>Exp</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rowTotal = (parseFloat(r.qty || 0) * parseFloat(r.rate || 0)) * (1 + (parseFloat(r.gst || 0) / 100));
              return (
                <tr key={i}>
                  <td className="rel">
                    <input value={r.name || ""} onChange={e => handleProductSearch(e.target.value, i)} />
                    {productSuggestions[i]?.length > 0 && (
                      <ul className="dropdown rich-drop">
                        {productSuggestions[i].map(p => (
                          <li key={p.pcode} onClick={() => selectProduct(p, i)}>
                            <strong>{p.name}</strong> <small>Stock: {p.stock} | Batch: {p.batch}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td><input value={r.batch || ""} onChange={e => updateRow(i,"batch",e.target.value)} /></td>
                  <td><input type="date" value={r.exp || ""} onChange={e => updateRow(i,"exp",e.target.value)} /></td>
                  <td><input type="number" value={r.qty || 0} onChange={e => updateRow(i,"qty",e.target.value)} /></td>
                  <td><input type="number" value={r.rate || 0} onChange={e => updateRow(i,"rate",e.target.value)} /></td>
                  <td><input type="number" value={r.gst || 0} onChange={e => updateRow(i,"gst",e.target.value)} /></td>
                  <td className="bold">₹{rowTotal.toFixed(2)}</td>
                  <td><button className="row-del" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}><FaTrash /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="add-btn" onClick={() => setRows([...rows, emptyRow()])}><FaPlus /> Add Item</button>
      </div>

      <div className="footer-section">
        <textarea placeholder="Notes" value={notes || ""} onChange={(e) => setNotes(e.target.value)} />
        <div className="totals-box">
          <div className="t-row"><span>GST:</span><span>₹{totals.totalGST?.toFixed(2) || "0.00"}</span></div>
          <div className="t-row grand"><span>Grand Total:</span><span>₹{totals.grandTotal?.toFixed(2) || "0.00"}</span></div>
        </div>
      </div>

      <div className="action-btns">
        <button className="save-btn" onClick={saveInvoice}><FaSave /> {isEditMode ? "Update Invoice" : "Save Invoice"}</button>
      </div>
    </div>
  );
}