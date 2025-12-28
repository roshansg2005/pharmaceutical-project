from datetime import datetime

def current_financial_year() -> str:
    now = datetime.now()
    year = now.year
    month = now.month
    if month >= 4:  # April starts the FY
        return f"{year}-{year+1}"
    return f"{year-1}-{year}"
