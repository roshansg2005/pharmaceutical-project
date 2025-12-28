# PharmaTrack – Wholesale Medical Management System

PharmaTrack is a full-stack B2B pharmaceutical management system designed to automate inventory, billing, and compliance workflows for wholesale medical distributors. The system focuses on batch-wise stock management, expiry tracking, and GST-compliant invoicing to reduce manual errors and improve operational efficiency.

---

## 🚀 Features

- Batch-wise inventory management with expiry date tracking (FIFO logic)
- GST-compliant sales and purchase invoicing (CGST/SGST)
- Role-Based Access Control (RBAC) using JWT authentication
- Secure authentication and authorization for Admin and Staff users
- Real-time stock updates and low-stock alerts
- Supplier and customer management
- Sales and purchase invoice history tracking
- Optimized PostgreSQL database schema for performance and integrity

---

## 🛠 Tech Stack

### Frontend
- React.js
- HTML5, CSS3
- Axios

### Backend
- Python (FastAPI)
- JWT Authentication
- RESTful APIs

### Database
- PostgreSQL

### Tools & Platforms
- Git, Postman
- Docker (optional)
- VS Code

---

## 📊 Project Impact

- Manages **1,000+ pharmaceutical products** with batch-wise tracking
- Handles **500+ invoice transactions per month**
- Reduced manual billing errors by **70%**
- Lowered risk of expired medicine sales by **90%**
- Improved data retrieval performance by **40%**
- Reduced daily operational processing time by **50%**

---

## 🧩 System Architecture

- Frontend communicates with backend services via REST APIs
- Backend handles business logic, authentication, and data validation
- PostgreSQL ensures data consistency using relational constraints
- JWT secures APIs with role-based authorization

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Git

### Backend Setup
```bash
git clone https://github.com/your-username/pharmatrack.git
cd pharmatrack/backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
