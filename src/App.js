import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

// ── Inject Google Fonts ──────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lora:ital,wght@0,600;1,400&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ── Global Styles ────────────────────────────────────────────────────────────
const globalStyle = document.createElement("style");
globalStyle.innerHTML = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0f4f8; font-family: 'Nunito', sans-serif; }

  @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes blink  { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

  .fade-in   { animation: fadeIn 0.45s ease both; }
  .pulse-btn { animation: pulse 2s infinite; }
  .spinner   { width:22px;height:22px;border:3px solid #fff3;border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block; }

  /* scrollbar */
  ::-webkit-scrollbar       { width: 6px; }
  ::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 4px; }
  ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }

  /* chat bubble tail */
  .bubble-user { border-bottom-right-radius: 4px !important; }
  .bubble-bot  { border-bottom-left-radius:  4px !important; }
`;
document.head.appendChild(globalStyle);

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary:   "#2563eb",
  primaryDk: "#1d4ed8",
  green:     "#16a34a",
  amber:     "#d97706",
  red:       "#dc2626",
  redLight:  "#fee2e2",
  bg:        "#f0f4f8",
  card:      "#ffffff",
  border:    "#e2e8f0",
  text:      "#1e293b",
  muted:     "#64748b",
  indigo:    "#4f46e5",
  indigoLt:  "#eef2ff",
  teal:      "#0d9488",
  tealLt:    "#ccfbf1",
};

// ── Reusable card ────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div className="fade-in" style={{
    background: C.card, borderRadius: 20, padding: "28px 24px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 20, ...style
  }}>
    {children}
  </div>
);

// ── Big accessible button ─────────────────────────────────────────────────────
const Btn = ({ children, onClick, color = C.primary, style = {}, disabled = false, pulse = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={pulse ? "pulse-btn" : ""}
    style={{
      background: disabled ? "#94a3b8" : color,
      color: "#fff", border: "none", borderRadius: 12,
      padding: "14px 22px", fontSize: 16, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Nunito', sans-serif",
      transition: "opacity .2s, transform .15s",
      ...style
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = ".88"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
  >
    {children}
  </button>
);

// ── Tab pill ─────────────────────────────────────────────────────────────────
const Tab = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "10px 14px", border: "none", borderRadius: 14, cursor: "pointer",
    background: active ? C.primary : "transparent",
    color: active ? "#fff" : C.muted,
    fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12,
    transition: "all .2s",
  }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    {label}
  </button>
);

// ── Risk colour ───────────────────────────────────────────────────────────────
const riskColor = s => s < 30 ? C.green : s < 60 ? C.amber : C.red;
const riskLabel = s => s < 30 ? "Low Risk" : s < 60 ? "Moderate Risk" : "High Risk";

// ════════════════════════════════════════════════════════════════════════════
export default function App() {

  // ── global state ───────────────────────────────────────────────────────────
  const [tab, setTab]               = useState("home");
  const [profile, setProfile]       = useState(null);       // null = not set up

  // glucose
  const [glucose, setGlucose]       = useState("");
  const [symptom, setSymptom]       = useState("");
  const [risk, setRisk]             = useState("");
  const [rec, setRec]               = useState("");
  const [history, setHistory]       = useState([]);
  const [showAlert, setShowAlert]   = useState(false);

  // CGM
  const [cgmOn, setCgmOn]           = useState(false);
  const [scenario, setScenario]     = useState("normal");

  // food
  const [foodImg, setFoodImg]       = useState(null);
  const [foodRes, setFoodRes]       = useState(null);
  const [foodLoad, setFoodLoad]     = useState(false);

  // ADA risk
  const [adaForm, setAdaForm]       = useState({
    age: "", sex: "male", bmi: "", activity: "moderate",
    familyHistory: false, highBP: false, gestational: false,
    waist: "", sleepApnea: false, smoking: false, alcohol: "none",
  });
  const [adaScore, setAdaScore]     = useState(null);
  const [adaBreakdown, setAdaBreakdown] = useState([]);

  // GlycoBot
  const [botMessages, setBotMessages] = useState([
    { role: "bot", text: "Hello! 👋 I'm GlycoBot, your health assistant. How are you feeling today?" }
  ]);
  const [botInput, setBotInput]     = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const chatEndRef                  = useRef(null);

  // reminders
  const [reminders, setReminders]   = useState([
    { id: 1, label: "💊 Morning Medication",  time: "08:00", done: false },
    { id: 2, label: "🩸 Check Glucose",        time: "10:00", done: false },
    { id: 3, label: "💧 Drink Water",           time: "12:00", done: false },
    { id: 4, label: "🩸 Post-lunch Glucose",   time: "14:00", done: false },
    { id: 5, label: "💊 Evening Medication",   time: "18:00", done: false },
    { id: 6, label: "😴 Sleep Check-in",        time: "21:00", done: false },
  ]);
  const [newRemLabel, setNewRemLabel] = useState("");
  const [newRemTime,  setNewRemTime]  = useState("");

  // SOS
  const [sosActive, setSosActive]   = useState(false);

  // profile form
  const [pForm, setPForm]           = useState({
    name: "", age: "", sex: "male", weight: "", height: "",
    diabetesType: "none", caregiver: "", caregiverPhone: "",
  });

  // ── CGM simulation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cgmOn) return;
    const scenarios = {
      normal:   [92,95,90,94,98,91,96,97,99,93,88,95],
      postmeal: [90,120,150,180,210,190,160,130,144,169,155,140],
      hypo:     [110,95,80,65,55,70,90,66,69,67,75,80],
    };
    let i = 0;
    const data = scenarios[scenario];
    const iv = setInterval(() => {
      if (i >= data.length) { clearInterval(iv); setCgmOn(false); return; }
      const v = data[i++];
      setGlucose(v.toString());
      setHistory(prev => [...prev, { time: prev.length + 1, value: v }]);
      classifyGlucose(v);
    }, 2000);
    return () => clearInterval(iv);
  }, [cgmOn, scenario]);

  const classifyGlucose = v => {
    if (v < 70)        { setRisk("Low Blood Sugar ⚠️ (Hypoglycemia)"); setRec("Immediate intake of fast-acting carbs recommended."); setShowAlert(true); }
    else if (v <= 99)  { setRisk("Normal Range ✅"); setRec("Glucose level is within healthy fasting range."); setShowAlert(false); }
    else if (v <= 125) { setRisk("Prediabetic Range ⚠️"); setRec("Lifestyle modification recommended. Monitor regularly."); setShowAlert(false); }
    else if (v <= 180) { setRisk("High Blood Sugar ⚠️"); setRec("Monitor closely and consult healthcare provider."); setShowAlert(true); }
    else               { setRisk("Critical High 🚨"); setRec("High glucose spike detected. Seek medical consultation immediately."); setShowAlert(true); }
  };

  const handleAnalyze = () => {
    const v = parseFloat(glucose);
    if (!v || v <= 0) { setRisk("Invalid Input ❌"); setRec("Please enter a valid glucose value."); return; }
    setHistory(prev => [...prev, { time: prev.length + 1, value: v }]);
    classifyGlucose(v);
    if (symptom.toLowerCase().includes("tingling") || symptom.toLowerCase().includes("blur")) {
      setRisk("High Risk ⚠️ (Symptom Alert)"); setRec("Possible complication detected. Seek medical advice."); setShowAlert(true);
    }
  };

  // ── ADA Risk ───────────────────────────────────────────────────────────────
  const calcADA = () => {
    let score = 0; const bd = [];
    const f = adaForm;
    const age = parseFloat(f.age);
    const bmi = parseFloat(f.bmi);

    if (age >= 40 && age < 50) { score += 1; bd.push({ factor: "Age 40–49", pts: 1 }); }
    else if (age >= 50 && age < 60) { score += 2; bd.push({ factor: "Age 50–59", pts: 2 }); }
    else if (age >= 60) { score += 3; bd.push({ factor: "Age 60+", pts: 3 }); }

    if (f.sex === "male") { score += 1; bd.push({ factor: "Male sex", pts: 1 }); }

    if (f.familyHistory) { score += 1; bd.push({ factor: "Family history of diabetes", pts: 1 }); }
    if (f.highBP)        { score += 1; bd.push({ factor: "History of high blood pressure", pts: 1 }); }
    if (f.activity === "low") { score += 1; bd.push({ factor: "Low physical activity", pts: 1 }); }

    if (bmi >= 25 && bmi < 30) { score += 1; bd.push({ factor: "BMI 25–29.9 (Overweight)", pts: 1 }); }
    else if (bmi >= 30)        { score += 2; bd.push({ factor: "BMI 30+ (Obese)", pts: 2 }); }

    // Male-specific
    if (f.sex === "male") {
      const waist = parseFloat(f.waist);
      if (waist > 102) { score += 2; bd.push({ factor: "Waist > 102cm (visceral fat)", pts: 2 }); }
      if (f.sleepApnea) { score += 1; bd.push({ factor: "Sleep apnea / heavy snoring", pts: 1 }); }
      if (f.smoking)    { score += 1; bd.push({ factor: "Smoking / tobacco use", pts: 1 }); }
      if (f.alcohol === "high") { score += 1; bd.push({ factor: "High alcohol consumption", pts: 1 }); }
    }
    // Female-specific
    if (f.sex === "female" && f.gestational) { score += 1; bd.push({ factor: "History of gestational diabetes", pts: 1 }); }

    setAdaScore(score);
    setAdaBreakdown(bd);
  };

  // ── GlycoBot ───────────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [botMessages]);

  const sendToBot = async () => {
    if (!botInput.trim()) return;
    const userMsg = botInput.trim();
    setBotInput("");
    setBotMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setBotLoading(true);

    try {
      const latestGlucose = history.length > 0 ? history[history.length - 1].value : null;
      const profileCtx = profile
        ? `The user's name is ${profile.name}, age ${profile.age}, diabetes status: ${profile.diabetesType}.`
        : "The user has not set up a profile yet.";
      const glucoseCtx = latestGlucose
        ? `Their latest glucose reading is ${latestGlucose} mg/dL.`
        : "No glucose reading has been logged yet.";

      const systemPrompt = `You are GlycoBot, a warm, caring AI health assistant inside the GlycoTrack AI app — an elderly care companion focused on diabetes monitoring, reminders, and wellbeing. 
${profileCtx} ${glucoseCtx}
Speak in simple, clear, friendly language appropriate for elderly users. Keep responses concise (2-4 sentences). 
Always encourage consulting a real doctor for medical decisions. If the user reports severe symptoms (chest pain, unconsciousness, severe dizziness), strongly urge them to call emergency services immediately.
You can help with: understanding glucose readings, diabetes tips, medication reminders, healthy eating, exercise suggestions, emotional support, and general wellbeing.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...botMessages.filter(m => m.role !== "bot" || m !== botMessages[0]).map(m => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "I'm sorry, I couldn't respond right now.";
      setBotMessages(prev => [...prev, { role: "bot", text: reply }]);
    } catch {
      setBotMessages(prev => [...prev, { role: "bot", text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setBotLoading(false);
  };

  // ── Food analysis ──────────────────────────────────────────────────────────
  const foodDB = {
    rice:      { name: "White Rice",      carbs: "28g per 100g", gi: 75, fiber: "0.4g", tip: "Try brown rice for a lower GI option." },
    apple:     { name: "Apple",           carbs: "25g",          gi: 38, fiber: "4g",   tip: "Excellent choice! Low GI and high fiber." },
    chocolate: { name: "Milk Chocolate",  carbs: "25g per 50g",  gi: 55, fiber: "1-2g", tip: "Enjoy in moderation. Dark chocolate is better for glucose." },
    banana:    { name: "Banana",          carbs: "23g",          gi: 51, fiber: "2.6g", tip: "Best eaten with protein to slow glucose absorption." },
    bread:     { name: "White Bread",     carbs: "15g per slice", gi: 75, fiber: "0.6g", tip: "Choose whole-grain bread for better glucose control." },
  };

  const analyzeFood = () => {
    if (!foodImg) return;
    setFoodLoad(true); setFoodRes(null);
    setTimeout(() => {
      const keys = Object.keys(foodDB);
      setFoodRes(foodDB[keys[Math.floor(Math.random() * keys.length)]]);
      setFoodLoad(false);
    }, 1500);
  };

  // ── Reminders ──────────────────────────────────────────────────────────────
  const toggleReminder = id => setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  const addReminder = () => {
    if (!newRemLabel || !newRemTime) return;
    setReminders(prev => [...prev, { id: Date.now(), label: newRemLabel, time: newRemTime, done: false }]);
    setNewRemLabel(""); setNewRemTime("");
  };

  // ── SOS ────────────────────────────────────────────────────────────────────
  const triggerSOS = () => {
    setSosActive(true);
    setTimeout(() => setSosActive(false), 5000);
  };

  // ── Profile setup ──────────────────────────────────────────────────────────
  const saveProfile = () => {
    if (!pForm.name || !pForm.age) return;
    setProfile(pForm);
    setTab("home");
  };

  // ── glucose zone colour ────────────────────────────────────────────────────
  const glucoseColor = v => v < 70 ? C.amber : v <= 99 ? C.green : v <= 125 ? C.amber : C.red;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  // Profile setup screen
  if (!profile) return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🩺</div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, color: C.text, marginBottom: 4 }}>GlycoTrack AI</h1>
          <p style={{ color: C.muted, fontSize: 15 }}>Elderly Care Companion — Let's set up your profile</p>
        </div>

        {[
          { label: "Full Name *", key: "name", type: "text", placeholder: "e.g. Ramesh Kumar" },
          { label: "Age *", key: "age", type: "number", placeholder: "e.g. 68" },
          { label: "Weight (kg)", key: "weight", type: "number", placeholder: "e.g. 72" },
          { label: "Height (cm)", key: "height", type: "number", placeholder: "e.g. 165" },
          { label: "Caregiver / Family Name", key: "caregiver", type: "text", placeholder: "e.g. Priya Kumar" },
          { label: "Caregiver Phone", key: "caregiverPhone", type: "tel", placeholder: "e.g. 98765 43210" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>{f.label}</label>
            <input type={f.type} placeholder={f.placeholder} value={pForm[f.key]}
              onChange={e => setPForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none" }} />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>Sex</label>
          <select value={pForm.sex} onChange={e => setPForm(p => ({ ...p, sex: e.target.value }))}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif" }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>Diabetes Status</label>
          <select value={pForm.diabetesType} onChange={e => setPForm(p => ({ ...p, diabetesType: e.target.value }))}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif" }}>
            <option value="none">Not Diagnosed</option>
            <option value="prediabetes">Prediabetes</option>
            <option value="type2">Type 2 Diabetes</option>
            <option value="type1">Type 1 Diabetes</option>
          </select>
        </div>

        <Btn onClick={saveProfile} style={{ width: "100%", fontSize: 17, padding: "15px" }}>
          Get Started →
        </Btn>
      </div>
    </div>
  );

  // ── Main app ────────────────────────────────────────────────────────────────
  const latestGlucose = history.length > 0 ? history[history.length - 1].value : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Nunito', sans-serif", paddingBottom: 90 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.indigo})`, padding: "20px 20px 28px", color: "#fff" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 13, opacity: .8, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>GlycoTrack AI</p>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 600 }}>Hello, {profile.name.split(" ")[0]} 👋</h2>
              <p style={{ fontSize: 13, opacity: .75, marginTop: 2 }}>Elderly Care Companion</p>
            </div>
            <button onClick={triggerSOS} className={sosActive ? "pulse-btn" : ""} style={{
              background: sosActive ? "#fff" : "rgba(255,255,255,0.2)",
              color: sosActive ? C.red : "#fff",
              border: "2px solid rgba(255,255,255,0.5)",
              borderRadius: 14, padding: "10px 16px", fontFamily: "'Nunito', sans-serif",
              fontWeight: 800, fontSize: 14, cursor: "pointer", transition: "all .3s"
            }}>
              🆘 {sosActive ? "ALERT SENT!" : "SOS"}
            </button>
          </div>

          {/* Quick glucose card */}
          <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 16, padding: "14px 18px", marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 12, opacity: .8, marginBottom: 2 }}>Latest Glucose</p>
              <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>
                {latestGlucose ? `${latestGlucose}` : "—"}
                <span style={{ fontSize: 14, fontWeight: 600, opacity: .8 }}> mg/dL</span>
              </p>
            </div>
            {latestGlucose && (
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "8px 14px", textAlign: "center" }}>
                <p style={{ fontSize: 12, opacity: .8 }}>Status</p>
                <p style={{ fontSize: 13, fontWeight: 800 }}>{latestGlucose <= 99 ? "✅ Normal" : latestGlucose <= 125 ? "⚠️ Pre" : "🚨 High"}</p>
              </div>
            )}
            {!latestGlucose && <p style={{ fontSize: 13, opacity: .7 }}>No reading yet today</p>}
          </div>

          {sosActive && (
            <div className="fade-in" style={{ background: C.red, borderRadius: 12, padding: "12px 16px", marginTop: 12, textAlign: "center" }}>
              <p style={{ fontWeight: 800, fontSize: 15 }}>🚨 Emergency alert sent to {profile.caregiver || "caregiver"}!</p>
              <p style={{ fontSize: 13, opacity: .9, marginTop: 2 }}>If this is a real emergency, call 112 immediately.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

        {/* ════ HOME ════ */}
        {tab === "home" && (
          <>
            {/* Reminders preview */}
            <Card>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                💊 Today's Reminders
                <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted, fontWeight: 600 }}>
                  {reminders.filter(r => r.done).length}/{reminders.length} done
                </span>
              </h3>
              {reminders.slice(0, 4).map(r => (
                <div key={r.id} onClick={() => toggleReminder(r.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                  borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  background: r.done ? "#f0fdf4" : "#f8fafc",
                  border: `1.5px solid ${r.done ? "#bbf7d0" : C.border}`,
                  transition: "all .2s",
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2.5px solid ${r.done ? C.green : C.border}`, background: r.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {r.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: r.done ? C.muted : C.text, textDecoration: r.done ? "line-through" : "none" }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>{r.time}</span>
                </div>
              ))}
              <button onClick={() => setTab("reminders")} style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "4px 0", fontFamily: "'Nunito', sans-serif" }}>
                View all reminders →
              </button>
            </Card>

            {/* Quick actions */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: C.muted, marginBottom: 12, letterSpacing: .5 }}>QUICK ACTIONS</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { icon: "🩸", label: "Log Glucose", color: "#dbeafe", border: "#93c5fd", tab: "glucose" },
                { icon: "🤖", label: "Ask GlycoBot", color: "#eef2ff", border: "#a5b4fc", tab: "bot" },
                { icon: "🍽", label: "Analyze Food", color: "#ccfbf1", border: "#5eead4", tab: "food" },
                { icon: "📊", label: "Health Risk", color: "#fef9c3", border: "#fde047", tab: "risk" },
              ].map(a => (
                <div key={a.tab} onClick={() => setTab(a.tab)} style={{
                  background: a.color, border: `1.5px solid ${a.border}`, borderRadius: 16,
                  padding: "18px 14px", cursor: "pointer", textAlign: "center", transition: "transform .15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{a.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{a.label}</p>
                </div>
              ))}
            </div>

            {/* Glucose trend */}
            {history.length > 0 && (
              <Card>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16, color: C.text }}>📈 Glucose Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 250]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`${v} mg/dL`, "Glucose"]} />
                    <ReferenceLine y={70}  stroke={C.amber} strokeDasharray="4 4" label={{ value: "Low", fontSize: 10 }} />
                    <ReferenceLine y={126} stroke={C.red}   strokeDasharray="4 4" label={{ value: "High", fontSize: 10 }} />
                    <Line type="monotone" dataKey="value" stroke={C.primary} strokeWidth={3} dot={{ r: 4, fill: C.primary }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Wellbeing check-in */}
            <Card style={{ background: `linear-gradient(135deg, ${C.tealLt}, #f0fdfa)`, border: `1.5px solid #99f6e4` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.teal, marginBottom: 12 }}>😊 How are you feeling today?</h3>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {["😔 Bad", "😐 Okay", "🙂 Good", "😄 Great"].map(m => (
                  <button key={m} onClick={() => setBotMessages(prev => [...prev, { role: "user", text: `I'm feeling ${m.split(" ")[1].toLowerCase()} today` }]) || setTab("bot")}
                    style={{ flex: 1, margin: "0 4px", padding: "10px 4px", borderRadius: 12, border: `1.5px solid #99f6e4`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif", color: C.text }}>
                    {m}
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ════ GLUCOSE ════ */}
        {tab === "glucose" && (
          <>
            <Card>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 6 }}>🩸 Glucose Monitor</h3>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Enter your reading or use CGM simulation mode</p>

              {/* Mode toggle */}
              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 20 }}>
                {["manual", "cgm"].map(m => (
                  <button key={m} onClick={() => { setCgmOn(false); }} style={{
                    flex: 1, padding: "10px", border: "none", borderRadius: 9,
                    background: "manual" === m ? C.primary : "transparent",
                    color: "manual" === m ? "#fff" : C.muted,
                    fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer"
                  }}>
                    {m === "manual" ? "✍️ Manual" : "📡 CGM Sim"}
                  </button>
                ))}
              </div>

              {/* Manual input */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Glucose Level (mg/dL)</label>
                <input type="number" value={glucose} onChange={e => setGlucose(e.target.value)}
                  placeholder="e.g. 95" style={{ width: "100%", padding: "14px", borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 20, fontWeight: 800, fontFamily: "'Nunito', sans-serif", color: C.text, outline: "none", textAlign: "center" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Symptoms (optional)</label>
                <input type="text" value={symptom} onChange={e => setSymptom(e.target.value)}
                  placeholder="e.g. tingling in feet, blurry vision"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none" }} />
              </div>
              <Btn onClick={handleAnalyze} style={{ width: "100%", fontSize: 17, padding: 15 }}>
                Analyze Reading
              </Btn>
            </Card>

            {/* CGM Simulation */}
            <Card style={{ border: `1.5px solid #bfdbfe` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.primary, marginBottom: 4 }}>📡 CGM Prototype Simulation</h3>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Simulates a continuous glucose monitor sensor feed</p>

              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {[["normal","🟢 Normal Stable"],["postmeal","🍽 Post-Meal"],["hypo","⚠️ Hypo Event"]].map(([k,l]) => (
                  <button key={k} onClick={() => setScenario(k)} style={{
                    padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${scenario === k ? C.primary : C.border}`,
                    background: scenario === k ? C.primary : "#fff", color: scenario === k ? "#fff" : C.text,
                    fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer"
                  }}>{l}</button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 20, background: cgmOn ? "#dcfce7" : "#fef9c3" }}>
                  <span style={{ animation: cgmOn ? "blink 1.2s infinite" : "none", fontSize: 14 }}>{cgmOn ? "🟢" : "🟡"}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: cgmOn ? "#166534" : "#92400e" }}>
                    {cgmOn ? "Sensor Connected" : "Sensor Standby"}
                  </span>
                </div>
              </div>

              <Btn onClick={() => setCgmOn(!cgmOn)} color={cgmOn ? C.red : C.green} style={{ width: "100%" }}>
                {cgmOn ? "⏹ Stop Simulation" : "▶ Start CGM Simulation"}
              </Btn>
            </Card>

            {/* Result */}
            {risk && (
              <Card className="fade-in" style={{ border: `2px solid ${risk.includes("✅") ? "#bbf7d0" : "#fca5a5"}`, background: risk.includes("✅") ? "#f0fdf4" : "#fff5f5" }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: risk.includes("✅") ? C.green : C.red, marginBottom: 8 }}>{risk}</h3>
                <p style={{ color: C.text, fontSize: 15 }}>{rec}</p>
                {showAlert && (
                  <div style={{ marginTop: 14, padding: "12px 16px", background: C.redLight, borderRadius: 12, borderLeft: `4px solid ${C.red}` }}>
                    <p style={{ fontWeight: 800, color: C.red, fontSize: 15 }}>🚨 Medical Attention Recommended</p>
                    <p style={{ color: C.text, fontSize: 14, marginTop: 4 }}>Please consult your healthcare provider. Use the SOS button above if this is an emergency.</p>
                  </div>
                )}
              </Card>
            )}

            {history.length > 0 && (
              <Card>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📈 Reading History</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 250]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`${v} mg/dL`, "Glucose"]} />
                    <ReferenceLine y={70}  stroke={C.amber} strokeDasharray="4 4" />
                    <ReferenceLine y={126} stroke={C.red}   strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="value" stroke={C.primary} strokeWidth={3} dot={{ r: 4, fill: C.primary }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </>
        )}

        {/* ════ BOT ════ */}
        {tab === "bot" && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.primary})`, padding: "20px 20px 16px" }}>
              <h3 style={{ color: "#fff", fontFamily: "'Lora', serif", fontSize: 19 }}>🤖 GlycoBot</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>Your AI health companion — ask me anything</p>
            </div>

            {/* Messages */}
            <div style={{ height: 380, overflowY: "auto", padding: "16px 16px 8px" }}>
              {botMessages.map((m, i) => (
                <div key={i} className="fade-in" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                  {m.role === "bot" && <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.indigoLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>🤖</div>}
                  <div className={m.role === "user" ? "bubble-user" : "bubble-bot"} style={{
                    maxWidth: "78%", padding: "11px 15px", borderRadius: 18,
                    background: m.role === "user" ? C.primary : "#f1f5f9",
                    color: m.role === "user" ? "#fff" : C.text,
                    fontSize: 15, lineHeight: 1.5, fontWeight: 500,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {botLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.indigoLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                  <div style={{ background: "#f1f5f9", borderRadius: 18, padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0,1,2].map(j => <div key={j} style={{ width: 8, height: 8, borderRadius: "50%", background: C.muted, animation: `blink 1.2s ${j * 0.2}s infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div style={{ padding: "0 12px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["I feel dizzy 😵", "Is my glucose okay?", "What should I eat?", "I forgot my medication"].map(q => (
                <button key={q} onClick={() => { setBotInput(q); }}
                  style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${C.border}`, background: "#f8fafc", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif", color: C.text }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "8px 12px 16px", display: "flex", gap: 8 }}>
              <input value={botInput} onChange={e => setBotInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendToBot()}
                placeholder="Type your message..."
                style={{ flex: 1, padding: "12px 16px", borderRadius: 25, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none" }} />
              <button onClick={sendToBot} disabled={botLoading} style={{
                width: 48, height: 48, borderRadius: "50%", background: C.primary, border: "none",
                cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                {botLoading ? <span className="spinner" /> : "➤"}
              </button>
            </div>
          </Card>
        )}

        {/* ════ FOOD ════ */}
        {tab === "food" && (
          <Card>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 4 }}>🍽 FoodAI</h3>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Upload a photo of your meal for nutritional insights</p>

            <label style={{ display: "block", border: `2px dashed ${C.border}`, borderRadius: 16, padding: "28px", textAlign: "center", cursor: "pointer", background: "#f8fafc", marginBottom: 16 }}>
              <input type="file" accept="image/*" onChange={e => setFoodImg(URL.createObjectURL(e.target.files[0]))} style={{ display: "none" }} />
              {foodImg
                ? <img src={foodImg} alt="food" style={{ maxHeight: 180, borderRadius: 12, maxWidth: "100%" }} />
                : <><div style={{ fontSize: 40, marginBottom: 8 }}>📷</div><p style={{ color: C.muted, fontWeight: 700 }}>Tap to upload food photo</p></>
              }
            </label>

            <Btn onClick={analyzeFood} disabled={!foodImg} style={{ width: "100%", fontSize: 16, padding: 14 }} color={C.teal}>
              {foodLoad ? <><span className="spinner" style={{ marginRight: 8 }} />Analyzing...</> : "🔍 Analyze Food"}
            </Btn>

            {foodRes && (
              <div className="fade-in" style={{ marginTop: 20, padding: "18px", background: C.tealLt, borderRadius: 16, border: `1.5px solid #99f6e4` }}>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: C.teal, marginBottom: 12 }}>{foodRes.name}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[["🍬 GI Index", foodRes.gi], ["🌾 Carbs", foodRes.carbs], ["🥦 Fiber", foodRes.fiber]].map(([l, v]) => (
                    <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "10px", textAlign: "center" }}>
                      <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{l}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <p style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{foodRes.tip}</p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ════ RISK ════ */}
        {tab === "risk" && (
          <Card>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 4 }}>📊 Diabetes Risk Assessment</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Based on the validated ADA Diabetes Risk Test with gender-specific factors</p>

            {[
              { label: "Age", key: "age", type: "number", placeholder: "e.g. 65" },
              { label: "BMI", key: "bmi", type: "number", placeholder: "e.g. 27.5" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={adaForm[f.key]}
                  onChange={e => setAdaForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none" }} />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>Sex</label>
              <select value={adaForm.sex} onChange={e => setAdaForm(p => ({ ...p, sex: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif" }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>Physical Activity Level</label>
              <select value={adaForm.activity} onChange={e => setAdaForm(p => ({ ...p, activity: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif" }}>
                <option value="high">Active (exercise regularly)</option>
                <option value="moderate">Moderate (light activity)</option>
                <option value="low">Sedentary (mostly sitting)</option>
              </select>
            </div>

            {/* Checkboxes */}
            {[
              { key: "familyHistory", label: "Family history of diabetes (parent or sibling)" },
              { key: "highBP", label: "History of high blood pressure (self-reported)" },
            ].map(f => (
              <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={adaForm[f.key]} onChange={e => setAdaForm(p => ({ ...p, [f.key]: e.target.checked }))}
                  style={{ width: 20, height: 20, accentColor: C.primary }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{f.label}</span>
              </label>
            ))}

            {/* Male-specific */}
            {adaForm.sex === "male" && (
              <div style={{ background: "#eff6ff", borderRadius: 14, padding: "14px 16px", marginBottom: 14, border: `1.5px solid #bfdbfe` }}>
                <p style={{ fontWeight: 800, color: C.primary, fontSize: 14, marginBottom: 12 }}>👨 Male-Specific Factors</p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>Waist Circumference (cm)</label>
                  <input type="number" placeholder="e.g. 95" value={adaForm.waist}
                    onChange={e => setAdaForm(p => ({ ...p, waist: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif", outline: "none" }} />
                </div>
                {[
                  { key: "sleepApnea", label: "Sleep apnea or heavy snoring" },
                  { key: "smoking",    label: "Current or past smoker / tobacco user" },
                ].map(f => (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={adaForm[f.key]} onChange={e => setAdaForm(p => ({ ...p, [f.key]: e.target.checked }))}
                      style={{ width: 20, height: 20, accentColor: C.primary }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{f.label}</span>
                  </label>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 5 }}>Alcohol Consumption</label>
                  <select value={adaForm.alcohol} onChange={e => setAdaForm(p => ({ ...p, alcohol: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>
                    <option value="none">None</option>
                    <option value="moderate">Moderate (1-2 drinks/day)</option>
                    <option value="high">High (3+ drinks/day)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Female-specific */}
            {adaForm.sex === "female" && (
              <div style={{ background: "#fdf4ff", borderRadius: 14, padding: "14px 16px", marginBottom: 14, border: `1.5px solid #e9d5ff` }}>
                <p style={{ fontWeight: 800, color: "#7c3aed", fontSize: 14, marginBottom: 12 }}>👩 Female-Specific Factors</p>
                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={adaForm.gestational} onChange={e => setAdaForm(p => ({ ...p, gestational: e.target.checked }))}
                    style={{ width: 20, height: 20, accentColor: "#7c3aed" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>History of gestational diabetes (diabetes during pregnancy)</span>
                </label>
              </div>
            )}

            <Btn onClick={calcADA} style={{ width: "100%", fontSize: 16, padding: 14 }}>
              Calculate My Risk
            </Btn>

            {adaScore !== null && (
              <div className="fade-in" style={{ marginTop: 20 }}>
                {/* Score display */}
                <div style={{ textAlign: "center", padding: "24px", background: `linear-gradient(135deg, ${riskColor(adaScore)}18, ${riskColor(adaScore)}08)`, borderRadius: 18, border: `2px solid ${riskColor(adaScore)}40`, marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>ADA Risk Score</p>
                  <p style={{ fontSize: 56, fontWeight: 900, color: riskColor(adaScore), lineHeight: 1 }}>{adaScore}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: riskColor(adaScore), marginTop: 4 }}>{riskLabel(adaScore)}</p>
                  <div style={{ width: "100%", height: 10, background: "#e2e8f0", borderRadius: 10, overflow: "hidden", margin: "14px 0 8px" }}>
                    <div style={{ width: `${Math.min((adaScore / 12) * 100, 100)}%`, height: "100%", background: riskColor(adaScore), borderRadius: 10, transition: "width 0.8s ease" }} />
                  </div>
                  <p style={{ fontSize: 12, color: C.muted }}>Score 5+ indicates elevated diabetes risk (ADA guideline)</p>
                </div>

                {/* Breakdown */}
                {adaBreakdown.length > 0 && (
                  <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
                    <p style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 10 }}>Risk Factors Identified:</p>
                    {adaBreakdown.map((b, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < adaBreakdown.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{b.factor}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>+{b.pts} pt{b.pts > 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                <div style={{ background: adaScore >= 5 ? C.redLight : "#f0fdf4", borderRadius: 14, padding: "14px 16px", border: `1.5px solid ${adaScore >= 5 ? "#fca5a5" : "#bbf7d0"}` }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: adaScore >= 5 ? C.red : C.green, marginBottom: 6 }}>
                    {adaScore >= 5 ? "⚠️ Action Recommended" : "✅ Continue Healthy Habits"}
                  </p>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
                    {adaScore >= 5
                      ? "Your score suggests elevated diabetes risk. Please consult your doctor for a formal blood glucose test. Early detection can prevent or delay Type 2 diabetes."
                      : "Your current risk is low. Maintain your healthy lifestyle with regular physical activity, balanced diet, and routine check-ups."}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ════ REMINDERS ════ */}
        {tab === "reminders" && (
          <Card>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 4 }}>💊 Reminders</h3>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
              {reminders.filter(r => r.done).length} of {reminders.length} completed today
            </p>

            {reminders.map(r => (
              <div key={r.id} onClick={() => toggleReminder(r.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderRadius: 14, marginBottom: 10, cursor: "pointer",
                background: r.done ? "#f0fdf4" : "#f8fafc",
                border: `1.5px solid ${r.done ? "#bbf7d0" : C.border}`,
                transition: "all .2s",
              }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2.5px solid ${r.done ? C.green : C.border}`, background: r.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {r.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: r.done ? C.muted : C.text, textDecoration: r.done ? "line-through" : "none" }}>{r.label}</span>
                <span style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>{r.time}</span>
              </div>
            ))}

            {/* Add new reminder */}
            <div style={{ marginTop: 20, padding: "16px", background: "#f8fafc", borderRadius: 14, border: `1.5px dashed ${C.border}` }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 12 }}>➕ Add New Reminder</p>
              <input value={newRemLabel} onChange={e => setNewRemLabel(e.target.value)}
                placeholder="e.g. 💉 Insulin dose"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif", marginBottom: 10, outline: "none" }} />
              <input type="time" value={newRemTime} onChange={e => setNewRemTime(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'Nunito', sans-serif", marginBottom: 12, outline: "none" }} />
              <Btn onClick={addReminder} style={{ width: "100%" }} color={C.teal}>Add Reminder</Btn>
            </div>
          </Card>
        )}

        {/* ════ PROFILE ════ */}
        {tab === "profile" && (
          <Card>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px" }}>
                👤
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{profile.name}</h3>
              <p style={{ color: C.muted, fontSize: 14, marginTop: 2 }}>Age {profile.age} · {profile.sex === "male" ? "Male" : "Female"}</p>
            </div>

            {[
              { icon: "⚖️", label: "Weight", value: profile.weight ? `${profile.weight} kg` : "Not set" },
              { icon: "📏", label: "Height", value: profile.height ? `${profile.height} cm` : "Not set" },
              { icon: "🩺", label: "Diabetes Status", value: profile.diabetesType === "none" ? "Not Diagnosed" : profile.diabetesType },
              { icon: "👨‍👩‍👧", label: "Caregiver", value: profile.caregiver || "Not set" },
              { icon: "📞", label: "Caregiver Phone", value: profile.caregiverPhone || "Not set" },
              { icon: "🩸", label: "Total Readings Logged", value: `${history.length} readings` },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{item.label}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 2, textTransform: item.label === "Diabetes Status" ? "capitalize" : "none" }}>{item.value}</p>
                </div>
              </div>
            ))}

            <Btn onClick={() => setProfile(null)} color={C.muted} style={{ width: "100%", marginTop: 20 }}>
              Edit Profile
            </Btn>
          </Card>
        )}

      </div>

      {/* ── Bottom nav ────────────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "6px 0 10px", boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
        zIndex: 100,
      }}>
        {[
          { label: "Home",      icon: "🏠", id: "home" },
          { label: "Glucose",   icon: "🩸", id: "glucose" },
          { label: "GlycoBot",  icon: "🤖", id: "bot" },
          { label: "Reminders", icon: "💊", id: "reminders" },
          { label: "Profile",   icon: "👤", id: "profile" },
        ].map(t => (
          <Tab key={t.id} label={t.label} icon={t.icon} active={tab === t.id} onClick={() => setTab(t.id)} />
        ))}
      </div>
    </div>
  );
}