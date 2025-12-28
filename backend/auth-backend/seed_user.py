from app.db import Base, engine, SessionLocal
from app.models import User
from app.security import hash_password

def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            user = User(
                username="admin",
                password_hash=hash_password("1234"),
                company="Banana",
                role="Admin",
            )
            db.add(user)
            db.commit()
            print("✅ Created user 'admin' with password '1234'")
        else:
            print("User 'admin' already exists")
    finally:
        db.close()

if __name__ == "__main__":
    run()
