import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./userProfile.css";

const API_BASE = "http://127.0.0.1:8000";
const WS_BASE = "ws://127.0.0.1:8000";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMsg, setTypedMsg] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({}); 

  // --- NEW STATE FOR REGISTRATION POPUP ---
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerData, setRegisterData] = useState({ username: "", password: "", role: "Employee" });
  // ----------------------------------------
  
  const socket = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Initial Data Load
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = "/"; return; }

      const [userRes, teamRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setUser(userRes.data);
      setEmployees(teamRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    } finally { setLoading(false); }
  };

  // 2. Load Chat History from Database
  const loadChatHistory = async (otherUsername) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/chat/history/${otherUsername}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data); // Load old messages
      setUnreadCounts(prev => ({ ...prev, [otherUsername]: 0 }));
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const formatChatDate = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? "Just now" 
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 3. REAL-TIME AUTO-REFRESH LOGIC
  useEffect(() => {
    if (user && !socket.current) {
      socket.current = new WebSocket(`${WS_BASE}/ws/chat/${user.username}`);

      socket.current.onopen = () => console.log("WebSocket Connected");
      
      socket.current.onclose = () => {
        console.log("WebSocket Disconnected");
        socket.current = null;
      };
    }

    if (socket.current) {
      socket.current.onmessage = (event) => {
        const incoming = JSON.parse(event.data);

        // Instant Status Update (Green/Red Dot)
        if (incoming.type === "status_update") {
          setEmployees(prev => prev.map(emp => 
            emp.username === incoming.username 
              ? { ...emp, is_active: incoming.status === "online" } 
              : emp
          ));
        }
        
        // Instant Chat Update (Auto-refresh messages)
        else if (incoming.type === "chat_message" || incoming.message) {
           const isFromCurrentPartner = selectedChat && incoming.sender === selectedChat.username;

           if (isFromCurrentPartner) {
             setMessages((prev) => [...prev, incoming]);
           } else {
             setUnreadCounts(prev => ({
               ...prev,
               [incoming.sender]: (prev[incoming.sender] || 0) + 1
             }));
           }
        }
      };
    }
  }, [user, selectedChat]); // Dependency array ensures real-time updates for open chat

  // 4. Send Message via Socket
  const sendMessage = () => {
    if (socket.current && typedMsg.trim() && selectedChat) {
      const payload = { 
        receiver: selectedChat.username, 
        message: typedMsg 
      };
      socket.current.send(JSON.stringify(payload));

      const myMsg = {
        sender: user.username,
        message: typedMsg,
        timestamp: new Date().toISOString(), // Fixes Invalid Date issue
      };

      setMessages((prev) => [...prev, myMsg]);
      setTypedMsg("");
    }
  };

  // --- NEW FUNCTION TO HANDLE REGISTRATION ---
  const handleRegister = async () => {
    if (!registerData.username || !registerData.password) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/auth/register`, registerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`User ${registerData.username} created successfully!`);
      setShowRegisterModal(false);
      setRegisterData({ username: "", password: "", role: "Employee" });
      fetchData(); // Refresh the employee list
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create user");
    }
  };
  // -------------------------------------------
  if (loading) return <div className="loader">Connecting to PIRENS Network...</div>;
  if (!user) return null;

  return (
    <div className="pirens-dashboard">
      <header className="brand-header">
        <div className="logo-section">
          <div className="logo-symbol">
            <div className="circle olive"></div>
            <div className="circle gold"></div>
            <div className="circle terra"></div>
          </div>
          <div className="logo-text-group">
            <h1 className="logo-main">PIRENS</h1>
            <div className="vertical-divider"></div>
            <div className="logo-sub">
              <span className="sub-top">Dr. Vikhe Patil Memorial</span>
              <span className="sub-bottom">Ayurvedic Hospital & Research Centre</span>
            </div>
          </div>
        </div>
      </header>

      <div className="content-grid">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-img-large-wrapper">
              <img 
                src={user.profile_pic || "https://via.placeholder.com/200"} 
                alt="Profile" 
                className="profile-img-large"
              />
              <div className="online-indicator-large"></div>
            </div>
            <h2 className="user-name">{user.username}</h2>
            <span className="user-role-badge">{user.role}</span>
            <div className="info-list">
              <div className="info-item">
                <label>Organization</label>
                <span>{user.company}</span>
              </div>
              <div className="info-item">
                <label>Department</label>
                <span>Ayurvedic Research</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="team-section">
          <div className="section-header">
            <h3>Staff Directory</h3>
            {user.role === "Admin" && (
              <button 
                className="action-btn" 
                style={{ marginLeft: "auto", cursor: "pointer", fontSize: "0.9rem" }}
                onClick={() => setShowRegisterModal(true)}
              >
                + Add User
              </button>
            )}
          </div>
          <div className="staff-grid">
            {employees.map((emp) => (
              <div key={emp.id} className="staff-card">
                <div className="staff-header-row">
                  <div className="staff-img-wrapper">
                    <img src={emp.profile_pic || "https://via.placeholder.com/80"} alt={emp.username} />
                    <span className={`status-dot ${emp.is_active ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="staff-info">
                    <h4>{emp.username}</h4>
                    <p>{emp.role}</p>
                  </div>
                </div>
                {emp.username !== user.username && (
                  <div className="staff-actions">
                    <button 
                      className="action-btn chat-btn"
                      onClick={() => { 
                        setSelectedChat(emp); 
                        loadChatHistory(emp.username); 
                      }}
                    >
                      💬 Message
                      {unreadCounts[emp.username] > 0 && (
                        <span className="badge-count">{unreadCounts[emp.username]}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {selectedChat && (
        <div className="chat-interface">
          <div className="chat-top-bar">
            <div className="chat-user-info">
              <div className="chat-avatar-small">
                <img src={selectedChat.profile_pic || "https://via.placeholder.com/40"} alt="" />
              </div>
              <span>{selectedChat.username}</span>
            </div>
            <button className="close-chat" onClick={() => {
              setSelectedChat(null);
              setMessages([]); // Optional: clear view on close
            }}>✕</button>
          </div>
          
          <div className="chat-messages-area">
            {messages.map((m, i) => (
              <div key={i} className={`message-row ${m.sender === user.username ? "sent" : "received"}`}>
                <div className="message-bubble">
                  <p>{m.message || "..."}</p>
                  <span className="timestamp">{formatChatDate(m.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div className="chat-input-area">
            <input 
              placeholder="Type a message..." 
              value={typedMsg}
              onChange={(e) => setTypedMsg(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage}>➤</button>
          </div>
        </div>
      )}
{/* --- ADDED POPUP MODAL (Inline Styles to avoid touching CSS file) --- */}
      {showRegisterModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white", padding: "25px", borderRadius: "10px",
            width: "350px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column", gap: "15px"
          }}>
            <h3 style={{ margin: 0, color: "#333", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              Register New User
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.85rem", color: "#666" }}>Username</label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.85rem", color: "#666" }}>Password</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.85rem", color: "#666" }}>Role</label>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "5px", background: "white" }}
              >
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button 
                onClick={() => setShowRegisterModal(false)} 
                style={{ 
                  padding: "8px 15px", cursor: "pointer", border: "1px solid #ccc", 
                  backgroundColor: "white", borderRadius: "5px",color:"black" 
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRegister} 
                style={{ 
                  padding: "8px 15px", cursor: "pointer", border: "none", 
                  backgroundColor: "#4CAF50", color: "white", borderRadius: "5px", fontWeight: "bold"
                }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------------ */}

      
    </div>
  );
}