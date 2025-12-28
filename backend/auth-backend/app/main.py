from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from sqlalchemy import func
from dotenv import load_dotenv
import os
from typing import List, Optional
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
# Local imports
from . import models, schemas
from .db import Base, engine, get_db
from .models import User, Product, Customer, Company, Supplier,InvoiceProduct
from .schemas import (
    LoginRequest, TokenResponse, ProductSchema, CustomerSchema, 
    CompanyCreate, SupplierSchema, InvoiceCreate,InvoiceProductCreate,SalesInvoiceCreate
)
from .security import verify_password, create_access_token
from .utils import current_financial_year
from .security import SECRET_KEY, ALGORITHM, create_access_token, verify_password
from .security import hash_password
from fastapi.staticfiles import StaticFiles
from fastapi import WebSocket, WebSocketDisconnect

load_dotenv()

# Initialize Database
Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[username] = websocket

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]

    async def send_personal_message(self, message: dict, receiver: str):
        if receiver in self.active_connections:
            await self.active_connections[receiver].send_json(message)

    # NEW: Broadcast status changes to EVERYONE
    async def broadcast_status(self, username: str, status: str):
        payload = {
            "type": "status_update",
            "username": username,
            "status": status  # "online" or "offline"
        }
        for connection in self.active_connections.values():
            try:
                await connection.send_json(payload)
            except:
                pass

manager = ConnectionManager()

app = FastAPI(title="Medivision Ayurvedic API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
if not os.path.exists("static/profiles"):
    os.makedirs("static/profiles", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
# --- CORS CONFIGURATION ---
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# --- AUTHENTICATION ---
@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    
    # 1. Verify user exists and password is correct
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # 2. REMOVE OR COMMENT OUT THIS BLOCK:
    # if not user.is_active:
    #     raise HTTPException(status_code=403, detail="User is inactive")

    # 3. Generate token and return response
    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(
        access_token=token,
        username=user.username,
        company=user.company,
        financial_year=current_financial_year(),
        role=user.role,
    )

# --- 🌿 PRODUCT ENDPOINTS ---
@app.post("/products/")
def create_product(product: ProductSchema, db: Session = Depends(get_db)):
    # Create DB instance from schema
    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {"message": "✅ Product Added Successfully!", "id": new_product.id}

@app.get("/products/", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    # Returns list for frontend to calculate next PRD-xxx code
    return db.query(Product).all()



# --- 👤 CUSTOMER ENDPOINTS ---
@app.post("/customers/")
def create_customer(customer: CustomerSchema, db: Session = Depends(get_db)):
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/customers/")
def get_customers(db: Session = Depends(get_db)):
    # Returns list for frontend to calculate next MED-xxx code
    return db.query(Customer).all()

# --- 🏢 COMPANY ENDPOINTS (Supports Multiple Divisions) ---
@app.post("/companies/")
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    # divisions is a List[str] in schema, stored as JSON in Model
    db_company = Company(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@app.get("/companies/")
def get_companies(db: Session = Depends(get_db)):
    # Returns list for frontend to calculate next COMP-xxx code
    return db.query(Company).all()

# --- 📦 SUPPLIER ENDPOINTS ---
@app.post("/suppliers/")
def create_supplier(supplier: SupplierSchema, db: Session = Depends(get_db)):
    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.get("/suppliers/")
def get_suppliers(db: Session = Depends(get_db)):
    # Returns list for frontend to calculate next SUP-xxx code
    return db.query(Supplier).all()


# --- 🧾 Product INVOICE ENDPOINTS ---
# ✅ GET NEXT ENTRY NUMBER
@app.get("/invoices/next-entry-no")
def get_next_entry_no(db: Session = Depends(get_db)):
    last_entry = db.query(func.max(InvoiceProduct.entry_no)).scalar()
    return {"next_entry_no": (last_entry or 0) + 1}

@app.post("/purchase-entry/")
def save_purchase_entry(data: dict, db: Session = Depends(get_db)):
    try:
        # Loop through each product item in the purchase invoice
        for p in data["products"]:
            # 1. Store the transaction detail in 'invoice_products'
            new_row = InvoiceProduct(
                entry_no=data["entry_no"],
                entry_date=data["entry_date"],
                trading_account=data["trading_account"],
                supplier_name=data["supplier_name"],
                invoice_no=data["invoice_no"],
                invoice_date=data["invoice_date"],
                product_name=p["product_name"],
                quantity=p["quantity"],
                batch_no=p["batch_no"],
                exp_date=p.get("exp_date"),
                free=p.get("free", 0),
                mrp=p["mrp"],
                rate=p["rate"],
                gst_percent=p["gst_percent"],
                amount=p["amount"],
            )
            db.add(new_row)

            # 2. UPDATE THE STOCK in 'products' table
            # Find the product in the master table by name
            product_master = db.query(Product).filter(Product.name == p["product_name"]).first()
            
            if product_master:
                # Increment current_stock by (Quantity + Free units)
                # Ensure the quantity is treated as an integer
                qty_to_add = int(p["quantity"]) + int(p.get("free", 0))
                product_master.current_stock += qty_to_add
            else:
                # Log if product doesn't exist in the master table
                print(f"Product {p['product_name']} not found in Product Master")

        # Save all changes (Invoice rows AND stock updates) at once
        db.commit()
        return {"message": "Purchase saved and stock updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/purchase-entry/{entry_no}")
def get_purchase_entry(entry_no: int, db: Session = Depends(get_db)):
    rows = (
        db.query(InvoiceProduct)
        .filter(InvoiceProduct.entry_no == entry_no)
        .all()
    )

    if not rows:
        raise HTTPException(status_code=404, detail="Entry not found")

    first = rows[0]

    return {
        "entry_no": first.entry_no,
        "entry_date": first.entry_date,
        "trading_account": first.trading_account,
        "supplier_name": first.supplier_name,
        "supplier_gstin": first.supplier_gstin,
        "city": first.city,
        "state": first.state,
        "invoice_no": first.invoice_no,
        "invoice_date": first.invoice_date,
        "products": [
            {
                "product_name": r.product_name,
                "batch_no": r.batch_no,
                "exp_date": r.exp_date,
                "quantity": r.quantity,
                "free": r.free,
                "mrp": r.mrp,
                "rate": r.rate,
                "gst_percent": r.gst_percent,
                "amount": r.amount,
            }
            for r in rows
        ],
    }
# --- 📝 UPDATE PURCHASE ENTRY ---
@app.put("/purchase-entry/{entry_no}")
def update_purchase_entry(entry_no: int, data: dict, db: Session = Depends(get_db)):
    try:
        # 1. Reverse Stock for old items
        old_items = db.query(models.InvoiceProduct).filter_by(entry_no=entry_no).all()
        for item in old_items:
            product = db.query(models.Product).filter_by(name=item.product_name).first()
            if product:
                product.current_stock -= (item.quantity + item.free)

        # 2. Clear old records
        db.query(models.InvoiceProduct).filter_by(entry_no=entry_no).delete()

        # 3. Extract Header Info from data (Matches your React state)
        # We need these to ensure they aren't 'null' on update
        header_info = {
            "entry_date": data.get("entry_date"),
            "trading_account": data.get("trading_account"),
            "supplier_name": data.get("supplier_name"),
            "supplier_gstin": data.get("supplier_gstin"),
            "city": data.get("city"),
            "state": data.get("state"),
            "invoice_no": data.get("invoice_no"),
            "invoice_date": data.get("invoice_date"),
        }

        # 4. Add NEW items with Header Info + Product Info
        for p in data["products"]:
            # Merge header_info and product details into one record
            # **header_info spreads the supplier details into the new db_item
            db_item = models.InvoiceProduct(
                entry_no=entry_no,
                **header_info, 
                **p
            ) 
            db.add(db_item)

            # Update master stock
            product = db.query(models.Product).filter_by(name=p["product_name"]).first()
            if product:
                product.current_stock += (int(p["quantity"]) + int(p.get("free", 0)))

        db.commit()
        return {"message": "Success: Invoice updated with supplier details preserved"}
        
    except Exception as e:
        db.rollback()
        print(f"Update Error: {e}") # This helps you see errors in the terminal
        raise HTTPException(status_code=500, detail=str(e))

# --- 🗑 DELETE PURCHASE ENTRY ---
@app.delete("/purchase-entry/{entry_no}")
def delete_purchase_entry(entry_no: int, db: Session = Depends(get_db)):
    # 1. Find all records associated with this entry
    records = db.query(models.InvoiceProduct).filter(
        models.InvoiceProduct.entry_no == entry_no
    ).all()

    if not records:
        raise HTTPException(status_code=404, detail="Purchase entry not found")

    try:
        # 2. Loop through records to reverse the stock
        for item in records:
            product = db.query(models.Product).filter(
                models.Product.name == item.product_name
            ).first()
            
            if product:
                # DECREASE stock because the purchase is being deleted
                total_to_remove = int(item.quantity) + int(item.free or 0)
                product.current_stock -= total_to_remove

        # 3. Delete the records from the invoice table
        db.query(models.InvoiceProduct).filter(
            models.InvoiceProduct.entry_no == entry_no
        ).delete()

        db.commit()
        return {"message": f"Purchase entry {entry_no} deleted and stock adjusted"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

#customer invoice endpoints
# --- 🧾 SALES INVOICE ENDPOINTS ---
from sqlalchemy import func, cast, Integer

@app.get("/sales-invoice/next-no")
def get_customer_next_invoice_no(db: Session = Depends(get_db)):
    try:
        # 1. Ensure 'SalesInvoice' and 'invoice_no' match your models.py exactly
        # 2. If invoice_no is stored as a String, we must cast it to Integer to get the true Max
        max_no = db.query(func.max(cast(models.SalesInvoice.invoice_no, Integer))).scalar()
        
        return {"next_no": (max_no or 0) + 1}
    except Exception as e:
        # This will print the exact error (like 'no such column') in your VS Code/Terminal
        print(f"DATABASE CRASH: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales-invoice/{invoice_no}")
def get_invoice(invoice_no: str, db: Session = Depends(get_db)):
    # 1. Fetch the Header
    invoice = db.query(models.SalesInvoice).filter(models.SalesInvoice.invoice_no == invoice_no).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # 2. Fetch the Rows (Items)
    items = db.query(models.SalesInvoiceItem).filter(models.SalesInvoiceItem.invoice_no == invoice_no).all()

    # 3. Return the exact structure React is looking for
    return {
        "header": {
            "invoiceNo": invoice.invoice_no,
            "invoiceDate": invoice.invoice_date,
            "tradingAccount": invoice.trading_account,
            "customer": invoice.customer,
            "area": invoice.area,
            "city": invoice.city,
            "state": invoice.state,
            "paymentMode": invoice.payment_mode,
            "dueDays": invoice.due_days
        },
        "rows": [
            {
                "pcode": item.pcode,
                "name": item.name,
                "batch": item.batch,
                "exp": item.exp,
                "qty": item.qty,
                "rate": item.rate,
                "gst": item.gst,
                "discount": item.discount,
                "line_total": item.line_total
            } for item in items
        ],
        "totals": {
            "subtotal": invoice.subtotal,
            "totalDiscount": invoice.total_discount,
            "totalGST": invoice.total_gst,
            "grandTotal": invoice.grand_total
        },
        "notes": invoice.notes
    }

@app.get("/customers/search")
def search_customers(q: str = Query(default="", min_length=1), db: Session = Depends(get_db)):
    customers = db.query(Customer).filter(Customer.name.ilike(f"%{q}%")).all()
    return [
        {
            "id": c.id, 
            "name": c.name, 
            "city": c.city, 
            "state": c.state, 
            "area": c.area
        } for c in customers
    ]

@app.get("/products/search")
def search_c_products(q: str = Query(...), db: Session = Depends(get_db)):
    # 1. Find the product in the master table
    products = db.query(Product).filter(Product.name.ilike(f"%{q}%")).all()
    
    results = []
    for p in products:
        # 2. Look for the LATEST purchase entry for this specific product 
        # to get Batch, Expiry, and Rate
        latest_stock = db.query(InvoiceProduct).filter(
            InvoiceProduct.product_name == p.name
        ).order_by(InvoiceProduct.id.desc()).first()
        
        results.append({
            "pcode": p.code,
            "name": p.name,
            "packing": p.packing or "",
            "mrp": p.maxMRP or 0,
            "stock": p.current_stock,
            # Pull Batch and Expiry from the transaction record
            "batch": latest_stock.batch_no if latest_stock else "NO BATCH",
            "exp": latest_stock.exp_date.isoformat() if latest_stock and latest_stock.exp_date else "",
            "rate": latest_stock.rate if latest_stock else p.maxMRP,
        })
    return results

@app.post("/sales-invoice")
def create_sales_invoice(data: SalesInvoiceCreate, db: Session = Depends(get_db)):
    try:
        # 1. Save Header Info
        # Make sure these keys match your models.SalesInvoice columns exactly!
        new_invoice = models.SalesInvoice(
            invoice_no=data.header.invoiceNo,
            invoice_date=data.header.invoiceDate,
            trading_account=data.header.tradingAccount, # Added
            customer=data.header.customer, # Changed from customer_name
            area=data.header.area,         # Added
            city=data.header.city,         # Added
            payment_mode=data.header.paymentMode,
            due_days=data.header.dueDays,
            notes=data.notes,
            subtotal=data.totals.get("subtotal", 0),
            total_discount=data.totals.get("totalDiscount", 0),
            total_gst=data.totals.get("totalGST", 0),
            grand_total=data.totals.get("grandTotal", 0), # Changed from total_amount
        )
        db.add(new_invoice)

        # 2. Process Rows & Update Stock
        for r in data.rows:
            # Save Item Record (Check these column names too!)
            new_item = models.SalesInvoiceItem(
                invoice_no=data.header.invoiceNo,
                name=r.name, # Ensure your model uses 'name' or 'product_name'
                batch=r.batch,
                exp=r.exp,   # Ensure your model uses 'exp' or 'expiry'
                qty=r.qty,
                rate=r.rate,
                gst=r.gst,
                discount=r.discount,
                line_total=0 # Calculate if needed or add a column
            )
            db.add(new_item)

            # --- Stock Update ---
            product = db.query(models.Product).filter(models.Product.name == r.name).first()
            if product:
                product.current_stock -= (r.qty + r.free)

        db.commit()
        return {"status": "success"}

    except Exception as e:
        db.rollback()
        # This will print the exact error to your terminal to help you debug
        print(f"Database Error: {e}") 
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

# 1. DELETE ENDPOINT
@app.delete("/sales-invoice/{invoice_no}")
def delete_invoice(invoice_no: str, db: Session = Depends(get_db)):
    # 1. Get items to restore stock
    items = db.query(models.SalesInvoiceItem).filter(models.SalesInvoiceItem.invoice_no == invoice_no).all()
    
    for item in items:
        # FIX: Change item.product_name to item.name
        product = db.query(models.Product).filter(models.Product.name == item.name).first()
        if product:
            # Restore stock: add back the quantity and free items previously sold
            product.current_stock += (item.qty + getattr(item, 'free', 0))
    
    # 2. Delete the records
    db.query(models.SalesInvoiceItem).filter(models.SalesInvoiceItem.invoice_no == invoice_no).delete()
    db.query(models.SalesInvoice).filter(models.SalesInvoice.invoice_no == invoice_no).delete()
    
    db.commit()
    return {"status": "deleted"}

# 2. UPDATE ENDPOINT (PUT)
@app.put("/sales-invoice/{invoice_no}")
def update_invoice(invoice_no: str, data: SalesInvoiceCreate, db: Session = Depends(get_db)):
    # Simplest way: Delete old items (restore stock) and re-run the create logic
    delete_invoice(invoice_no, db)
    return create_sales_invoice(data, db)

# --- 📦 SUPPLIER SEARCH (Live Search) ---
@app.get("/suppliers/search")
def search_suppliers(q: str = Query(default="", min_length=1), db: Session = Depends(get_db)):
    # Using .ilike for case-insensitive search
    suppliers = db.query(models.Supplier).filter(
        models.Supplier.supplier_name.ilike(f"%{q}%")
    ).all()
    
    return [
        {
            "id": s.id, 
            "name": s.supplier_name, 
            "gstin": s.gstin, 
            "city": s.city,
              # Added state to match your frontend requirements
        } 
        for s in suppliers
    ]
# --- 🌿 PRODUCT SEARCH (Multi-Column Recommendations) ---
@app.get("/products/search")
def search_products(q: str = Query(default="", min_length=1), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.name.ilike(f"%{q}%")).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "mrp": p.maxMRP or 0.0,
            "division": p.division or "N/A",
            
        } for p in products
    ]

#stock update endpoint

# --- 🌿 PRODUCT STOCK SEARCH ---
@app.get("/api/stock/search")
def search_stock(q: str = Query(default="", min_length=1), db: Session = Depends(get_db)):
    # Search products by name or code
    products = db.query(models.Product).filter(
        (models.Product.name.ilike(f"%{q}%")) | (models.Product.code.ilike(f"%{q}%"))
    ).all()
    
    return [
        {
            "id": p.id,
            "pcode": p.code,
            "name": p.name,
            "packing": p.packing,
            "division": p.division,
            "mrp": p.maxMRP,
            "stock": p.current_stock # This is the critical field from the Invoice update
        } for p in products
    ]

#dashboard endpoint
@app.get("/api/dashboard-stats")
def get_dashboard_stats(
    from_date: date = Query(...), 
    to_date: date = Query(...), 
    db: Session = Depends(get_db)
):
    try:
        # 1. Total Sales
        total_sales = db.query(func.sum(models.SalesInvoice.grand_total)).filter(
            models.SalesInvoice.invoice_date >= from_date,
            models.SalesInvoice.invoice_date <= to_date
        ).scalar() or 0

        # 2. Orders Count
        orders_count = db.query(models.SalesInvoice).filter(
            models.SalesInvoice.invoice_date >= from_date,
            models.SalesInvoice.invoice_date <= to_date
        ).count()

        # 3. Low Stock
        low_stock_count = db.query(models.Product).filter(
            models.Product.current_stock <= 10
        ).count()

        # 4. Near Expiry (Adjust 'expiry' to your actual column name)
        try:
            ninety_days_later = date.today() + timedelta(days=90)
            # CHANGE 'expiry' below to match your models.py
            near_expiry_count = db.query(models.Product).filter(
                models.InvoiceProduct.entry_date <= ninety_days_later, 
                models.InvoiceProduct.entry_date >= date.today()
            ).count()
        except Exception:
            print("Warning: Expiry column not found in Product table")
            near_expiry_count = 0

        return {
            "totalSales": float(total_sales),
            "orders": orders_count,
            "lowStock": low_stock_count,
            "nearExpiry": near_expiry_count
        }
    except Exception as e:
        print(f"Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/users/me")
def get_current_user_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # Now using the synced SECRET_KEY and ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "company": user.company,
            "profile_pic": user.profile_pic
        }
    except JWTError as e:
        print(f"JWT Error: {e}") # This will likely be empty now!
        raise HTTPException(status_code=401, detail="Session expired")
  
# --- GET ALL USERS (For Admin Management) ---
@app.get("/api/users/all")
def get_all_users(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # 1. We still decode the token to make sure they are a valid logged-in user
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 2. We removed the "Admin only" check. Now any valid token can pass.
        
        # 3. Return all users
        return db.query(models.User).all()
        
    except JWTError:
        # If the token is fake or expired, they still get a 401
        raise HTTPException(status_code=401, detail="Invalid session. Please login.")
# --- DELETE USER ---
@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete users")

    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user_to_delete)
    db.commit()
    return {"message": "User deleted successfully"}

# --- PROFILE PIC UPLOAD (Static implementation) ---
import shutil
from fastapi import File, UploadFile

@app.post("/api/users/upload-pic")
def upload_profile_pic(
    file: UploadFile = File(...), 
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    username = payload.get("sub")
    
    # Create directory if it doesn't exist
    os.makedirs("static/profiles", exist_ok=True)
    
    file_path = f"static/profiles/{username}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update DB
    user = db.query(models.User).filter(models.User.username == username).first()
    user.profile_pic = f"http://127.0.0.1:8000/{file_path}"
    db.commit()
    
    return {"url": user.profile_pic}

@app.post("/auth/register")
def register_user(payload: dict, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # 1. Verify if the person making this request is an Admin
    auth_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if auth_payload.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can create new accounts")

    # 2. Check if user already exists
    existing_user = db.query(models.User).filter(models.User.username == payload["username"]).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # 3. Create the new user
    new_user = models.User(
        username=payload["username"],
        password_hash=hash_password(payload["password"]), # Hash the password!
        role=payload.get("role", "Employee"),
        company=auth_payload.get("company", "Medivision"),
        is_active=False
    )
    
    db.add(new_user)
    db.commit()
    return {"message": f"User {new_user.username} created successfully"}

@app.get("/api/chat/history/{other_user}")
def get_chat_history(other_user: str, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    current_user = payload.get("sub")
    
    # Fetch messages between current_user and other_user
    messages = db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender == current_user) & (models.ChatMessage.receiver == other_user)) |
        ((models.ChatMessage.sender == other_user) & (models.ChatMessage.receiver == current_user))
    ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    # Mark messages as read
    db.query(models.ChatMessage).filter(
        models.ChatMessage.sender == other_user, 
        models.ChatMessage.receiver == current_user
    ).update({"is_read": True})
    db.commit()
    
    # FIX: Convert SQLAlchemy objects to a list of dictionaries
    return [
        {
            "id": m.id,
            "sender": m.sender,
            "receiver": m.receiver,
            "message": m.message,
            "timestamp": m.timestamp.isoformat() if m.timestamp else None,
            "is_read": m.is_read
        } for m in messages
    ]

@app.websocket("/ws/chat/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str, db: Session = Depends(get_db)):
    await manager.connect(username, websocket)
    
    # Update status to active
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        user.is_active = True
        db.commit()
    await manager.broadcast_status(username, "online")
        
    try:
        while True:
            data = await websocket.receive_json()
            
            # Save to Database
            new_msg = models.ChatMessage(
                sender=username,
                receiver=data["receiver"],
                message=data["message"]
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg) # Get the ID and timestamp generated by DB

            # Send Message payload with consistent keys
            payload = {
                "type": "chat_message",
                "sender": username,
                "message": data["message"],
                "timestamp": new_msg.timestamp.isoformat() # Consistent date format
            }
            
            # Send to receiver
            await manager.send_personal_message(payload, data["receiver"])
            
    except WebSocketDisconnect:
        manager.disconnect(username)
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            user.is_active = False
            db.commit()
        await manager.broadcast_status(username, "offline")


@app.get("/api/recent-orders")
def get_recent_orders(limit: int = 5, db: Session = Depends(get_db)):
    # Returns the latest sales invoices to the dashboard
    return db.query(models.SalesInvoice).order_by(models.SalesInvoice.invoice_date.desc()).limit(limit).all()