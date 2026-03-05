from database import SessionLocal
from models import Submission, AnalysisResult

def test_db():
    try:
        db = SessionLocal()
        print("Connecting to DB...")
        
        sub = Submission(code="test", language="python")
        db.add(sub)
        db.commit()
        print("Submission saved!")
        
        res = AnalysisResult(complexity="O(1)", score=100, issues="", hint="none")
        db.add(res)
        db.commit()
        print("Result saved!")
        
        db.close()
        print("Connection healthy!")
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    test_db()
