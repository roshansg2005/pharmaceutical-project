import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaSave, FaEraser } from "react-icons/fa";
import "./AddProductStock.css";

const AddStockPage = () => {
  const entryRef = useRef(null);
  
  // Helper to prevent null/undefined input values
  const clean = (val) => (val === null || val === undefined ? "" : val);

  const [isEditMode, setIsEditMode] = useState(false);
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState({});

  const [invoice, setInvoice] = useState({
    entry_no: "",
    entry_date: new Date().toISOString().split("T")[0],
    trading_account: "Main Account",
    supplier_name: "",
    supplier_gstin: "",
    city: "",
    state: "",
    invoice_no: "",
    invoice_date: new Date().toISOString().split("T")[0],
    products: [
      {
        product_name: "",
        batch_no: "",
        exp_date: "",
        quantity: 0,
        free: 0,
        mrp: 0,
        rate: 0,
        gst_percent: 18,
        amount: 0,
      },
    ],
  });

  /* ================= FETCH NEXT ENTRY NO ================= */
  const fetchNextEntryNo = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/invoices/next-entry-no");
      setInvoice((prev) => ({
        ...prev,
        entry_no: res.data.next_entry_no,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNextEntryNo();
  }, []);

  /* ================= LOAD INVOICE BY ENTRY NO ================= */
  const loadInvoice = async () => {
    if (!invoice.entry_no) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/purchase-entry/${invoice.entry_no}`);
      setInvoice(res.data);
      setIsEditMode(true);
    } catch {
      alert("❌ Invoice not found");
    }
  };

  /* ================= SUPPLIER SEARCH ================= */
  const handleSupplierSearch = async (value) => {
    setInvoice({ ...invoice, supplier_name: value });
    if (!value) return setSupplierSuggestions([]);
    const res = await axios.get(`http://127.0.0.1:8000/suppliers/search?q=${value}`);
    setSupplierSuggestions(res.data);
  };

  /* ================= PRODUCT SEARCH ================= */
  const handleProductSearch = async (value, index) => {
    const rows = [...invoice.products];
    rows[index].product_name = value;
    setInvoice({ ...invoice, products: rows });
    if (!value) return;
    const res = await axios.get(`http://127.0.0.1:8000/products/search?q=${value}`);
    setProductSuggestions((prev) => ({ ...prev, [index]: res.data }));
  };

  /* ================= UPDATE PRODUCT ROW ================= */
  const updateRow = (index, field, value) => {
    const rows = [...invoice.products];
    rows[index][field] = value;
    if (["quantity", "rate", "gst_percent"].includes(field)) {
      const qty = Number(rows[index].quantity) || 0;
      const rate = Number(rows[index].rate) || 0;
      const gst = Number(rows[index].gst_percent) || 0;
      const base = qty * rate;
      rows[index].amount = base + (base * gst) / 100;
    }
    setInvoice({ ...invoice, products: rows });
  };

  const addRow = () => {
    setInvoice({
      ...invoice,
      products: [...invoice.products, {
          product_name: "", batch_no: "", exp_date: "", quantity: 0,
          free: 0, mrp: 0, rate: 0, gst_percent: 18, amount: 0,
      }],
    });
  };

  const removeRow = (index) => {
    setInvoice({
      ...invoice,
      products: invoice.products.filter((_, i) => i !== index),
    });
  };

  const handleSaveInvoice = async () => {
    try {
      if (!invoice.supplier_name || invoice.products.length === 0) {
        alert("Supplier & products required");
        return;
      }
      if (isEditMode) {
        await axios.put(`http://127.0.0.1:8000/purchase-entry/${invoice.entry_no}`, invoice);
        alert("✅ Invoice updated");
      } else {
        await axios.post("http://127.0.0.1:8000/purchase-entry/", invoice);
        alert("✅ Invoice saved");
      }
      window.location.reload();
    } catch (err) {
      alert("❌ Save failed");
    }
  };

  const handleDeleteInvoice = async () => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/purchase-entry/${invoice.entry_no}`);
      alert("🗑 Invoice deleted");
      window.location.reload();
    } catch {
      alert("❌ Delete failed");
    }
  };

  return (
    <div className="stock-page">
      <div className="top-bar">
        <h2>🌿 Purchase Stock Entry</h2>
        <div className="id-badge">
          <label>Entry No</label>
          <input
            ref={entryRef}
            type="number"
            value={clean(invoice.entry_no)} // Safety Applied
            onChange={(e) => setInvoice({ ...invoice, entry_no: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && loadInvoice()}
          />
          <small>Press Enter to load</small>
        </div>
      </div>

      <div className="form-card header-form">
        <div className="grid-4">
          <div className="f-group search-container">
            <label>Supplier Name</label>
            <input
              value={clean(invoice.supplier_name)} // Safety Applied
              onChange={(e) => handleSupplierSearch(e.target.value)}
            />
            {supplierSuggestions.length > 0 && (
              <ul className="dropdown">
                {supplierSuggestions.map((s) => (
                  <li key={s.id} onClick={() => {
                      setInvoice({ ...invoice, supplier_name: s.name, supplier_gstin: s.gstin, city: s.city, state: s.state });
                      setSupplierSuggestions([]);
                  }}>
                    {s.name} ({s.city})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="f-group">
            <label>Trading Account</label>
            <select
              value={clean(invoice.trading_account)} // Safety Applied
              onChange={(e) => setInvoice({ ...invoice, trading_account: e.target.value })}
            >
              <option>Main Account</option>
              <option>Cash Account</option>
            </select>
          </div>

          <div className="f-group">
            <label>Invoice No</label>
            <input
              value={clean(invoice.invoice_no)} // Safety Applied
              onChange={(e) => setInvoice({ ...invoice, invoice_no: e.target.value })}
            />
          </div>

          <div className="f-group">
            <label>Invoice Date</label>
            <input
              type="date"
              value={clean(invoice.invoice_date)} // Safety Applied
              onChange={(e) => setInvoice({ ...invoice, invoice_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid-3 mt-15">
          <div className="f-group"><label>GSTIN</label><input value={clean(invoice.supplier_gstin)} readOnly /></div>
          <div className="f-group"><label>City</label><input value={clean(invoice.city)} readOnly /></div>
          <div className="f-group"><label>State</label><input value={clean(invoice.state)} readOnly /></div>
        </div>
      </div>

      <div className="form-card table-section">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Product</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Free</th><th>MRP</th><th>Rate</th><th>GST%</th><th>Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((item, i) => (
              <tr key={i}>
                <td className="search-container">
                  <input value={clean(item.product_name)} onChange={(e) => handleProductSearch(e.target.value, i)} />
                  {productSuggestions[i]?.length > 0 && (
                    <ul className="dropdown rich-drop">
                      {productSuggestions[i].map((p) => (
                        <li key={p.id} onClick={() => { updateRow(i, "product_name", p.name); setProductSuggestions({}); }}>
                          <span>{p.name}</span><small>{p.division}</small><strong>₹{p.mrp}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td><input value={clean(item.batch_no)} onChange={(e) => updateRow(i, "batch_no", e.target.value)} /></td>
                <td><input type="date" value={clean(item.exp_date)} onChange={(e) => updateRow(i, "exp_date", e.target.value)} /></td>
                <td><input type="number" value={clean(item.quantity)} onChange={(e) => updateRow(i, "quantity", e.target.value)} /></td>
                <td><input type="number" value={clean(item.free)} onChange={(e) => updateRow(i, "free", e.target.value)} /></td>
                <td><input type="number" value={clean(item.mrp)} onChange={(e) => updateRow(i, "mrp", e.target.value)} /></td>
                <td><input type="number" value={clean(item.rate)} onChange={(e) => updateRow(i, "rate", e.target.value)} /></td>
                <td><input type="number" value={clean(item.gst_percent)} onChange={(e) => updateRow(i, "gst_percent", e.target.value)} /></td>
                <td className="amt-txt">₹{(item.amount || 0).toFixed(2)}</td>
                <td><button className="del-btn" onClick={() => removeRow(i)}><FaTrash /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="add-btn" onClick={addRow}><FaPlus /> Add Line</button>
      </div>

      <div className="save-container">
        {isEditMode && <button className="delete-main-btn" onClick={handleDeleteInvoice}><FaEraser /> Delete Invoice</button>}
        <button className="save-btn" onClick={handleSaveInvoice}>
          <FaSave /> {isEditMode ? "Update Invoice" : "Save Invoice"}
        </button>
      </div>
    </div>
  );
};

export default AddStockPage;