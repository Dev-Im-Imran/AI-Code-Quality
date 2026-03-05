import React, { useState, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
});

const MermaidDiagram = ({ chart }) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (chart && ref.current) {
      const renderChart = async () => {
        try {
          // Use a random ID to prevent "already exists" errors on re-renders
          const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (error) {
          console.error("Mermaid Render Error:", error);
          if (ref.current) {
            ref.current.innerHTML = `<div style="color:red; padding:10px;">Failed to render logic flow.</div>`;
          }
        }
      };
      renderChart();
    }
  }, [chart]);

  return <div key={chart} ref={ref} style={{ width: "100%", overflowX: "auto", display: "flex", justifyContent: "center" }} />;
};

const GOOGLE_CLIENT_ID = "662969490030-h8knd4didgs0n374l9oa088h18hg3krs.apps.googleusercontent.com";

function App() {
  const [code, setCode] = useState("# Paste your Python code here\n\ndef hello_world():\n    for i in range(5):\n        print('Hello World')");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);
  const [flowchart, setFlowchart] = useState("");
  const [showFlow, setShowFlow] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [recommendedConcepts, setRecommendedConcepts] = useState(null);
  const [refactoringSuggestions, setRefactoringSuggestions] = useState(null);
  const [edgeCaseWarnings, setEdgeCaseWarnings] = useState(null);
  const [executionSteps, setExecutionSteps] = useState(null);
  const [readabilityResult, setReadabilityResult] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [progressInsight, setProgressInsight] = useState(null);
  const [bugPatterns, setBugPatterns] = useState(null);
  const [efficiencyResult, setEfficiencyResult] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const url = user?.id ? `http://localhost:8000/history?user_id=${user.id}` : `http://localhost:8000/history`;
      const response = await fetch(url);
      const data = await response.json();
      setHistory(data.reverse());

      const progUrl = user?.id ? `http://localhost:8000/progress?user_id=${user.id}` : `http://localhost:8000/progress`;
      const progRes = await fetch(progUrl);
      const progData = await progRes.json();
      if (progData.status === "success") {
        setProgressInsight(progData);
      } else {
        setProgressInsight(null);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Load existing user session
    const savedUser = localStorage.getItem("mentor_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const analyzeCode = async () => {
    setLoading(true);
    setFlowchart("");
    setRecommendedConcepts(null);
    setRefactoringSuggestions(null);
    setEdgeCaseWarnings(null);
    setExecutionSteps(null);
    setReadabilityResult(null);
    setTestResults(null);
    setBugPatterns(null);
    setEfficiencyResult(null);
    try {
      // 1. Core Analysis
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python", user_id: user?.id })
      });
      const data = await response.json();
      setResult(data);

      // 2. Flowchart Visualization
      const flowRes = await fetch("http://localhost:8000/flowchart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const flowData = await flowRes.json();
      setFlowchart(flowData.flow);

      // 3. Algorithm Comparison
      const compRes = await fetch("http://localhost:8000/compare-algorithm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const compData = await compRes.json();
      setComparisonResult(compData);

      // 4. Concept Recommendations
      const conceptRes = await fetch("http://localhost:8000/recommend-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const conceptData = await conceptRes.json();
      setRecommendedConcepts(conceptData.recommended_concepts);

      // 5. Code Refactoring Suggestions
      const refactorRes = await fetch("http://localhost:8000/refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const refactorData = await refactorRes.json();
      setRefactoringSuggestions(refactorData.suggestions);

      // 6. Edge Case Detection
      const edgeCaseRes = await fetch("http://localhost:8000/edge-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const edgeCaseData = await edgeCaseRes.json();
      setEdgeCaseWarnings(edgeCaseData.edge_case_warnings);

      // 7. Execution Simulation
      const simRes = await fetch("http://localhost:8000/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const simData = await simRes.json();
      setExecutionSteps(simData.steps);

      // 8. Code Readability
      const readRes = await fetch("http://localhost:8000/readability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const readData = await readRes.json();
      setReadabilityResult(readData);

      // 9. Automatic Test Cases
      const testRes = await fetch("http://localhost:8000/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const testData = await testRes.json();
      setTestResults(testData.test_results);

      // 11. Bug Pattern Learning System
      const bugRes = await fetch("http://localhost:8000/bug-pattern-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const bugData = await bugRes.json();
      setBugPatterns(bugData.bug_patterns);

      // 12. Code Efficiency Predictor
      const effRes = await fetch("http://localhost:8000/efficiency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" })
      });
      const effData = await effRes.json();
      setEfficiencyResult(effData);

      fetchHistory();
    } catch (error) {
      console.error("Error analyzing code:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    try {
      const response = await fetch("http://localhost:8000/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture
        })
      });
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("mentor_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Google Login Sync Error:", error);
      alert("Failed to synchronize Google account.");
    }
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem("mentor_user");
  };

  const isMobile = windowWidth < 768;

  const chartData = useMemo(() => {
    return history.map((item, index) => ({
      name: `Exp ${index + 1}`,
      score: item.score,
    }));
  }, [history]);

  const radarData = useMemo(() => {
    if (!result) return [];
    return [
      { subject: 'Score', A: result.score, fullMark: 100 },
      { subject: 'Efficiency', A: result.complexity === 'O(n)' ? 100 : (result.complexity.includes('n^2') ? 40 : 70), fullMark: 100 },
      { subject: 'Cleanliness', A: 100 - (result.issues.length * 10), fullMark: 100 },
      { subject: 'Logic', A: result.score > 50 ? 90 : 50, fullMark: 100 },
    ];
  }, [result]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: "assistant", content: "Hi! I'm your AI code coach. How can I help you optimize your code today?" }]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const userMessage = { role: "user", content: userInput };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          code: code
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "I'm having a bit of trouble connecting to the brain. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSignup && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const endpoint = isSignup ? "signup" : "login";
    try {
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.name
        })
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.detail || "Authentication failed");
        return;
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("mentor_user", JSON.stringify(userData));
    } catch (error) {
      alert("Could not connect to the auth server.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
          
          :root {
            --bg-dark: #0b0f19;
            --bg-card: #111827;
            --bg-input: #030712;
            --border-color: #1f2937;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --accent-blue: #3b82f6;
            --accent-purple: #8b5cf6;
            --accent-green: #10b981;
            --accent-pink: #ec4899;
            --accent-red: #ef4444;
          }

          body { 
            margin: 0; 
            scrollbar-width: thin; 
            scrollbar-color: #374151 var(--bg-dark); 
            overflow-x: hidden; 
            background-color: var(--bg-dark);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
            width: 100%;
          }

          * { 
            box-sizing: border-box;
            min-width: 0;
          }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }

          /* Utility Classes */
          .text-blue { color: var(--accent-blue); }
          .text-purple { color: var(--accent-purple); }
          .text-green { color: var(--accent-green); }
          .text-pink { color: var(--accent-pink); }
          .text-red { color: var(--accent-red); }
          .text-gray { color: var(--text-muted); }
          .flex-1 { flex: 1; }


          /* Ultimate Auth Theme Styles */
          .auth-page.ultimate-theme {
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #020617;
            position: relative;
            overflow: hidden;
            font-family: 'Outfit', 'Inter', sans-serif;
          }

          .auth-bg-layers {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }

          .bg-glow {
            position: absolute;
            width: 800px;
            height: 800px;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            pointer-events: none;
            animation: pulse-glow 15s infinite alternate ease-in-out;
          }

          .bg-glow-1 {
            top: -200px;
            left: -200px;
            background: radial-gradient(circle, #3b82f6, transparent);
          }

          .bg-glow-2 {
            bottom: -200px;
            right: -200px;
            background: radial-gradient(circle, #8b5cf6, transparent);
            animation-delay: -7s;
          }

          @keyframes pulse-glow {
            from { transform: scale(1) translate(0, 0); opacity: 0.15; }
            to { transform: scale(1.3) translate(50px, 50px); opacity: 0.25; }
          }

          .bg-mesh {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
              radial-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px);
            background-size: 50px 50px, 100% 100px;
            opacity: 0.3;
          }

          .auth-container {
            position: relative;
            z-index: 2;
            width: 100%;
            display: flex;
            justify-content: center;
            padding: 20px;
          }

          .perfect-glass {
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 32px;
            width: 100%;
            max-width: 480px;
            padding: 50px;
            box-shadow: 
              0 20px 50px -12px rgba(0, 0, 0, 0.8),
              inset 0 1px 1px rgba(255, 255, 255, 0.1);
            animation: slide-up-premium 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes slide-up-premium {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .auth-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .brand-badge {
            display: inline-block;
            padding: 6px 12px;
            background: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 2px;
            margin-bottom: 20px;
            text-transform: uppercase;
          }

          .auth-title {
            font-size: 2.2rem;
            font-weight: 800;
            color: white;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
          }

          .auth-subtitle {
            color: #94a3b8;
            font-size: 0.95rem;
            line-height: 1.5;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .input-field {
            position: relative;
          }

          .input-field input {
            width: 100%;
            padding: 16px 20px;
            background: rgba(2, 6, 23, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 14px;
            color: white;
            font-size: 1rem;
            transition: all 0.3s;
            box-sizing: border-box;
          }

          .input-field input:focus {
            outline: none;
            border-color: rgba(59, 130, 246, 0.5);
            background: rgba(2, 6, 23, 0.8);
          }

          .input-glow {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 14px;
            pointer-events: none;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0);
            transition: box-shadow 0.3s;
          }

          .input-field input:focus + .input-glow {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
          }

          .auth-action-btn {
            padding: 18px;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: white;
            border: none;
            border-radius: 14px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
          }

          .auth-action-btn:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
          }

          .auth-divider {
            margin: 30px 0;
            text-align: center;
            position: relative;
          }

          .auth-divider::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
          }

          .auth-divider span {
            background: #0f172a;
            padding: 0 15px;
            color: #475569;
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 2px;
            position: relative;
            z-index: 1;
          }

          .google-auth-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 25px;
          }

          .auth-footer-links {
            text-align: center;
            color: #64748b;
            font-size: 0.9rem;
          }

          .toggle-link {
            background: none;
            border: none;
            color: #60a5fa;
            font-weight: 700;
            cursor: pointer;
            margin-left: 8px;
            font-family: inherit;
          }

          .toggle-link:hover {
            text-decoration: underline;
          }

          /* Main App Layout */
          .app-container {
            padding: 30px;
            background-color: var(--bg-dark);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            width: 100%;
            overflow-x: hidden;
          }

          .app-header {
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 1600px;
          }

          .header-spacer { width: 150px; }

          .header-center { text-align: center; }

          .header-title {
            font-size: 2.2rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
          }

          .header-subtitle {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin: 5px 0 0 0;
          }

          .header-user {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: flex-end;
            width: 150px;
          }

          .user-name {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }

          .logout-btn {
            background: #1f2937;
            color: var(--text-secondary);
            border: 1px solid #374151;
            padding: 6px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
          }

          .logout-btn:hover {
            color: white;
            background: #374151;
          }

          .main-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 20px;
            width: 100%;
            max-width: 1600px;
          }

          .section-title {
            font-size: 1.1rem;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .loading-text {
            font-size: 0.8rem;
            color: var(--text-muted);
          }

          .editor-section {
            background-color: var(--bg-card);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            min-width: 0;
            width: 100%;
          }

          .editor-container {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #374151;
          }

          .analyze-btn {
            margin-top: 15px;
            width: 100%;
            padding: 12px;
            background: linear-gradient(to right, #2563eb, #7c3aed);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
          }

          .analyze-btn:hover {
            opacity: 0.9;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }

          .analytics-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .analysis-card {
            background-color: var(--bg-card);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            min-width: 0;
            width: 100%;
          }

          .radar-container {
            height: 250px;
            margin-bottom: 20px;
            position: relative;
            width: 100%;
          }

          .stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }

          .stat-item {
            background: var(--bg-input);
            padding: 12px;
            border-radius: 10px;
            text-align: center;
          }

          .stat-label {
            color: var(--text-muted);
            font-size: 0.75rem;
          }

          .stat-value {
            font-weight: 800;
            font-size: 1rem;
          }

          .scoring-breakdown {
            background: rgba(31, 41, 55, 0.4);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #374151;
          }

          .breakdown-title {
            color: var(--text-secondary);
            font-size: 0.7rem;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-weight: bold;
          }

          .breakdown-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .breakdown-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
          }

          .item-label { color: #cbd5e1; }
          .item-inner-label { color: var(--text-secondary); }
          .item-value { font-weight: bold; }

          .breakdown-divider {
            height: 1px;
            background: #374151;
            margin: 5px 0;
          }

          .breakdown-total {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            font-weight: bold;
          }

          .total-label { color: var(--text-primary); }

          .trend-card {
            background-color: var(--bg-card);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            flex-grow: 1;
            min-width: 0;
            width: 100%;
          }

          .trend-container { 
            height: 250px;
            width: 100%;
            position: relative;
          }

          .no-data {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #4b5563;
            font-size: 0.8rem;
          }

          /* Strategy Section */
          .strategy-section {
            margin-top: 20px;
            width: 100%;
            max-width: 1600px;
            background-color: #1e1b4b;
            padding: 24px;
            border-radius: 20px;
            border: 1px solid #312e81;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
          }

          .strategy-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
          }

          .strategy-title {
            font-size: 1.2rem;
            font-weight: 800;
            color: #e0e7ff;
            margin: 0 0 5px 0;
          }

          .strategy-subtitle {
            color: #a5b4fc;
            font-size: 0.8rem;
            margin: 0;
          }

          .mentor-status-badge {
            background: rgba(99, 102, 241, 0.2);
            padding: 4px 10px;
            border-radius: 20px;
            border: 1px solid #4f46e5;
          }

          .status-text {
            font-size: 0.7rem;
            font-weight: bold;
            color: #c7d2fe;
            text-transform: uppercase;
          }

          .strategy-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .strategy-card {
            background: rgba(30, 27, 75, 0.4);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #3730a3;
          }

          .border-blue { border-color: #3b82f6; }
          .border-green { border-color: #10b981; }

          .card-title {
            font-size: 0.8rem;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-weight: bold;
          }

          .pattern-text {
            color: #f1f5f9;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .explanation-text {
            color: var(--text-secondary);
            font-size: 0.85rem;
            line-height: 1.6;
          }

          .issue-list {
            margin: 0;
            padding-left: 18px;
            color: #cbd5e1;
            font-size: 0.85rem;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .issue-item { line-height: 1.4; }

          .hint-item {
            color: var(--accent-blue);
            font-weight: bold;
            list-style-type: '→ ';
          }

          /* Chat Widget */
          .chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }

          .chat-window {
            width: 380px;
            height: 500px;
            background-color: var(--bg-card);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }

          .chat-header {
            padding: 15px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .coach-name {
            font-weight: bold;
            color: var(--accent-blue);
          }

          .close-chat {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
          }

          .chat-messages {
            flex-grow: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .message {
            padding: 10px 14px;
            border-radius: 12px;
            max-width: 80%;
            font-size: 0.85rem;
            color: white;
          }

          .user-message {
            align-self: flex-end;
            background-color: var(--accent-blue);
          }

          .coach-message {
            align-self: flex-start;
            background-color: #1f2937;
          }

          .bullet-message {
            display: flex;
            flex-direction: column;
            gap: 20px; /* One inch visual spacing between points */
          }

          .bullet-point {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            line-height: 1.5;
          }

          .bullet-icon {
            color: var(--accent-blue);
            font-weight: bold;
          }

          .bullet-text {
            flex: 1;
          }

          .typing-indicator {
            font-size: 0.75rem;
            color: var(--text-muted);
          }

          .chat-input-container {
            padding: 15px;
            display: flex;
            gap: 10px;
          }

          .chat-input {
            flex-grow: 1;
            background-color: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 10px;
            color: white;
            outline: none;
            font-size: 0.9rem;
          }

          .send-btn {
            background-color: var(--accent-blue);
            border: none;
            border-radius: 8px;
            padding: 0 15px;
            color: white;
            cursor: pointer;
          }

          .chat-toggle-btn {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
            border-radius: 30px;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
            border: none;
            color: white;
            cursor: pointer;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
          }

          .chat-toggle-btn:hover {
            transform: scale(1.05);
          }

          /* Media Queries */
          
          /* Laptops & Tablets (Landscape) */
          @media (max-width: 1200px) {
            .app-container { padding: 20px; }
            .header-title { font-size: 1.8rem; }
            .header-spacer, .header-user { width: 120px; }
          }

          @media (max-width: 1100px) {
            .main-grid {
              grid-template-columns: 1fr;
            }
            .header-spacer { display: none; }
          }

          /* Tablets (Portrait) */
          @media (max-width: 768px) {
            .app-header {
              flex-direction: column;
              gap: 20px;
              text-align: center;
            }
            .header-user {
              width: 100%;
              justify-content: center;
            }
            .user-name { display: none; }
            
            .stat-grid, .strategy-grid {
              grid-template-columns: 1fr;
            }
            
            .chat-window {
              width: calc(100vw - 40px);
              height: 400px;
            }
            .chat-toggle-btn {
              width: 50px;
              height: 50px;
              font-size: 1.2rem;
            }
            .chat-widget {
              bottom: 15px;
              right: 15px;
            }
          }

          /* Mobile Phones */
          @media (max-width: 480px) {
            .auth-card { padding: 30px 20px; }
            .auth-title { font-size: 1.5rem; }
            .form-row { flex-direction: column; }
            
            .header-title { font-size: 1.4rem; }
            .editor-section, .analysis-card, .trend-card { padding: 15px; }
            
            .radar-container, .trend-container { height: 200px; }
            .strategy-section { padding: 15px; }
          }

          /* Smooth transitions */
          input, button, section, .main-grid, .stat-grid, .strategy-grid, .auth-card, .analysis-card { 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          }
          button:active { transform: scale(0.98); }
        `}</style>
      {!user ? (
        <div className="auth-page ultimate-theme">
          <div className="auth-bg-layers">
            <div className="bg-glow bg-glow-1"></div>
            <div className="bg-glow bg-glow-2"></div>
            <div className="bg-mesh"></div>
          </div>

          <div className="auth-container">
            <div className="auth-card perfect-glass">
              <div className="auth-header">
                <div className="brand-badge">AI MENTOR</div>
                <h1 className="auth-title">
                  {isSignup ? "Begin Your Evolution" : "Continue Mastery"}
                </h1>
                <p className="auth-subtitle">
                  {isSignup
                    ? "Join the elite circle of data-driven developers."
                    : "Welcome back to your personal intelligence suite."}
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="auth-form">
                {isSignup && (
                  <div className="input-field">
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="input-glow"></div>
                  </div>
                )}
                <div className="input-field">
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <div className="input-glow"></div>
                </div>
                <div className="input-field">
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="input-glow"></div>
                </div>
                {isSignup && (
                  <div className="input-field">
                    <input
                      type="password"
                      required
                      placeholder="Confirm"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <div className="input-glow"></div>
                  </div>
                )}
                <button type="submit" className="auth-action-btn">
                  {isSignup ? "Create Identity" : "Authorize Access"}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR SECURE LOGIN</span>
              </div>

              <div className="google-auth-wrapper">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log('Login Failed')}
                  theme="filled_black"
                  shape="pill"
                  width="340"
                />
              </div>

              <div className="auth-footer-links">
                <p>
                  {isSignup ? "Legacy member?" : "New operative?"}
                  <button
                    onClick={() => setIsSignup(!isSignup)}
                    className="toggle-link"
                  >
                    {isSignup ? "Sign In" : "Register Now"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="app-container">
          <header className="app-header">
            <div className="header-spacer" />
            <div className="header-center">
              <h1 className="header-title">
                Your Personal AI Mentor
              </h1>
              <p className="header-subtitle">Friendly, data-driven coaching for Python, C, Java, and JS.</p>
            </div>
            <div className="header-user">
              <span className="user-name">{user.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </header>

          <main className="main-grid">
            {/* Editor Area */}
            <section className="editor-section">
              <h2 className="section-title text-blue">
                Code Workspace {loading && <span className="loading-text">Analyzing...</span>}
              </h2>
              <div className="editor-container">
                <Editor
                  height={isMobile ? "300px" : "550px"}
                  language="python"
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  options={{
                    fontSize: isMobile ? 12 : 14,
                    minimap: { enabled: false },
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 10, bottom: 10 }
                  }}
                />
              </div>
              <button
                onClick={analyzeCode}
                disabled={loading}
                className="analyze-btn"
              >
                Launch Analysis
              </button>
            </section>

            {/* Analytics Section */}
            <section className="analytics-section">
              {result && (
                <div className="analysis-card">
                  <h2 className="section-title text-purple">Analysis Breakdown</h2>

                  <div className="radar-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Radar name="Metrics" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="stat-grid">
                    <div className="stat-item">
                      <div className="stat-label">STRATEGY</div>
                      <div className="stat-value text-pink">{result.pattern}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">SCORE</div>
                      <div className="stat-value text-green">{result.score}%</div>
                    </div>
                  </div>

                  {/* Category-based Scores */}
                  {result.categories && (
                    <div style={{ padding: '0 20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {Object.entries(result.categories).map(([name, val]) => (
                        <div key={name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{name}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: val > 80 ? '#10b981' : (val > 50 ? '#f59e0b' : '#ef4444') }}>{val}%</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${val}%`, height: '100%', backgroundColor: val > 80 ? '#10b981' : (val > 50 ? '#f59e0b' : '#ef4444'), transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scoring Logic Breakdown */}
                  <div className="scoring-breakdown">
                    <h3 className="breakdown-title">Mentor's Scoring Logic</h3>
                    <div className="breakdown-list">
                      <div className="breakdown-item">
                        <span className="item-label">Base Excellence Score</span>
                        <span className="item-value text-green">100%</span>
                      </div>
                      {result.score_breakdown && result.score_breakdown.map((item, idx) => (
                        <div key={idx} className="breakdown-item">
                          <span className="item-inner-label">{item.label}</span>
                          <span className={`item-value ${item.deduction < 0 ? "text-red" : "text-green"}`}>
                            {item.deduction > 0 ? "+" : ""}{item.deduction}%
                          </span>
                        </div>
                      ))}
                      <div className="breakdown-divider"></div>
                      <div className="breakdown-total">
                        <span className="total-label">Final Grade</span>
                        <span className="total-value text-green">{result.score}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="trend-card">
                <h2 className="section-title text-gray">Progress Trend</h2>
                <div className="trend-container">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data">
                      Insufficient data for trend analysis.
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Progress Intelligence */}
              {progressInsight && (
                <div className="trend-card" style={{ marginTop: '20px', borderLeft: '4px solid #8b5cf6' }}>
                  <h2 className="section-title text-purple">10. Learning Progress Intelligence</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '15px', marginTop: '15px' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Score Evolution</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>{progressInsight.previous_score}</span>
                        <span style={{ color: '#6b7280', margin: '0 10px' }}>→</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: progressInsight.score_improvement >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {progressInsight.current_score}
                        </span>
                      </div>
                      <div style={{ marginTop: '5px', fontSize: '0.9rem', color: progressInsight.score_improvement >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {progressInsight.score_improvement > 0 ? '+' : ''}{progressInsight.score_improvement} points
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Complexity Optimization</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>{progressInsight.previous_complexity}</span>
                        <span style={{ color: '#6b7280', margin: '0 10px' }}>→</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{progressInsight.current_complexity}</span>
                      </div>
                      <div style={{ marginTop: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Efficiency transition
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* Strategic Action Plan */}
          {result && (
            <section className="strategy-section">
              <div className="strategy-header">
                <div>
                  <h2 className="strategy-title">Strategic Action Plan</h2>
                  <p className="strategy-subtitle">Tailored roadmap based on your current code logic.</p>
                </div>
                <div className="mentor-status-badge">
                  <span className="status-text">
                    Mentor Status: {result.score > 80 ? "Optimized" : "Needs Review"}
                  </span>
                </div>
              </div>

              {flowchart && (
                <div style={{ marginBottom: '30px', background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setShowFlow(!showFlow)}
                    className="analyze-btn"
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', marginBottom: '15px' }}
                  >
                    {showFlow ? "Hide Visual Logic Flow" : "Visualize Program Logic"}
                  </button>
                  {showFlow && (
                    <div style={{ background: '#0f172a', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <MermaidDiagram chart={flowchart} />
                    </div>
                  )}
                </div>
              )}

              <div className="strategy-grid">
                {/* Mental Model & Intent */}
                <div className="strategy-card border-blue">
                  <h3 className="card-title text-blue">1. Coaching Strategy</h3>
                  <p className="pattern-text">Mental Model: {result.pattern}</p>
                  <p className="explanation-text">{result.explanation}</p>
                </div>

                {/* Actionable Steps */}
                <div className="strategy-card border-green">
                  <h3 className="card-title text-green">2. Tactical Fixes</h3>
                  <ul className="issue-list">
                    {result.issues.map((issue, idx) => (
                      <li key={idx} className="issue-item">{issue}</li>
                    ))}
                    <li className="hint-item">{result.hint}</li>
                  </ul>
                </div>

                {/* Algorithm Comparison */}
                {comparisonResult && (
                  <div className="strategy-card border-purple" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="card-title text-purple" style={{ color: 'var(--accent-purple)' }}>3. Algorithm Comparison</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px' }}>
                      <div style={{ flex: '1', minWidth: '200px', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent-red)' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Algorithm</p>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'white' }}>{comparisonResult.student_algorithm}</h4>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--accent-red)', fontWeight: 'bold' }}>Time: {comparisonResult.complexity}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '1.5rem' }}>➔</span>
                      </div>
                      <div style={{ flex: '1', minWidth: '200px', background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent-green)' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recommended Algorithm</p>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'white' }}>{comparisonResult.recommended_algorithm}</h4>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>Optimal Time: {comparisonResult.optimized_complexity}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Concept Recommendations */}
                {recommendedConcepts && (
                  <div className="strategy-card border-blue" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="card-title text-blue" style={{ color: 'var(--accent-blue)' }}>4. Recommended Concepts to Study</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                      {recommendedConcepts.map((concept, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          {concept}
                        </span>
                      ))}
                    </div>
                    <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Mastering these concepts will help you write more optimized and robust code for similar problems.
                    </p>
                  </div>
                )}

                {/* Refactoring Suggestions */}
                {refactoringSuggestions && (
                  <div className="strategy-card border-green" style={{ gridColumn: '1 / -1', borderColor: 'var(--accent-green)' }}>
                    <h3 className="card-title text-green" style={{ color: 'var(--accent-green)' }}>5. Code Refactoring Suggestions</h3>
                    <ul className="issue-list" style={{ marginTop: '10px' }}>
                      {refactoringSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="issue-item" style={{
                          color: '#d1d5db',
                          marginBottom: '8px',
                          padding: '10px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          borderRadius: '6px',
                          borderLeft: '3px solid var(--accent-green)',
                          listStyle: 'none'
                        }}>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Edge Case Warnings */}
                {edgeCaseWarnings && (
                  <div className="strategy-card border-red" style={{ gridColumn: '1 / -1', borderColor: 'var(--accent-red)' }}>
                    <h3 className="card-title text-red" style={{ color: 'var(--accent-red)' }}>6. Edge Case Warnings</h3>
                    <ul className="issue-list" style={{ marginTop: '10px' }}>
                      {edgeCaseWarnings.map((warning, idx) => (
                        <li key={idx} className="issue-item" style={{
                          color: '#d1d5db',
                          marginBottom: '8px',
                          padding: '10px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '6px',
                          borderLeft: '3px solid var(--accent-red)',
                          listStyle: 'none'
                        }}>
                          ⚠️ {warning}
                        </li>
                      ))}
                    </ul>
                    <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Always consider these scenarios to make your code robust against unexpected inputs.
                    </p>
                  </div>
                )}

                {/* Step-by-Step Execution Simulation */}
                {executionSteps && executionSteps.length > 0 && (
                  <div className="strategy-card border-orange" style={{ gridColumn: '1 / -1', borderColor: 'orange' }}>
                    <h3 className="card-title" style={{ color: 'orange' }}>7. Step-by-Step Execution Simulation</h3>
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {executionSteps.map((step, idx) => (
                        <div key={idx} style={{
                          background: 'rgba(255, 165, 0, 0.1)',
                          padding: '12px',
                          borderRadius: '8px',
                          borderLeft: '4px solid orange',
                          fontFamily: 'monospace'
                        }}>
                          <div style={{ color: '#fed7aa', fontWeight: 'bold', marginBottom: '4px' }}>
                            Line {step.line} Executed
                          </div>
                          <div style={{ color: '#d1d5db', fontSize: '0.85rem' }}>
                            Variables state: {JSON.stringify(step.variables)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Readability Analyzer */}
                {readabilityResult && (
                  <div className="strategy-card border-purple" style={{ gridColumn: '1 / -1', borderColor: 'var(--accent-purple)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="card-title text-purple" style={{ color: 'var(--accent-purple)', margin: 0 }}>8. Code Readability Score</h3>
                      <div style={{
                        background: readabilityResult.readability_score >= 80 ? 'rgba(16, 185, 129, 0.2)' : readabilityResult.readability_score >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: readabilityResult.readability_score >= 80 ? 'var(--accent-green)' : readabilityResult.readability_score >= 50 ? '#fbbf24' : 'var(--accent-red)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        border: `1px solid ${readabilityResult.readability_score >= 80 ? 'var(--accent-green)' : readabilityResult.readability_score >= 50 ? '#fbbf24' : 'var(--accent-red)'}`
                      }}>
                        {readabilityResult.readability_score} / 100
                      </div>
                    </div>
                    <ul className="issue-list" style={{ marginTop: '15px' }}>
                      {readabilityResult.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="issue-item" style={{
                          color: '#d1d5db',
                          marginBottom: '8px',
                          padding: '10px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          borderRadius: '6px',
                          borderLeft: '3px solid var(--accent-purple)',
                          listStyle: 'none'
                        }}>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Automatic Test Case Generator */}
                {testResults && testResults.length > 0 && (
                  <div className="strategy-card border-indigo" style={{ gridColumn: '1 / -1', borderColor: '#6366f1' }}>
                    <h3 className="card-title text-indigo" style={{ color: '#818cf8', marginBottom: '15px' }}>9. Automatic Test Case Results</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {testResults.map((test, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: test.status === 'Passed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${test.status === 'Passed' ? 'var(--accent-green)' : 'var(--accent-red)'}`
                        }}>
                          <div style={{ fontFamily: 'monospace', color: '#d1d5db' }}>
                            <span style={{ color: '#9ca3af' }}>Input:</span> {test.input}
                            <span style={{ margin: '0 10px', color: '#6b7280' }}>→</span>
                            <span style={{ color: '#9ca3af' }}>Output:</span> {test.status === 'Passed' ? test.output : test.error}
                          </div>
                          <div style={{
                            fontWeight: 'bold',
                            color: test.status === 'Passed' ? 'var(--accent-green)' : 'var(--accent-red)',
                            background: test.status === 'Passed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.9rem'
                          }}>
                            {test.status === 'Passed' ? '✓ Passed' : '✗ Failed'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bug Pattern Learning System */}
                {bugPatterns && bugPatterns.length > 0 && (
                  <div className="strategy-card border-red" style={{ gridColumn: '1 / -1', borderColor: '#ef4444' }}>
                    <h3 className="card-title text-red" style={{ color: '#f87171', marginBottom: '15px' }}>11. Bug Pattern Learning System</h3>
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <p style={{ color: '#d1d5db', fontSize: '0.9rem', marginBottom: '12px' }}>
                        <span style={{ color: '#f87171', fontWeight: 'bold' }}>Intelligence Alert:</span> Detected {bugPatterns.length === 1 && bugPatterns[0].includes("No common") ? "0" : bugPatterns.length} potential learning anti-patterns based on historical data.
                      </p>
                      <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {bugPatterns.map((bug, idx) => (
                          <li key={idx} style={{
                            color: bug.includes("No common") ? '#10b981' : '#fca5a5',
                            marginBottom: '8px',
                            listStyleType: bug.includes("No common") ? 'none' : 'disc'
                          }}>
                            {bug.includes("No common") ? "✓ " + bug : bug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Code Efficiency Predictor */}
                {efficiencyResult && (
                  <div className="strategy-card border-blue" style={{ gridColumn: '1 / -1', borderColor: '#3b82f6' }}>
                    <h3 className="card-title text-blue" style={{ color: '#60a5fa', marginBottom: '15px' }}>12. Code Efficiency Predictor (Performance Intelligence)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px', textTransform: 'uppercase' }}>Predicted Complexity</div>
                        <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold' }}>{efficiencyResult.predicted_complexity}</div>
                      </div>
                      <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px', textTransform: 'uppercase' }}>Scalability Verdict</div>
                        <div style={{ color: '#d1d5db', fontSize: '0.95rem' }}>{efficiencyResult.performance_prediction}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '8px', borderLeft: '4px solid #eab308' }}>
                      <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '0.9rem' }}>Optimization Tip:</span>
                      <p style={{ color: '#d1d5db', fontSize: '0.9rem', margin: '5px 0 0 0' }}>{efficiencyResult.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI Chat Assistant Widget */}
          <div className="chat-widget">
            {chatOpen && (
              <div className="chat-window">
                <div className="chat-header">
                  <span className="coach-name">AI Code Coach</span>
                  <button onClick={() => setChatOpen(false)} className="close-chat">✕</button>
                </div>
                <div className="chat-messages">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role === "user" ? "user-message" : "coach-message"}`}>
                      {msg.content.includes('•') ? (
                        <div className="bullet-message">
                          {msg.content.split('•').filter(Boolean).map((pt, idx) => (
                            <div key={idx} className="bullet-point">
                              <span className="bullet-icon">•</span>
                              <span className="bullet-text">{pt.trim()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  ))}
                  {isTyping && <div className="typing-indicator">Coach is thinking...</div>}
                </div>
                <div className="chat-input-container">
                  <input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask a question..."
                    className="chat-input"
                  />
                  <button onClick={sendMessage} className="send-btn">Send</button>
                </div>
              </div>
            )}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="chat-toggle-btn"
            >
              {chatOpen ? "✕" : "💬"}
            </button>
          </div>

          
      </div>
      )}
    </GoogleOAuthProvider>
  );
}

export default App;
