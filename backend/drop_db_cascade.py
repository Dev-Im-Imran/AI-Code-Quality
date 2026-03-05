from sqlalchemy import create_engine, text
from database import DATABASE_URL

def drop_all_cascade():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Dropping all tables with CASCADE...")
        # Get all table names
        result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in result]
        
        for table in tables:
            print(f"Dropping {table}...")
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        
        conn.commit()
    print("All tables dropped successfully!")

if __name__ == "__main__":
    drop_all_cascade()
