from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
from datetime import date
from typing import Union

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    company: str
    financial_year: str
    role: str

# --- Product Schema ---
class ProductSchema(BaseModel):
    code: str
    name: str
    packing: Optional[str] = None
    manufacturer: Optional[str] = None
    division: Optional[str] = None
    category: Optional[str] = None
    genericGroup: Optional[str] = None
    therapeuticGroup: Optional[str] = None
    drugSchedule: Optional[str] = None
    tabPack: Optional[str] = None
    tabPacking: Optional[str] = None
    unitInBox: Optional[int] = None
    unitInCase: Optional[int] = None
    weight: Optional[float] = None
    maxMRP: Optional[float] = None
    maxQty: Optional[int] = None
    rowColor: Optional[str] = "#2d6a4f"
    flashMessage: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Customer Schema ---
class CustomerSchema(BaseModel):
    code: str
    name: str
    owner_name: Optional[str] = None
    address: Optional[str] = None
    landmark: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    mobile: str
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    drug_license: Optional[str] = None
    gstin: Optional[str] = None
    refrigerator_detail: Optional[str] = None # Added
    opening_balance: Optional[str] = None
    tcs: bool = False
    tds: bool = False

    model_config = ConfigDict(from_attributes=True)

# --- Supplier Schema ---
class SupplierSchema(BaseModel):
    code: str
    supplier_name: str
    owner_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    mobile: str
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    drug_license: Optional[str] = None
    gstin: Optional[str] = None
    opening_balance: Optional[str] = None
    tds: bool = False

    model_config = ConfigDict(from_attributes=True)

# --- Company Schema ---
class CompanyBase(BaseModel):
    regd_code: str
    name: str
    divisions: List[str]
    contact_person: Optional[str] = None
    address: Optional[str] = None
    mobile: str
    email: Optional[EmailStr] = None
    tds: bool = False
    einv: bool = False
    pi_round: bool = False

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Invoice Schemas ---
class InvoiceProductBase(BaseModel):
    product_name: str
    batch: str
    expiry: str
    qty: int
    free: int = 0
    mrp: float
    rate: float
    gst_percent: float
    amount: float


class InvoiceProduct(InvoiceProductBase):
    id: int
    invoice_id: int
    model_config = ConfigDict(from_attributes=True)

# ---------- STOCK PRODUCT ----------
class InvoiceProductCreate(BaseModel):
    # 🔹 IMPORTANT: keep invoice fields OPTIONAL
    entry_no: Optional[int] = None
    entry_date: Optional[date] = None
    trading_account: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_gstin: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    invoice_no: Optional[str] = None
    invoice_date: Optional[date] = None   # ✅ FIX HERE

    # 🔹 Product fields (required)
    product_name: str
    batch_no: str
    exp_date: date
    quantity: int
    free: int = 0
    mrp: float
    rate: float
    gst_percent: float
    amount: float
    current_stock: Optional[int] = None


# ---------- customer PURCHASE INVOICE ----------
class InvoiceCreate(BaseModel):
    entry_no: int
    entry_date: date
    trading_account: str
    supplier_name: str
    supplier_gstin: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    invoice_no: str
    invoice_date: date
    products: List[InvoiceProductCreate]
    
class SalesRow(BaseModel):
    name: str
    batch: str
    exp: date
    qty: int
    free: int
    rate: float
    gst: float
    discount: float

class SalesHeader(BaseModel):
    invoiceNo: str
    invoiceDate: date
    tradingAccount: str
    customer: str
    area: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    paymentMode: str
    dueDays: int

class SalesInvoiceCreate(BaseModel):
    header: SalesHeader
    rows: List[SalesRow]
    totals: dict
    notes: Optional[str] = ""


class SalesTotals(BaseModel):
    subtotal: float
    totalDiscount: float
    totalGST: float
    grandTotal: float

