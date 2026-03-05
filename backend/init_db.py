from sqlalchemy import text
from database import engine, Base
import models

def init_db():
    print("Terminating active connections...")
    with engine.connect() as conn:
        conn.execute(text("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = 'ai_code_quality_assistant'
              AND pid <> pg_backend_pid();
        """))
        conn.commit()
    
    print("Dropping tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()
