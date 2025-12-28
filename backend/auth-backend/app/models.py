from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, JSON, Date,Text,DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .db import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(128), default="Medivision")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String(32), default="Admin")
    # Add this column for profile pictures
    profile_pic: Mapped[str] = mapped_column(String(500), nullable=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String)
    receiver = Column(String)
    message = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    current_stock = Column(Integer, default=0)
    packing = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    division = Column(String, nullable=True) # Matches frontend change
    category = Column(String, nullable=True)
    genericGroup = Column(String, nullable=True)
    therapeuticGroup = Column(String, nullable=True)
    drugSchedule = Column(String, nullable=True)
    tabPack = Column(String, nullable=True)
    tabPacking = Column(String, nullable=True)
    unitInBox = Column(Integer, nullable=True)
    unitInCase = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    maxMRP = Column(Float, nullable=True)
    maxQty = Column(Integer, nullable=True)
    rowColor = Column(String, default="#2d6a4f") # Tulsi Green
    flashMessage = Column(String, nullable=True)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    owner_name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    landmark = Column(String, nullable=True)
    area = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    mobile = Column(String)
    whatsapp = Column(String, nullable=True)
    email = Column(String, nullable=True)
    drug_license = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    refrigerator_detail = Column(String, nullable=True) # Added
    opening_balance = Column(String, nullable=True)
    tcs = Column(Boolean, default=False)
    tds = Column(Boolean, default=False)

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    regd_code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    divisions = Column(JSON, default=[]) # Imported JSON fixes the error
    contact_person = Column(String, nullable=True)
    address = Column(String, nullable=True)
    mobile = Column(String)
    email = Column(String, nullable=True)
    tds = Column(Boolean, default=False)
    einv = Column(Boolean, default=False)
    pi_round = Column(Boolean, default=False)

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    supplier_name = Column(String, index=True)
    owner_name = Column(String)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    mobile = Column(String)
    whatsapp = Column(String, nullable=True)
    email = Column(String, nullable=True)
    drug_license = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    opening_balance = Column(String, nullable=True)
    tds = Column(Boolean, default=False)

class SalesInvoice(Base):
    __tablename__ = "sales_invoices"
    id = Column(Integer, primary_key=True)
    invoice_no = Column(String, unique=True, index=True)
    state = Column(String)
    invoice_date = Column(Date)
    customer = Column(String) # If this is 'customer', use customer=...
    trading_account = Column(String)
    customer = Column(String)
    area = Column(String)
    city = Column(String)
    payment_mode = Column(String)
    due_days = Column(Integer)
    notes = Column(String)
    subtotal = Column(Float)
    total_discount = Column(Float)
    total_gst = Column(Float)
    grand_total = Column(Float)

class SalesInvoiceItem(Base):
    __tablename__ = "sales_invoice_items"
    id = Column(Integer, primary_key=True)
    invoice_no = Column(String, index=True)
    pcode = Column(String)
    name = Column(String)
    batch = Column(String)
    exp = Column(Date)
    qty = Column(Integer)
    rate = Column(Float)
    gst = Column(Float)
    discount = Column(Float)
    line_total = Column(Float)

class InvoiceProduct(Base):
    __tablename__ = "invoice_products"

    id = Column(Integer, primary_key=True, index=True)

    # ---------- INVOICE HEADER ----------
    entry_no = Column(Integer, index=True)
    entry_date = Column(Date)

    trading_account = Column(String)
    supplier_name = Column(String)
    supplier_gstin = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)

    invoice_no = Column(String)
    invoice_date = Column(Date)

    # ---------- PRODUCT / STOCK ----------
    product_name = Column(String)
    batch_no = Column(String)
    exp_date = Column(Date)

    quantity = Column(Integer)
    free = Column(Integer, default=0)
    mrp = Column(Float)
    rate = Column(Float)
    gst_percent = Column(Float)
    amount = Column(Float)

