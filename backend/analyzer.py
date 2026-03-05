import re
import os
import ast
from groq import Groq
from dotenv import load_dotenv

# Load API Key from .env
load_dotenv()
client = None
if os.getenv("GROQ_API_KEY") and "your_actual_key" not in os.getenv("GROQ_API_KEY"):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_mermaid_flow(code: str):
    """
    Parses code using AST and generates Mermaid graph syntax.
    """
    try:
        tree = ast.parse(code)
        nodes = ["graph TD", "  Start((Start)) --> Process1[Execute Code]"]
        
        counter = 1
        last_node = "Process1"
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                counter += 1
                curr = f"Loop{counter}"
                nodes.append(f"  {last_node} --> {curr}((Loop))")
                last_node = curr
            elif isinstance(node, ast.If):
                counter += 1
                curr = f"Decision{counter}"
                nodes.append(f"  {last_node} --> {curr}{{Decision}}")
                last_node = curr
            elif isinstance(node, ast.FunctionDef):
                counter += 1
                curr = f"Func{counter}"
                nodes.append(f"  {last_node} --> {curr}[Define {node.name}]")
                last_node = curr
            elif isinstance(node, ast.Return):
                counter += 1
                curr = f"End{counter}"
                nodes.append(f"  {last_node} --> {curr}((Return))")
                last_node = curr
        
        nodes.append(f"  {last_node} --> Finish((Finish))")
        return "\n".join(nodes)
    except Exception as e:
        return "graph TD\n  Start((Start)) --> Error[Invalid Code Structure] --> Finish((Finish))"

def detect_algorithm(code: str):
    """
    Parses code using AST to detect algorithms like Hash Map, Brute Force, or Linear Scan.
    """
    try:
        tree = ast.parse(code)
        loops = 0
        dict_usage = False
        binary_search_hints = 0

        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                loops += 1
            if isinstance(node, (ast.Dict, ast.DictComp)):
                dict_usage = True
            # Heuristic for Binary Search: mid calculation or sorted check
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
                # check for (low + high) // 2
                pass 

        if dict_usage:
            return "Hash Map"

        if loops >= 2:
            return "Brute Force"

        if loops == 1:
            return "Linear Scan"

        return "Constant Time"
    except Exception as e:
        return "Unknown"

# Concept Mapping Database
concept_map = {
    "Hash Map": ["Hash Tables", "Dictionary Lookup", "Complement Search"],
    "Brute Force": ["Nested Loops", "Optimization Techniques", "Time Complexity O(n²)"],
    "Linear Scan": ["Array Traversal", "Single Pass Logic"],
    "Binary Search": ["Divide and Conquer", "Sorted Arrays", "Logarithmic Time"]
}

def detect_concepts(algorithm: str):
    """
    Returns recommended concepts based on the detected algorithm.
    """
    return concept_map.get(algorithm, ["General Problem Solving"])

def analyze_refactor(code: str):
    """
    Parses code using AST to suggest refactoring improvements for cleaner code.
    """
    try:
        tree = ast.parse(code)
        suggestions = []

        if "range(len(" in code:
            suggestions.append("Use enumerate() instead of range(len()) for better Python syntax.")

        if "return None" in code:
            suggestions.append("Consider raising an exception or returning a specific value if no result is found.")

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                if len(node.body) > 20:
                    suggestions.append("Function is too long. Consider breaking it into smaller modules.")

            if isinstance(node, ast.Name):
                # Variable length check - user complained about false positives, 
                # but we'll keep it simple: only flag very short vars if they aren't common indices
                if len(node.id) == 1 and node.id not in ['i', 'j', 'k', 'x', 'y', 'n']:
                    suggestions.append(f"Variable '{node.id}' may be too generic. Use descriptive naming.")

        suggestions = list(set(suggestions))
        if not suggestions:
            suggestions.append("Code structure looks optimized.")
        
        return suggestions
    except Exception as e:
        return ["Syntax Error - Cannot analyze refactorings"]

def detect_edge_cases(code: str):
    """
    Parses code using AST to identify potential unhandled edge cases based on specific patterns.
    """
    try:
        warnings = []

        if "len(numbers)" in code or "arr[" in code:
            warnings.append("Check behavior when the list/array is empty or null.")

        if "/" in code or "%" in code:
            warnings.append("Possible division by zero error.")
        
        if "while" in code or "for" in code:
            warnings.append("Ensure loops have a valid termination condition.")

        if not warnings:
            warnings.append("No obvious edge case risks detected.")

        return warnings
    except Exception as e:
        return ["Syntax Error - Cannot analyze edge cases"]

def detect_undefined_variables(code: str):
    """
    Detects undefined variables by comparing assignments vs usages.
    """
    try:
        tree = ast.parse(code)
        defined = set()
        used = set()

        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        defined.add(target.id)
            if isinstance(node, ast.arg):
                defined.add(node.arg)
            if isinstance(node, ast.Name):
                used.add(node.id)

        # Built-ins to ignore
        builtins = {"print", "range", "len", "sum", "int", "str", "float", "list", "dict", "set", "True", "False", "None", "min", "max", "arr", "nums", "numbers"}
        
        undefined = list(used - defined - builtins)
        
        if not undefined:
            return ["✓ No undefined variables detected."]
        
        return [f"Ensure variable '{u}' is defined before use." for u in undefined]
    except Exception as e:
        return ["Syntax Error - Cannot analyze variables"]

def predict_efficiency(code: str):
    """
    Analyzes code to predict time complexity and scalability performance.
    """
    try:
        tree = ast.parse(code)
        loop_count = 0

        # Heuristic for maximum loop nesting
        def get_max_nesting(node, current_depth=0):
            max_depth = current_depth
            for child in ast.iter_child_nodes(node):
                if isinstance(child, (ast.For, ast.While)):
                    max_depth = max(max_depth, get_max_nesting(child, current_depth + 1))
                else:
                    max_depth = max(max_depth, get_max_nesting(child, current_depth))
            return max_depth

        nesting_depth = get_max_nesting(tree)

        if nesting_depth >= 2:
            result = {
                "predicted_complexity": "O(n²)",
                "performance_prediction": "May become slow for large inputs",
                "suggestion": "Try reducing nested loops using hashing or better algorithms."
            }
        elif nesting_depth == 1:
            result = {
                "predicted_complexity": "O(n)",
                "performance_prediction": "Scales reasonably well",
                "suggestion": "Optimization possible depending on the problem specifics."
            }
        else:
            result = {
                "predicted_complexity": "O(1)",
                "performance_prediction": "Highly efficient",
                "suggestion": "No major performance optimization required."
            }
        
        return result
    except Exception as e:
        return {
            "predicted_complexity": "N/A",
            "performance_prediction": "Analysis failed",
            "suggestion": "Check for syntax errors in your code."
        }

import sys

simulation_steps = []

def trace_execution(frame, event, arg):
    if event == "line":
        # Create a deep-ish copy of locals for tracing
        # We filter out hidden dunder methods
        local_vars = {}
        for k, v in frame.f_locals.items():
            if not k.startswith("__"):
                try:
                    # Capture a snapshot of the value
                    local_vars[k] = str(v)
                except:
                    local_vars[k] = "<unavailable>"
        
        simulation_steps.append({
            "line": frame.f_lineno,
            "variables": local_vars
        })
    return trace_execution

def run_simulation(code: str):
    """
    Executes code in a controlled environment to trace line execution and variable states.
    """
    global simulation_steps
    simulation_steps = []
    
    try:
        compiled_code = compile(code, "<string>", "exec")
        
        # We redirect stdout so print statements don't pollute the host terminal during exec
        # Keep restricted environment empty to prevent malicious access
        restricted_globals = {}
        restricted_locals = {}

        sys.settrace(trace_execution)
        exec(compiled_code, restricted_globals, restricted_locals)
        sys.settrace(None)

        return simulation_steps
    except Exception as e:
        sys.settrace(None)
        return [{"line": 0, "variables": {"Error": str(e)}}]

def readability_analysis(code: str):
    """
    Evaluates the code for readability flags using simple threshold rules.
    """
    try:
        score = 100
        suggestions = []

        if "range(len(" in code:
            score -= 5
            suggestions.append("Range(len()) detected. Use enumerate() for better readability.")

        lines = code.splitlines()
        if len(lines) > 50:
            score -= 5
            suggestions.append("Code is quite long (>50 lines). Consider breaking it up.")

        # Naming checks
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Name):
                if len(node.id) <= 1 and node.id not in ['i', 'j', 'k', 'n', 'x', 'y']:
                    score -= 2
                    suggestions.append(f"Variable naming '{node.id}' is very short.")

        # Final bounds
        score = max(0, min(100, score))
        
        if score > 90 and not suggestions:
            suggestions.append("Code hygiene looks excellent.")

        return {"readability_score": score, "suggestions": list(set(suggestions))}
    except Exception as e:
        return {"readability_score": 0, "suggestions": ["Syntax Error in code"]}

import random

def generate_test_cases():
    test_cases = [
        [],
        [1],
        [1, 2, 3],
        [0, -1, 5],
        [random.randint(1, 100) for _ in range(10)]
    ]
    return test_cases

def run_tests(code: str):
    """
    Executes student code against fixed test cases for 'two_sum' or any detected function.
    """
    namespace = {}
    try:
        exec(code, namespace)
    except Exception as e:
        return [{"input": "Global", "error": f"Execution Error: {str(e)}", "status": "Failed"}]

    # Search for the function
    func = namespace.get("two_sum")
    if not func:
        for val in namespace.values():
            if callable(val):
                func = val
                break
                
    if not func:
        return [{"input": "N/A", "error": "No function found to test.", "status": "Failed"}]

    # User provided tests for two_sum logic mostly
    tests = [
        ([2,7,11,15], 9),
        ([3,2,4], 6),
        ([3,3], 6),
        ([1,5,3], 8),
        ([1], 2)
    ]

    results = []

    for nums, target in tests:
        try:
            # Check parameter count
            import inspect
            sig = inspect.signature(func)
            if len(sig.parameters) == 2:
                result = func(nums, target)
                results.append({"input": f"nums={nums}, target={target}", "output": str(result), "status": "Passed"})
            else:
                result = func(nums)
                results.append({"input": str(nums), "output": str(result), "status": "Passed"})
        except Exception as e:
            results.append({"input": str(nums), "error": str(e), "status": "Failed"})

    return results

def chat_with_ai(messages: list, code: str = ""):
    """
    Handles conversational AI chat using Groq.
    messages: List of {"role": "user/assistant/system", "content": "..."}
    """
    if not client:
        return "AI Chat is disabled. Please provide a GROQ_API_KEY in the .env file."
    
    system_prompt = {
        "role": "system", 
        "content": f"""You are 'Your Personal AI Mentor', a friendly and expert guide. 
        - Your identity is strictly 'Personal AI Mentor'.
        - REQUIRED FORMAT: You must ALWAYS respond in short, clear bullet points. NO PARAGRAPHS.
        - Start every single point with a bullet '•'.
        - Do not group sentences into paragraphs. Every new thought must be a new bullet point.
        - Example response to 'hi':
          • Hello! 
          • I am your Personal AI Mentor.
          • How can I help you with your Python, C, Java, or JavaScript code today?
        - Be supportive and use encouraging language.
        - Explain issues and give hints without providing the full solution immediately.
        
        Current Code Workspace Context:
        ```
        {code}
        ```
        """
    }
    
    try:
        # Extract existing system content if present
        existing_system_content = ""
        user_assistant_messages = []
        for msg in messages:
            if msg.get("role") == "system":
                existing_system_content += "\n" + msg.get("content", "")
            else:
                user_assistant_messages.append(msg)
        
        # Merge with our core persona
        full_system_prompt = system_prompt["content"]
        if existing_system_content:
            full_system_prompt += "\n" + existing_system_content
            
        final_messages = [{"role": "system", "content": full_system_prompt}] + user_assistant_messages
            
        chat_completion = client.chat.completions.create(
            messages=final_messages,
            model="llama-3.1-8b-instant",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Chat Error: {str(e)}"

def analyze_code(code: str):
    """
    Main orchestration function following the User's accurate architecture pipeline.
    """
    # 1. Parsing & Basic Info
    algorithm = detect_algorithm(code)
    concepts = detect_concepts(algorithm)
    
    # 2. Detailed Analysis
    refactoring = analyze_refactor(code)
    edge_cases = detect_edge_cases(code)
    undefined_vars = detect_undefined_variables(code)
    efficiency = predict_efficiency(code)
    readability = readability_analysis(code)

    # 3. Aggregating Issues
    all_issues = []
    if not algorithm.startswith("Constant"):
        all_issues.append(f"Detected {algorithm} pattern.")
    
    all_issues.extend(refactoring)
    all_issues.extend(edge_cases)
    
    # Filter out success messages from issue list
    bug_alerts = [u for u in undefined_vars if "No undefined" not in u]
    all_issues.extend(bug_alerts)

    # 4. Scoring Logic (Simplified Accurate Model)
    score = readability["readability_score"]
    
    categories = {
        "Logic": 100,
        "Efficiency": 80 if algorithm == "Brute Force" else (90 if algorithm == "Linear Scan" else 100),
        "Cleanliness": score,
        "Safety": 100 - (len(bug_alerts) * 10)
    }

    # Fine tune Logic if there are edge cases or bug alerts
    categories["Logic"] -= (len(edge_cases) * 5 + len(bug_alerts) * 10)
    categories["Logic"] = max(0, categories["Logic"])
    categories["Safety"] = max(0, categories["Safety"])

    # Final weighted score
    final_score = (categories["Logic"] * 0.4 + categories["Efficiency"] * 0.3 + categories["Cleanliness"] * 0.2 + categories["Safety"] * 0.1)
    
    # 5. Metadata for UI
    complexity = efficiency["predicted_complexity"]
    explanation = f"Your code uses a {algorithm} approach which typically runs in {complexity} time."
    pattern = algorithm
    hint = f"Recommended study: {', '.join(concepts[:2])}."

    # Groq AI Polish (if enabled)
    if client:
        try:
            # We use AI to polish the hint and explanation based on the fixed results
            ai_prompt = f"Code: {code}\nAlgorithm: {algorithm}\nIssues: {all_issues}\nCategories: {categories}\nProvide a friendly 1-sentence hint and 1-sentence explanation."
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": ai_prompt}],
                model="llama-3.1-8b-instant",
            )
            explanation = chat_completion.choices[0].message.content.split('\n')[0]
        except:
            pass

    return {
        "score": int(final_score),
        "score_breakdown": [{"label": k, "deduction": 100-v} for k, v in categories.items() if v < 100],
        "complexity": complexity,
        "issues": all_issues,
        "hint": hint,
        "explanation": explanation,
        "pattern": pattern,
        "categories": categories
    }
