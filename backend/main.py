from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal
from models import User, Submission, AnalysisResult, IssueDetected
from analyzer import analyze_code
from sqlalchemy.orm import joinedload
from passlib.context import CryptContext
from typing import List

# Auth setups
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthRequest(BaseModel):
    email: str
    password: str = None
    full_name: str = None

class GoogleAuthRequest(BaseModel):
    email: str
    name: str = None

class CodeRequest(BaseModel):
    code: str
    language: str
    user_id: int = None

@app.get("/")
def home():
    return {"message": "AI Code Quality Assistant API"}

@app.post("/signup")
def signup(request: AuthRequest):
    db = SessionLocal()
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=request.email,
        password_hash=pwd_context.hash(request.password),
        full_name=request.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    user_data = {"id": new_user.id, "email": new_user.email, "name": new_user.full_name}
    db.close()
    return user_data

@app.post("/login")
def login(request: AuthRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.password_hash):
        db.close()
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    user_data = {"id": user.id, "email": user.email, "name": user.full_name}
    db.close()
    return user_data

@app.post("/google-login")
def google_login(request: GoogleAuthRequest):
    email = request.email
    name = request.name
    
    print(f"DEBUG: Processing Google Login for {email}")
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"DEBUG: Creating new user for {email}")
            # Create a new user for Google SSO
            user = User(
                email=email,
                full_name=name,
                password_hash=None # No local password for Google users
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        user_data = {"id": user.id, "email": user.email, "name": user.full_name}
        print(f"DEBUG: Google Login Success for {email}. User ID: {user.id}")
        return user_data
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Google Login Sync Error for {email}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/history")
def get_history(user_id: int = None):
    db = SessionLocal()
    query = db.query(Submission).options(joinedload(Submission.results))
    if user_id:
        query = query.filter(Submission.user_id == user_id)
    
    history = query.order_by(Submission.created_at.desc()).limit(10).all()
    
    results = []
    for sub in history:
        for res in sub.results:
            results.append({
                "id": sub.id,
                "score": res.score,
                "timestamp": sub.created_at
            })
    
    db.close()
    return results

@app.get("/progress")
def get_progress(user_id: int = None):
    db = SessionLocal()
    query = db.query(Submission).options(joinedload(Submission.results))
    if user_id:
        query = query.filter(Submission.user_id == user_id)
        
    history = query.order_by(Submission.created_at.desc()).limit(2).all()
    db.close()

    if len(history) < 2:
        return {"status": "insufficient_data", "message": "Not enough data to analyze progress. Submit more code."}
    
    current = history[0]
    previous = history[1]
    
    current_res = current.results[0] if current.results else None
    previous_res = previous.results[0] if previous.results else None
    
    if not current_res or not previous_res:
        return {"status": "insufficient_data", "message": "Missing continuous analysis data."}
        
    improvement = current_res.score - previous_res.score
    
    return {
        "status": "success",
        "previous_score": previous_res.score,
        "current_score": current_res.score,
        "score_improvement": improvement,
        "previous_complexity": previous_res.complexity,
        "current_complexity": current_res.complexity
    }

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    code: str = ""

@app.post("/chat")
async def chat(request: ChatRequest):
    from analyzer import chat_with_ai
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    response = chat_with_ai(messages, code=request.code)
    return {"response": response}

@app.post("/flowchart")
def flowchart(request: CodeRequest):
    from analyzer import generate_mermaid_flow
    flow = generate_mermaid_flow(request.code)
    return {"flow": flow}

@app.post("/compare-algorithm")
def compare_algorithm(request: CodeRequest):
    from analyzer import detect_algorithm, predict_efficiency
    algorithm = detect_algorithm(request.code)
    efficiency = predict_efficiency(request.code)
    
    # Map back to the expected dictionary format for the UI
    return {
        "student_algorithm": algorithm,
        "complexity": efficiency["predicted_complexity"],
        "recommended_algorithm": "Hash Map" if algorithm == "Brute Force" else "Optimal",
        "optimized_complexity": "O(n)" if algorithm == "Brute Force" else "O(1)"
    }

@app.post("/recommend-concepts")
def recommend_concepts(request: CodeRequest):
    from analyzer import detect_algorithm, detect_concepts
    algorithm = detect_algorithm(request.code)
    concepts = detect_concepts(algorithm)
    return {"recommended_concepts": concepts}

@app.post("/refactor")
def refactor(request: CodeRequest):
    from analyzer import analyze_refactor
    suggestions = analyze_refactor(request.code)
    return {"suggestions": suggestions}

@app.post("/edge-cases")
def edge_cases(request: CodeRequest):
    from analyzer import detect_edge_cases
    warnings = detect_edge_cases(request.code)
    return {"edge_case_warnings": warnings}

@app.post("/simulate")
def simulate(request: CodeRequest):
    from analyzer import run_simulation
    steps = run_simulation(request.code)
    return {"steps": steps}

@app.post("/readability")
def check_readability(request: CodeRequest):
    from analyzer import readability_analysis
    return readability_analysis(request.code)

@app.post("/test-cases")
def test_cases(request: CodeRequest):
    from analyzer import run_tests
    results = run_tests(request.code)
    return {"test_results": results}

@app.post("/bug-pattern-analysis")
def bug_analysis(request: CodeRequest):
    from analyzer import detect_undefined_variables
    return {"bug_patterns": detect_undefined_variables(request.code)}

@app.post("/efficiency")
def get_efficiency(request: CodeRequest):
    from analyzer import predict_efficiency
    return predict_efficiency(request.code)

@app.post("/analyze")
def analyze(request: CodeRequest):
    result = analyze_code(request.code)

    db = SessionLocal()
    try:
        # 1. Save Submission
        submission = Submission(
            code=request.code,
            language=request.language,
            user_id=request.user_id
        )
        db.add(submission)
        db.flush()

        # 2. Save Analysis Result (Note: DB schema might need update for categories later, using json for now if possible or just skipping DB for new fields to keep it simple)
        analysis = AnalysisResult(
            submission_id=submission.id,
            complexity=result["complexity"],
            score=result["score"],
            hint=result["hint"],
            explanation=result["explanation"],
            pattern=result["pattern"]
        )
        db.add(analysis)
        db.flush()

        # 3. Save Issues
        for issue_desc in result["issues"]:
            issue = IssueDetected(
                result_id=analysis.id,
                description=issue_desc
            )
            db.add(issue)
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving to DB: {e}")
    finally:
        db.close()

    return result
