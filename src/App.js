import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area,
  RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";

// ── Google Fonts ─────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ── Global Styles ─────────────────────────────────────────────────────────────
const globalStyle = document.createElement("style");
globalStyle.innerHTML = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #060818; font-family: 'Inter', sans-serif; color: #f0f4ff; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2f4e; border-radius: 4px; }

  @keyframes fadeUp    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse     { 0%,100%{transform:scale(1); opacity:1;} 50%{transform:scale(1.08); opacity:.85;} }
  @keyframes glow      { 0%,100%{box-shadow:0 0 20px #3b82f640;} 50%{box-shadow:0 0 40px #3b82f6aa, 0 0 80px #3b82f630;} }
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes blink     { 0%,100%{opacity:1;} 50%{opacity:0.2;} }
  @keyframes scanline  { 0%{transform:translateY(-100%);} 100%{transform:translateY(100vh);} }
  @keyframes numberUp  { from{transform:translateY(10px);opacity:0;} to{transform:translateY(0);opacity:1;} }
  @keyframes ripple    { 0%{transform:scale(0.8);opacity:1;} 100%{transform:scale(2.5);opacity:0;} }
  @keyframes slideIn   { from{transform:translateX(-20px);opacity:0;} to{transform:translateX(0);opacity:1;} }
  @keyframes gradShift { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }

  .fade-up    { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
  .fade-in    { animation: fadeIn 0.4s ease both; }
  .pulse-anim { animation: pulse 2s ease-in-out infinite; }
  .glow-anim  { animation: glow 2.5s ease-in-out infinite; }
  .spin-anim  { animation: spin 0.8s linear infinite; }
  .slide-in   { animation: slideIn 0.4s cubic-bezier(.16,1,.3,1) both; }

  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .glass-strong {
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.12);
  }
  .gradient-text {
    background: linear-gradient(135deg, #60a5fa, #a78bfa, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.08) !important; }
  .action-card:hover { transform: translateY(-3px); border-color: rgba(96,165,250,0.4) !important; }
  .action-card { transition: all 0.25s cubic-bezier(.16,1,.3,1); }
  .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
  .btn-primary { transition: all 0.2s ease; }
  .reminder-row:hover { background: rgba(255,255,255,0.06) !important; }
  .food-chip:hover { border-color: #60a5fa !important; background: rgba(96,165,250,0.1) !important; }

  input, select, textarea {
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    color: #f0f4ff !important;
    font-family: 'Inter', sans-serif !important;
    outline: none !important;
    transition: border-color 0.2s;
  }
  input:focus, select:focus, textarea:focus {
    border-color: rgba(96,165,250,0.5) !important;
    background: rgba(255,255,255,0.07) !important;
  }
  input::placeholder { color: rgba(255,255,255,0.25) !important; }
  select option { background: #0f1629; color: #f0f4ff; }
  input[type="checkbox"] { accent-color: #3b82f6; }
  input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }

  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line { stroke: rgba(255,255,255,0.05) !important; }
  .recharts-text { fill: rgba(255,255,255,0.4) !important; font-size: 11px !important; }
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: #0f1629 !important; border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 12px !important; color: #f0f4ff !important;
  }
`;
document.head.appendChild(globalStyle);

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#060818",
  surface:  "#0d1117",
  card:     "rgba(255,255,255,0.04)",
  border:   "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,255,255,0.15)",
  text:     "#f0f4ff",
  muted:    "rgba(255,255,255,0.45)",
  dim:      "rgba(255,255,255,0.25)",
  blue:     "#3b82f6",
  blueLt:   "#60a5fa",
  purple:   "#8b5cf6",
  purpleLt: "#a78bfa",
  green:    "#10b981",
  greenLt:  "#34d399",
  amber:    "#f59e0b",
  amberLt:  "#fbbf24",
  red:      "#ef4444",
  redLt:    "#f87171",
  teal:     "#14b8a6",
  tealLt:   "#2dd4bf",
  pink:     "#ec4899",
};

// ── Glucose zone helpers ──────────────────────────────────────────────────────
const glucoseZone = (v) => {
  if (!v || isNaN(v)) return { color: T.muted, label: "No Data",    bg: "rgba(255,255,255,0.05)", icon: "—",  severity: 0 };
  if (v < 54)         return { color: T.red,   label: "CRITICAL LOW",  bg: "rgba(239,68,68,0.15)",   icon: "🚨", severity: 4 };
  if (v < 70)         return { color: T.amber, label: "LOW",           bg: "rgba(245,158,11,0.15)",  icon: "⚠️", severity: 3 };
  if (v <= 99)        return { color: T.green, label: "NORMAL",        bg: "rgba(16,185,129,0.15)",  icon: "✓",  severity: 0 };
  if (v <= 125)       return { color: T.amber, label: "ELEVATED",      bg: "rgba(245,158,11,0.15)",  icon: "↑",  severity: 1 };
  if (v <= 180)       return { color: T.red,   label: "HIGH",          bg: "rgba(239,68,68,0.15)",   icon: "⚠️", severity: 2 };
  return               { color: T.red,   label: "CRITICAL HIGH", bg: "rgba(239,68,68,0.2)",    icon: "🚨", severity: 4 };
};

const trendArrow = (history) => {
  if (history.length < 3) return { arrow: "→", label: "Stable", color: T.muted };
  const last = history.slice(-3).map(h => h.value);
  const delta = last[2] - last[0];
  if (delta > 15)  return { arrow: "↑↑", label: "Rising Fast",  color: T.red };
  if (delta > 5)   return { arrow: "↑",  label: "Rising",       color: T.amber };
  if (delta < -15) return { arrow: "↓↓", label: "Falling Fast", color: T.red };
  if (delta < -5)  return { arrow: "↓",  label: "Falling",      color: T.amber };
  return                   { arrow: "→",  label: "Stable",       color: T.green };
};

// ── Food database with GI impact on glucose ───────────────────────────────────
const FOOD_DB = {
  rice:       { name: "White Rice",       gi: 73, carbs: 28, fiber: 0.4, protein: 2.7, fat: 0.3, glucoseImpact: 35, peakTime: 45, emoji: "🍚", category: "grain",   tip: "High GI — pair with protein and vegetables to blunt the glucose spike." },
  brown_rice: { name: "Brown Rice",       gi: 50, carbs: 23, fiber: 1.8, protein: 2.5, fat: 0.9, glucoseImpact: 20, peakTime: 60, emoji: "🍚", category: "grain",   tip: "Better choice than white rice. The fiber slows glucose absorption." },
  apple:      { name: "Apple",            gi: 36, carbs: 25, fiber: 4.4, protein: 0.3, fat: 0.2, glucoseImpact: 12, peakTime: 30, emoji: "🍎", category: "fruit",   tip: "Excellent choice. Low GI, high fiber — minimal glucose impact." },
  banana:     { name: "Banana",           gi: 51, carbs: 23, fiber: 2.6, protein: 1.1, fat: 0.3, glucoseImpact: 18, peakTime: 35, emoji: "🍌", category: "fruit",   tip: "Moderate impact. Eat with peanut butter to slow absorption." },
  bread:      { name: "White Bread",      gi: 75, carbs: 15, fiber: 0.6, protein: 2.7, fat: 1.0, glucoseImpact: 30, peakTime: 30, emoji: "🍞", category: "grain",   tip: "High GI. Switch to whole grain or sourdough for better control." },
  oats:       { name: "Oatmeal",          gi: 55, carbs: 27, fiber: 4.0, protein: 5.0, fat: 2.5, glucoseImpact: 15, peakTime: 60, emoji: "🥣", category: "grain",   tip: "Great breakfast choice. Beta-glucan fiber significantly slows glucose rise." },
  egg:        { name: "Boiled Egg",       gi: 0,  carbs: 0.6,fiber: 0,   protein: 13,  fat: 11,  glucoseImpact: 2,  peakTime: 0,  emoji: "🥚", category: "protein", tip: "Near-zero glucose impact. Excellent protein source for diabetics." },
  chicken:    { name: "Grilled Chicken",  gi: 0,  carbs: 0,  fiber: 0,   protein: 31,  fat: 3.6, glucoseImpact: 1,  peakTime: 0,  emoji: "🍗", category: "protein", tip: "Zero carbs, zero glucose impact. Ideal for blood sugar management." },
  chocolate:  { name: "Milk Chocolate",   gi: 45, carbs: 60, fiber: 1.5, protein: 7.7, fat: 30,  glucoseImpact: 40, peakTime: 40, emoji: "🍫", category: "sweet",   tip: "High sugar content. Dark chocolate (70%+) is significantly better." },
  salad:      { name: "Green Salad",      gi: 15, carbs: 3,  fiber: 2.0, protein: 1.5, fat: 0.2, glucoseImpact: 3,  peakTime: 20, emoji: "🥗", category: "veggie",  tip: "Excellent! Low carb, high fiber. Eat this before high-GI foods to blunt spikes." },
  pizza:      { name: "Pizza Slice",      gi: 60, carbs: 33, fiber: 2.3, protein: 11,  fat: 10,  glucoseImpact: 38, peakTime: 50, emoji: "🍕", category: "mixed",   tip: "Moderate-high impact. The fat slows absorption but carbs are significant." },
  idli:       { name: "Idli (2 pcs)",     gi: 70, carbs: 26, fiber: 1.0, protein: 4.0, fat: 0.5, glucoseImpact: 28, peakTime: 40, emoji: "🫓", category: "grain",   tip: "Fermented — slightly better than plain rice. Pair with sambar for fiber." },
  dal:        { name: "Dal / Lentils",    gi: 29, carbs: 20, fiber: 8.0, protein: 9.0, fat: 0.4, glucoseImpact: 8,  peakTime: 60, emoji: "🍲", category: "legume",  tip: "Excellent for diabetics. High protein and fiber, very low GI." },
  mango:      { name: "Mango",            gi: 51, carbs: 15, fiber: 1.6, protein: 0.8, fat: 0.4, glucoseImpact: 20, peakTime: 35, emoji: "🥭", category: "fruit",   tip: "Moderate GI. Limit to small portions and avoid ripe oversweet varieties." },
  roti:       { name: "Whole Wheat Roti", gi: 62, carbs: 18, fiber: 2.7, protein: 3.5, fat: 0.5, glucoseImpact: 22, peakTime: 45, emoji: "🫓", category: "grain",   tip: "Better than white bread. Fiber content helps moderate glucose rise." },
};

// ── CGM Scenarios ─────────────────────────────────────────────────────────────
const CGM_SCENARIOS = {
  normal:    { label: "Stable Normal",    color: T.green,  data: [88,90,92,89,94,91,95,93,90,96,92,88,91,94,90,93] },
  postmeal:  { label: "Post-Meal Spike",  color: T.amber,  data: [95,110,138,165,192,210,195,175,155,138,122,110,102,97,94,92] },
  hypo:      { label: "Hypoglycemia",     color: T.red,    data: [105,95,82,70,62,55,48,60,75,88,95,100,98,96,94,92] },
  dawn:      { label: "Dawn Phenomenon",  color: T.purple, data: [88,86,84,82,88,96,108,118,125,130,128,122,115,108,102,96] },
  labile:    { label: "Labile / Brittle", color: T.pink,   data: [95,140,80,165,60,130,190,75,110,155,70,125,180,90,140,100] },
};

// ── Reusable UI Components ────────────────────────────────────────────────────

const GlassCard = ({ children, style = {}, className = "" }) => (
  <div className={`glass fade-up ${className}`} style={{
    borderRadius: 20, padding: "22px 20px", marginBottom: 16, ...style
  }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled = false, small = false }) => {
  const variants = {
    primary: `linear-gradient(135deg, ${T.blue}, ${T.purple})`,
    green:   `linear-gradient(135deg, ${T.green}, ${T.teal})`,
    red:     `linear-gradient(135deg, ${T.red}, ${T.pink})`,
    amber:   `linear-gradient(135deg, ${T.amber}, #f97316)`,
    ghost:   "rgba(255,255,255,0.07)",
  };
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary" style={{
      background: disabled ? "rgba(255,255,255,0.08)" : variants[variant],
      color: disabled ? T.muted : "#fff",
      border: variant === "ghost" ? `1px solid ${T.border}` : "none",
      borderRadius: 12, padding: small ? "9px 16px" : "13px 20px",
      fontSize: small ? 13 : 15, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter', sans-serif", display: "inline-flex", alignItems: "center",
      justifyContent: "center", gap: 8, ...style
    }}>{children}</button>
  );
};

const Badge = ({ children, color = T.blue }) => (
  <span style={{
    background: `${color}22`, color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
    letterSpacing: 0.5, textTransform: "uppercase"
  }}>{children}</span>
);

const Spinner = () => (
  <div className="spin-anim" style={{
    width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff", borderRadius: "50%"
  }} />
);

const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: T.dim, letterSpacing: 1.5,
    textTransform: "uppercase", marginBottom: 12 }}>{children}</p>
);

// ── Big CGM Gauge ─────────────────────────────────────────────────────────────
const CGMGauge = ({ value, zone, trend, isLive }) => {
  const pct = Math.min(Math.max(((value || 0) - 40) / (300 - 40), 0), 1);
  const gaugeData = [{ value: pct * 100, fill: zone.color }];

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      {/* Outer glow ring */}
      {isLive && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 200, height: 200, borderRadius: "50%",
          background: `radial-gradient(circle, ${zone.color}15 0%, transparent 70%)`,
          animation: "pulse 2s ease-in-out infinite",
          pointerEvents: "none"
        }} />
      )}
      <div style={{ position: "relative", display: "inline-block" }}>
        <RadialBarChart width={200} height={200} cx={100} cy={100}
          innerRadius={70} outerRadius={90} startAngle={220} endAngle={-40}
          data={[{ value: 100, fill: "rgba(255,255,255,0.06)" }, ...gaugeData]}
          barSize={12}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={6} />
        </RadialBarChart>
        {/* Center value */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", textAlign: "center"
        }}>
          <div style={{
            fontSize: value ? 42 : 32, fontWeight: 900, color: zone.color,
            fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1,
            animation: isLive ? "numberUp 0.4s ease" : "none"
          }}>
            {value || "—"}
          </div>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginTop: 2 }}>mg/dL</div>
        </div>
      </div>
      {/* Zone label */}
      <div style={{ marginTop: 4 }}>
        <Badge color={zone.color}>{zone.label}</Badge>
      </div>
      {/* Trend */}
      {trend && value && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ fontSize: 20, color: trend.color, fontWeight: 900 }}>{trend.arrow}</span>
          <span style={{ fontSize: 12, color: trend.color, fontWeight: 600 }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
};

// ── Custom Tooltip for charts ─────────────────────────────────────────────────
const GlucoseTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const z = glucoseZone(v);
  return (
    <div style={{ background: "#0f1629", border: `1px solid ${z.color}44`, borderRadius: 12, padding: "10px 14px" }}>
      <p style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Reading #{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: z.color }}>{v} <span style={{ fontSize: 11 }}>mg/dL</span></p>
      <p style={{ fontSize: 11, color: z.color, marginTop: 2 }}>{z.label}</p>
    </div>
  );
};

// ── Nav Tab ───────────────────────────────────────────────────────────────────
const NavTab = ({ icon, label, active, onClick, alert }) => (
  <button onClick={onClick} className="nav-btn" style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    padding: "8px 12px", border: "none", borderRadius: 14, cursor: "pointer",
    background: active ? "rgba(59,130,246,0.15)" : "transparent",
    color: active ? T.blueLt : T.muted,
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 10,
    transition: "all .2s", position: "relative", minWidth: 52,
  }}>
    {alert && (
      <div style={{
        position: "absolute", top: 6, right: 10, width: 8, height: 8,
        borderRadius: "50%", background: T.red, border: "2px solid #060818"
      }} />
    )}
    <span style={{ fontSize: 20 }}>{icon}</span>
    {label}
  </button>
);

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {

  // ── Core state ─────────────────────────────────────────────────────────────
  const [tab, setTab]         = useState("cgm");
  const [profile, setProfile] = useState(null);
  const [pForm, setPForm]     = useState({
    name: "", age: "", sex: "male", weight: "", height: "",
    diabetesType: "type2", caregiver: "", caregiverPhone: "",
    targetLow: 70, targetHigh: 180,
  });

  // ── CGM state ──────────────────────────────────────────────────────────────
  const [cgmActive, setCgmActive]     = useState(false);
  const [scenario, setScenario]       = useState("normal");
  const [cgmHistory, setCgmHistory]   = useState([]);
  const [currentGlucose, setCurrentGlucose] = useState(null);
  const [cgmAlerts, setCgmAlerts]     = useState([]);
  const [sessionStats, setSessionStats] = useState(null);
  const cgmIntervalRef                = useRef(null);
  const cgmIndexRef                   = useRef(0);

  // ── Manual log ─────────────────────────────────────────────────────────────
  const [manualGlucose, setManualGlucose] = useState("");
  const [manualNote, setManualNote]       = useState("");
  const [manualMeal, setManualMeal]       = useState("fasting");

  // ── Food AI state ──────────────────────────────────────────────────────────
  const [foodQuery, setFoodQuery]     = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodLog, setFoodLog]         = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [predictedSpike, setPredictedSpike] = useState(null);

  // ── Health Risk state ──────────────────────────────────────────────────────
  const [riskForm, setRiskForm]       = useState({
    age: "", sex: "male", bmi: "", activity: "moderate",
    familyHistory: false, highBP: false, gestational: false,
    waist: "", sleepApnea: false, smoking: false, alcohol: "none",
  });
  const [riskScore, setRiskScore]     = useState(null);
  const [riskBreakdown, setRiskBreakdown] = useState([]);

  // ── GlycoBot state ─────────────────────────────────────────────────────────
  const [messages, setMessages]       = useState([{
    role: "bot",
    text: "Hi! I'm GlycoBot 🤖 — your AI diabetes companion. I can see your live CGM data and help you understand your readings, food choices, and health trends. What's on your mind?",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }]);
  const [botInput, setBotInput]       = useState("");
  const [botLoading, setBotLoading]   = useState(false);
  const chatEndRef                    = useRef(null);

  // ── Reminders state ────────────────────────────────────────────────────────
  const [reminders, setReminders]     = useState([
    { id: 1, label: "💊 Morning Medication",   time: "08:00", done: false, type: "med" },
    { id: 2, label: "🩸 Fasting Glucose Check", time: "07:00", done: false, type: "glucose" },
    { id: 3, label: "🍽 Log Breakfast",         time: "08:30", done: false, type: "food" },
    { id: 4, label: "🩸 Post-Lunch Check",      time: "14:00", done: false, type: "glucose" },
    { id: 5, label: "💊 Evening Medication",    time: "18:00", done: false, type: "med" },
    { id: 6, label: "🩸 Bedtime Check",         time: "22:00", done: false, type: "glucose" },
  ]);
  const [newRemLabel, setNewRemLabel] = useState("");
  const [newRemTime, setNewRemTime]   = useState("");

  // ── SOS ────────────────────────────────────────────────────────────────────
  const [sosActive, setSosActive]     = useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────
  const zone  = glucoseZone(currentGlucose);
  const trend = trendArrow(cgmHistory);
  const hasAlert = cgmAlerts.length > 0 || zone.severity >= 3;

  // ── CGM Engine ─────────────────────────────────────────────────────────────
  const startCGM = useCallback(() => {
    cgmIndexRef.current = 0;
    setCgmHistory([]);
    setCgmAlerts([]);
    setSessionStats(null);
    setCgmActive(true);
  }, []);

  const stopCGM = useCallback(() => {
    setCgmActive(false);
    if (cgmIntervalRef.current) clearInterval(cgmIntervalRef.current);
  }, []);

  useEffect(() => {
    if (!cgmActive) return;
    const scenarioData = CGM_SCENARIOS[scenario].data;

    cgmIntervalRef.current = setInterval(() => {
      const idx = cgmIndexRef.current;
      if (idx >= scenarioData.length) {
        stopCGM();
        return;
      }
      // Add slight noise for realism
      const base = scenarioData[idx];
      const noise = (Math.random() - 0.5) * 4;
      const v = Math.round(base + noise);
      cgmIndexRef.current++;

      setCurrentGlucose(v);
      setCgmHistory(prev => {
        const newEntry = {
          time: idx + 1,
          value: v,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          zone: glucoseZone(v).label,
        };
        const updated = [...prev, newEntry];

        // Compute session stats
        const vals = updated.map(e => e.value);
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        const inRange = vals.filter(v => v >= 70 && v <= 180).length;
        const tir = Math.round((inRange / vals.length) * 100);
        const eA1c = ((avg + 46.7) / 28.7).toFixed(1);
        setSessionStats({ avg, tir, eA1c, min: Math.min(...vals), max: Math.max(...vals), readings: vals.length });

        return updated;
      });

      // Alert logic
      const z = glucoseZone(v);
      if (z.severity >= 3) {
        setCgmAlerts(prev => {
          const msg = v < 70
            ? `⚠️ LOW ALERT: ${v} mg/dL at reading ${idx + 1}. Take fast-acting carbs immediately.`
            : `🚨 HIGH ALERT: ${v} mg/dL at reading ${idx + 1}. Check insulin and hydration.`;
          if (prev.find(a => a.msg === msg)) return prev;
          return [...prev, { id: Date.now(), msg, color: z.color, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
        });
      }

      // Auto-predict food spike if food was recently logged
    }, 1800);

    return () => clearInterval(cgmIntervalRef.current);
  }, [cgmActive, scenario, stopCGM]);

  // ── Manual glucose log ─────────────────────────────────────────────────────
  const logManual = () => {
    const v = parseFloat(manualGlucose);
    if (!v || v < 20 || v > 600) return;
    const entry = {
      time: cgmHistory.length + 1,
      value: v,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      zone: glucoseZone(v).label,
      note: manualNote,
      meal: manualMeal,
      manual: true,
    };
    setCgmHistory(prev => [...prev, entry]);
    setCurrentGlucose(v);
    setManualGlucose("");
    setManualNote("");
  };

  // ── Food AI: predict glucose impact ───────────────────────────────────────
  const searchFood = () => {
    if (!foodQuery.trim()) return;
    setFoodLoading(true);
    setTimeout(() => {
      const q = foodQuery.toLowerCase().trim();
      // Fuzzy match
      let match = null;
      for (const [key, food] of Object.entries(FOOD_DB)) {
        if (q.includes(key) || key.includes(q) || food.name.toLowerCase().includes(q)) {
          match = { key, ...food };
          break;
        }
      }
      // Partial word match
      if (!match) {
        const words = q.split(" ");
        for (const word of words) {
          for (const [key, food] of Object.entries(FOOD_DB)) {
            if (key.includes(word) || food.name.toLowerCase().includes(word) || word.includes(key)) {
              match = { key, ...food };
              break;
            }
          }
          if (match) break;
        }
      }
      if (match) {
        setSelectedFood(match);
        // Predict spike based on current glucose
        if (currentGlucose) {
          const predicted = Math.round(currentGlucose + match.glucoseImpact);
          const peakAt = new Date(Date.now() + match.peakTime * 60000);
          setPredictedSpike({
            current: currentGlucose,
            predicted,
            peakTime: match.peakTime,
            peakAt: peakAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            zone: glucoseZone(predicted),
            delta: match.glucoseImpact,
          });
        }
      } else {
        setSelectedFood({ notFound: true, query: foodQuery });
        setPredictedSpike(null);
      }
      setFoodLoading(false);
    }, 800);
  };

  const logFood = () => {
    if (!selectedFood || selectedFood.notFound) return;
    const entry = {
      ...selectedFood,
      loggedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      glucoseAtLog: currentGlucose,
      id: Date.now(),
    };
    setFoodLog(prev => [entry, ...prev]);
    setFoodQuery("");
    setSelectedFood(null);
    setPredictedSpike(null);
  };

  // ── Health Risk Calculator (ADA) ──────────────────────────────────────────
  const calcRisk = () => {
    let score = 0; const bd = [];
    const f = riskForm;
    const age = parseFloat(f.age);
    const bmi = parseFloat(f.bmi);

    if (age >= 40 && age < 50) { score += 1; bd.push({ factor: "Age 40–49", pts: 1 }); }
    else if (age >= 50 && age < 60) { score += 2; bd.push({ factor: "Age 50–59", pts: 2 }); }
    else if (age >= 60) { score += 3; bd.push({ factor: "Age 60+", pts: 3 }); }
    if (f.sex === "male") { score += 1; bd.push({ factor: "Male sex", pts: 1 }); }
    if (f.familyHistory) { score += 1; bd.push({ factor: "Family history of diabetes", pts: 1 }); }
    if (f.highBP) { score += 1; bd.push({ factor: "High blood pressure", pts: 1 }); }
    if (f.activity === "low") { score += 1; bd.push({ factor: "Sedentary lifestyle", pts: 1 }); }
    if (bmi >= 25 && bmi < 30) { score += 1; bd.push({ factor: "Overweight (BMI 25–29.9)", pts: 1 }); }
    else if (bmi >= 30) { score += 2; bd.push({ factor: "Obese (BMI 30+)", pts: 2 }); }
    if (f.sex === "male") {
      const waist = parseFloat(f.waist);
      if (waist > 102) { score += 2; bd.push({ factor: "Waist > 102cm", pts: 2 }); }
      if (f.sleepApnea) { score += 1; bd.push({ factor: "Sleep apnea", pts: 1 }); }
      if (f.smoking) { score += 1; bd.push({ factor: "Smoking", pts: 1 }); }
      if (f.alcohol === "high") { score += 1; bd.push({ factor: "High alcohol intake", pts: 1 }); }
    }
    if (f.sex === "female" && f.gestational) { score += 1; bd.push({ factor: "Gestational diabetes history", pts: 1 }); }

    // Integrate CGM data into risk
    if (sessionStats) {
      if (sessionStats.tir < 70) { score += 1; bd.push({ factor: `Low Time-in-Range (${sessionStats.tir}% from CGM)`, pts: 1 }); }
      if (sessionStats.avg > 154) { score += 1; bd.push({ factor: `High avg glucose (${sessionStats.avg} mg/dL from CGM)`, pts: 1 }); }
    }

    setRiskScore(score);
    setRiskBreakdown(bd);
  };

  const riskColor = s => s < 3 ? T.green : s < 6 ? T.amber : T.red;
  const riskLabel = s => s < 3 ? "Low Risk" : s < 6 ? "Moderate Risk" : "High Risk";

  // ── GlycoBot ──────────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!botInput.trim()) return;
    const userText = botInput.trim();
    setBotInput("");
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "user", text: userText, time }]);
    setBotLoading(true);

    try {
      const cgmCtx = currentGlucose
        ? `Current CGM reading: ${currentGlucose} mg/dL (${zone.label}), trend: ${trend.label}.`
        : "No CGM reading active.";
      const statsCtx = sessionStats
        ? `Session stats: avg ${sessionStats.avg} mg/dL, TIR ${sessionStats.tir}%, eA1c ${sessionStats.eA1c}%.`
        : "";
      const foodCtx = foodLog.length > 0
        ? `Recent food logged: ${foodLog.slice(0, 3).map(f => f.name).join(", ")}.`
        : "";
      const riskCtx = riskScore !== null
        ? `ADA risk score: ${riskScore} (${riskLabel(riskScore)}).`
        : "";
      const profileCtx = profile
        ? `Patient: ${profile.name}, age ${profile.age}, ${profile.diabetesType}.`
        : "No profile set.";

      const systemPrompt = `You are GlycoBot, an expert AI diabetes care assistant embedded in GlycoTrack — a real-time CGM monitoring app. You have access to live patient data.

${profileCtx} ${cgmCtx} ${statsCtx} ${foodCtx} ${riskCtx}

Your role: Provide clear, actionable, medically-informed guidance. Reference the patient's actual data when relevant. Be warm but precise. Keep responses to 2-4 sentences unless a detailed explanation is needed. Always recommend consulting a doctor for treatment decisions. For emergencies (glucose < 54 or > 300, chest pain, unconsciousness), immediately urge calling emergency services.

You can analyze: glucose trends, food impacts, medication timing, exercise effects, sleep patterns, stress, and overall diabetes management.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== "bot" || messages.indexOf(m) !== 0)
              .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
            { role: "user", content: userText },
          ],
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "I couldn't respond right now. Please try again.";
      setMessages(prev => [...prev, { role: "bot", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Connection issue. Please check your network and try again.", time }]);
    }
    setBotLoading(false);
  };

  // ── SOS ───────────────────────────────────────────────────────────────────
  const triggerSOS = () => {
    setSosActive(true);
    setTimeout(() => setSosActive(false), 6000);
  };

  // ── Reminders ─────────────────────────────────────────────────────────────
  const toggleReminder = id => setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  const addReminder = () => {
    if (!newRemLabel || !newRemTime) return;
    setReminders(prev => [...prev, { id: Date.now(), label: newRemLabel, time: newRemTime, done: false, type: "custom" }]);
    setNewRemLabel(""); setNewRemTime("");
  };

  const saveProfile = () => {
    if (!pForm.name || !pForm.age) return;
    setProfile(pForm);
    // Pre-fill risk form from profile
    setRiskForm(prev => ({ ...prev, age: pForm.age, sex: pForm.sex, bmi: pForm.weight && pForm.height ? (pForm.weight / ((pForm.height / 100) ** 2)).toFixed(1) : "" }));
    setTab("cgm");
  };

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE SETUP SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (!profile) return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      {/* Background gradient orbs */}
      <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="glass-strong fade-up" style={{ borderRadius: 28, padding: "40px 32px", maxWidth: 460, width: "100%" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32
          }}>🩺</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            <span className="gradient-text">GlycoTrack</span>
          </h1>
          <p style={{ color: T.muted, fontSize: 14 }}>Advanced CGM Diabetes Companion</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "Your name", span: 2 },
            { label: "Age", key: "age", type: "number", placeholder: "e.g. 65" },
            { label: "Weight (kg)", key: "weight", type: "number", placeholder: "e.g. 72" },
            { label: "Height (cm)", key: "height", type: "number", placeholder: "e.g. 165" },
            { label: "Caregiver Name", key: "caregiver", type: "text", placeholder: "Family contact" },
            { label: "Caregiver Phone", key: "caregiverPhone", type: "tel", placeholder: "Phone number", span: 2 },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.span === 2 ? "1 / -1" : "auto" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={pForm[f.key]}
                onChange={e => setPForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14 }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Sex</label>
            <select value={pForm.sex} onChange={e => setPForm(p => ({ ...p, sex: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14 }}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Diabetes Type</label>
            <select value={pForm.diabetesType} onChange={e => setPForm(p => ({ ...p, diabetesType: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14 }}>
              <option value="none">Not Diagnosed</option>
              <option value="prediabetes">Prediabetes</option>
              <option value="type2">Type 2</option>
              <option value="type1">Type 1</option>
            </select>
          </div>
        </div>

        <Btn onClick={saveProfile} style={{ width: "100%", marginTop: 24, padding: "15px", fontSize: 16 }}>
          Launch GlycoTrack →
        </Btn>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // MAIN APP RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>

      {/* Background orbs */}
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${zone.color}08 0%, transparent 70%)`, pointerEvents: "none", transition: "background 1s ease", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="glass" style={{ position: "sticky", top: 0, zIndex: 50, padding: "14px 20px", borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🩺</div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>
                <span className="gradient-text">GlycoTrack</span>
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: -1 }}>Hello, {profile.name.split(" ")[0]}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Live indicator */}
            {cgmActive && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: "5px 12px" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, animation: "blink 1s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>LIVE</span>
              </div>
            )}
            {/* Current glucose pill */}
            {currentGlucose && (
              <div style={{ background: `${zone.color}18`, border: `1px solid ${zone.color}44`, borderRadius: 20, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: zone.color, fontFamily: "'Space Grotesk', sans-serif" }}>{currentGlucose}</span>
                <span style={{ fontSize: 10, color: T.muted }}>mg/dL</span>
                <span style={{ fontSize: 13, color: trend.color }}>{trend.arrow}</span>
              </div>
            )}
            {/* SOS */}
            <button onClick={triggerSOS} className={sosActive ? "pulse-anim" : ""} style={{
              background: sosActive ? T.red : "rgba(239,68,68,0.15)",
              border: `1px solid ${sosActive ? T.red : "rgba(239,68,68,0.3)"}`,
              color: T.redLt, borderRadius: 10, padding: "7px 12px",
              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer"
            }}>🆘 {sosActive ? "SENT!" : "SOS"}</button>
          </div>
        </div>
      </div>

      {/* SOS Banner */}
      {sosActive && (
        <div className="fade-in" style={{ background: `linear-gradient(135deg, ${T.red}, #dc2626)`, padding: "14px 20px", textAlign: "center", zIndex: 49 }}>
          <p style={{ fontWeight: 800, fontSize: 15 }}>🚨 Emergency alert sent to {profile.caregiver || "caregiver"}!</p>
          <p style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>If life-threatening — call 112 / 911 immediately</p>
        </div>
      )}

      {/* Alert Banner */}
      {cgmAlerts.length > 0 && (
        <div style={{ background: `${cgmAlerts[cgmAlerts.length - 1].color}18`, borderBottom: `1px solid ${cgmAlerts[cgmAlerts.length - 1].color}33`, padding: "10px 20px" }}>
          <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: cgmAlerts[cgmAlerts.length - 1].color }}>{cgmAlerts[cgmAlerts.length - 1].msg}</p>
            <button onClick={() => setCgmAlerts([])} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 0", position: "relative", zIndex: 1 }}>

        {/* ════ CGM TAB ════ */}
        {tab === "cgm" && (
          <>
            {/* Main CGM Card */}
            <GlassCard style={{ padding: "28px 24px", background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <SectionLabel>Continuous Glucose Monitor</SectionLabel>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700 }}>Live Reading</h2>
                </div>
                {sessionStats && (
                  <Badge color={T.green}>Session Active</Badge>
                )}
              </div>

              {/* Gauge */}
              <CGMGauge value={currentGlucose} zone={zone} trend={trend} isLive={cgmActive} />

              {/* Target range bar */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.muted }}>40 mg/dL</span>
                  <span style={{ fontSize: 11, color: T.muted }}>Target: 70–180</span>
                  <span style={{ fontSize: 11, color: T.muted }}>300 mg/dL</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 8, position: "relative", overflow: "hidden" }}>
                  {/* Target zone highlight */}
                  <div style={{ position: "absolute", left: "11.5%", width: "53.8%", height: "100%", background: "rgba(16,185,129,0.2)", borderRadius: 8 }} />
                  {/* Current position */}
                  {currentGlucose && (
                    <div style={{
                      position: "absolute",
                      left: `${Math.min(Math.max(((currentGlucose - 40) / 260) * 100, 0), 100)}%`,
                      top: "50%", transform: "translate(-50%, -50%)",
                      width: 14, height: 14, borderRadius: "50%",
                      background: zone.color, border: "2px solid #060818",
                      boxShadow: `0 0 10px ${zone.color}`,
                      transition: "left 0.8s ease"
                    }} />
                  )}
                </div>
              </div>

              {/* Scenario selector */}
              <div style={{ marginTop: 20 }}>
                <SectionLabel>Simulation Scenario</SectionLabel>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(CGM_SCENARIOS).map(([key, sc]) => (
                    <button key={key} onClick={() => { setScenario(key); if (cgmActive) { stopCGM(); setTimeout(startCGM, 100); } }}
                      style={{
                        padding: "7px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${scenario === key ? sc.color : T.border}`,
                        background: scenario === key ? `${sc.color}18` : "transparent",
                        color: scenario === key ? sc.color : T.muted,
                        cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all .2s"
                      }}>{sc.label}</button>
                  ))}
                </div>
              </div>

              {/* Start/Stop */}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Btn onClick={cgmActive ? stopCGM : startCGM}
                  variant={cgmActive ? "red" : "green"} style={{ flex: 1 }}>
                  {cgmActive ? "⏹ Stop CGM" : "▶ Start CGM Simulation"}
                </Btn>
                {!cgmActive && (
                  <Btn variant="ghost" onClick={() => { setCgmHistory([]); setCurrentGlucose(null); setSessionStats(null); setCgmAlerts([]); }} small>
                    Reset
                  </Btn>
                )}
              </div>
            </GlassCard>

            {/* Session Stats */}
            {sessionStats && (
              <GlassCard className="fade-up">
                <SectionLabel>Session Analytics</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Avg Glucose", value: `${sessionStats.avg}`, unit: "mg/dL", color: glucoseZone(sessionStats.avg).color },
                    { label: "Time in Range", value: `${sessionStats.tir}`, unit: "%", color: sessionStats.tir >= 70 ? T.green : sessionStats.tir >= 50 ? T.amber : T.red },
                    { label: "Est. A1c", value: sessionStats.eA1c, unit: "%", color: parseFloat(sessionStats.eA1c) < 7 ? T.green : parseFloat(sessionStats.eA1c) < 8 ? T.amber : T.red },
                    { label: "Min", value: sessionStats.min, unit: "mg/dL", color: glucoseZone(sessionStats.min).color },
                    { label: "Max", value: sessionStats.max, unit: "mg/dL", color: glucoseZone(sessionStats.max).color },
                    { label: "Readings", value: sessionStats.readings, unit: "pts", color: T.blueLt },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{s.unit}</p>
                    </div>
                  ))}
                </div>

                {/* TIR bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Time in Range</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sessionStats.tir >= 70 ? T.green : T.amber }}>{sessionStats.tir}%</span>
                  </div>
                  <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ width: `${sessionStats.tir}%`, height: "100%", background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, borderRadius: 10, transition: "width 0.8s ease" }} />
                  </div>
                  <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                    {sessionStats.tir >= 70 ? "✓ Good control — target is ≥70% TIR" : sessionStats.tir >= 50 ? "⚠ Below target — aim for ≥70% TIR" : "⚠ Poor control — consult your doctor"}
                  </p>
                </div>
              </GlassCard>
            )}

            {/* CGM Chart */}
            {cgmHistory.length > 1 && (
              <GlassCard>
                <SectionLabel>Glucose Trace</SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cgmHistory}>
                    <defs>
                      <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={zone.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={zone.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[40, 280]} />
                    <Tooltip content={<GlucoseTooltip />} />
                    <ReferenceLine y={70}  stroke={T.amber} strokeDasharray="4 4" strokeWidth={1.5} />
                    <ReferenceLine y={180} stroke={T.red}   strokeDasharray="4 4" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="value" stroke={zone.color} strokeWidth={2.5}
                      fill="url(#glucoseGrad)" dot={false} activeDot={{ r: 5, fill: zone.color }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center" }}>
                  {[["Low < 70", T.amber], ["Target 70–180", T.green], ["High > 180", T.red]].map(([l, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 20, height: 2, background: c, borderRadius: 2 }} />
                      <span style={{ fontSize: 10, color: T.muted }}>{l}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Manual Log */}
            <GlassCard>
              <SectionLabel>Manual Glucose Entry</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>Glucose (mg/dL)</label>
                  <input type="number" value={manualGlucose} onChange={e => setManualGlucose(e.target.value)}
                    placeholder="e.g. 95" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: "center" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>Context</label>
                  <select value={manualMeal} onChange={e => setManualMeal(e.target.value)}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 13 }}>
                    <option value="fasting">Fasting</option>
                    <option value="pre-meal">Pre-Meal</option>
                    <option value="post-meal">Post-Meal (2hr)</option>
                    <option value="bedtime">Bedtime</option>
                    <option value="random">Random</option>
                  </select>
                </div>
              </div>
              <input value={manualNote} onChange={e => setManualNote(e.target.value)}
                placeholder="Optional note (e.g. after exercise, stressed)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13, marginBottom: 10 }} />
              <Btn onClick={logManual} disabled={!manualGlucose} style={{ width: "100%" }}>Log Reading</Btn>
            </GlassCard>

            {/* Alerts log */}
            {cgmAlerts.length > 0 && (
              <GlassCard>
                <SectionLabel>Alert History</SectionLabel>
                {cgmAlerts.map(a => (
                  <div key={a.id} className="slide-in" style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: `${a.color}12`, border: `1px solid ${a.color}30`, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.msg}</p>
                      <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </GlassCard>
            )}
          </>
        )}

        {/* ════ FOOD AI TAB ════ */}
        {tab === "food" && (
          <>
            <GlassCard>
              <SectionLabel>Food AI — Glucose Impact Predictor</SectionLabel>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>What are you eating?</h2>
              <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
                {currentGlucose
                  ? `Current glucose: ${currentGlucose} mg/dL — I'll predict your post-meal spike.`
                  : "Start CGM for real-time spike prediction."}
              </p>

              {/* Search */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={foodQuery} onChange={e => setFoodQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchFood()}
                  placeholder="Type food name (e.g. rice, apple, dal, roti...)"
                  style={{ flex: 1, padding: "12px 14px", borderRadius: 12, fontSize: 14 }} />
                <Btn onClick={searchFood} variant="primary" small style={{ padding: "12px 16px" }}>
                  {foodLoading ? <Spinner /> : "🔍"}
                </Btn>
              </div>

              {/* Quick chips */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                {["rice", "dal", "roti", "apple", "egg", "oats", "banana", "salad"].map(f => (
                  <button key={f} className="food-chip" onClick={() => { setFoodQuery(f); }}
                    style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all .2s" }}>
                    {FOOD_DB[f]?.emoji} {f}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Food Result */}
            {selectedFood && !selectedFood.notFound && (
              <GlassCard className="fade-up" style={{ border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 6 }}>{selectedFood.emoji}</div>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700 }}>{selectedFood.name}</h3>
                    <Badge color={selectedFood.gi > 60 ? T.red : selectedFood.gi > 40 ? T.amber : T.green}>
                      GI: {selectedFood.gi} — {selectedFood.gi > 60 ? "High" : selectedFood.gi > 40 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <Btn onClick={logFood} variant="green" small>+ Log Food</Btn>
                </div>

                {/* Macros */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: "Carbs", value: `${selectedFood.carbs}g`, color: T.amber },
                    { label: "Protein", value: `${selectedFood.protein}g`, color: T.blue },
                    { label: "Fat", value: `${selectedFood.fat}g`, color: T.purple },
                    { label: "Fiber", value: `${selectedFood.fiber}g`, color: T.green },
                  ].map(m => (
                    <div key={m.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{m.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Glucose Impact Prediction */}
                {predictedSpike && (
                  <div style={{ background: `${predictedSpike.zone.color}12`, border: `1px solid ${predictedSpike.zone.color}30`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Predicted Glucose Impact</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: T.muted }}>Now</p>
                        <p style={{ fontSize: 24, fontWeight: 800, color: glucoseZone(predictedSpike.current).color, fontFamily: "'Space Grotesk', sans-serif" }}>{predictedSpike.current}</p>
                      </div>
                      <div style={{ flex: 1, height: 3, background: `linear-gradient(90deg, ${glucoseZone(predictedSpike.current).color}, ${predictedSpike.zone.color})`, borderRadius: 3, position: "relative" }}>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 14 }}>→</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: T.muted }}>Peak ~{predictedSpike.peakTime}min</p>
                        <p style={{ fontSize: 24, fontWeight: 800, color: predictedSpike.zone.color, fontFamily: "'Space Grotesk', sans-serif" }}>{predictedSpike.predicted}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Badge color={predictedSpike.zone.color}>+{predictedSpike.delta} mg/dL spike</Badge>
                      <span style={{ fontSize: 11, color: T.muted }}>Peak at ~{predictedSpike.peakAt}</span>
                    </div>
                    {predictedSpike.predicted > 180 && (
                      <p style={{ fontSize: 12, color: T.amber, marginTop: 10, fontWeight: 600 }}>
                        ⚠ This food may push you above target range. Consider a smaller portion or pairing with protein/fiber.
                      </p>
                    )}
                  </div>
                )}

                {/* Tip */}
                <div style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px" }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{selectedFood.tip}</p>
                </div>
              </GlassCard>
            )}

            {selectedFood?.notFound && (
              <GlassCard className="fade-up">
                <p style={{ color: T.muted, fontSize: 14 }}>No match for "{selectedFood.query}". Try: rice, dal, roti, apple, banana, egg, oats, chicken, salad, bread, pizza, idli, mango, chocolate</p>
              </GlassCard>
            )}

            {/* Food Log */}
            {foodLog.length > 0 && (
              <GlassCard>
                <SectionLabel>Today's Food Log</SectionLabel>
                {foodLog.map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 24 }}>{f.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</p>
                      <p style={{ fontSize: 11, color: T.muted }}>Logged at {f.loggedAt} · Glucose was {f.glucoseAtLog || "—"} mg/dL</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 12, color: T.amber, fontWeight: 700 }}>+{f.glucoseImpact} mg/dL</p>
                      <p style={{ fontSize: 10, color: T.muted }}>GI {f.gi}</p>
                    </div>
                  </div>
                ))}
                {/* Daily carb total */}
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: T.muted }}>Total carbs today</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>{foodLog.reduce((a, f) => a + f.carbs, 0).toFixed(0)}g</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: T.muted }}>Avg GI</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.blueLt }}>{Math.round(foodLog.reduce((a, f) => a + f.gi, 0) / foodLog.length)}</span>
                  </div>
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* ════ RISK TAB ════ */}
        {tab === "risk" && (
          <>
            <GlassCard>
              <SectionLabel>ADA Diabetes Risk Assessment</SectionLabel>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Health Risk Score</h2>
              {sessionStats && (
                <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: T.blueLt, fontWeight: 600 }}>
                    📡 CGM data integrated — avg {sessionStats.avg} mg/dL, TIR {sessionStats.tir}% will factor into your score
                  </p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Age", key: "age", type: "number", placeholder: "e.g. 65" },
                  { label: "BMI", key: "bmi", type: "number", placeholder: "e.g. 27.5" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={riskForm[f.key]}
                      onChange={e => setRiskForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 14 }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>Sex</label>
                  <select value={riskForm.sex} onChange={e => setRiskForm(p => ({ ...p, sex: e.target.value }))}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 14 }}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>Activity Level</label>
                  <select value={riskForm.activity} onChange={e => setRiskForm(p => ({ ...p, activity: e.target.value }))}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 14 }}>
                    <option value="high">Active</option>
                    <option value="moderate">Moderate</option>
                    <option value="low">Sedentary</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div style={{ marginTop: 14 }}>
                {[
                  { key: "familyHistory", label: "Family history of diabetes" },
                  { key: "highBP", label: "History of high blood pressure" },
                ].map(f => (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={riskForm[f.key]} onChange={e => setRiskForm(p => ({ ...p, [f.key]: e.target.checked }))} style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: 14, color: T.text }}>{f.label}</span>
                  </label>
                ))}
              </div>

              {/* Sex-specific */}
              {riskForm.sex === "male" && (
                <div style={{ background: "rgba(59,130,246,0.06)", border: `1px solid rgba(59,130,246,0.15)`, borderRadius: 12, padding: "14px", marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.blueLt, marginBottom: 10 }}>Male-Specific Factors</p>
                  <input type="number" placeholder="Waist circumference (cm)" value={riskForm.waist}
                    onChange={e => setRiskForm(p => ({ ...p, waist: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13, marginBottom: 10 }} />
                  {[{ key: "sleepApnea", label: "Sleep apnea / heavy snoring" }, { key: "smoking", label: "Smoker / tobacco user" }].map(f => (
                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={riskForm[f.key]} onChange={e => setRiskForm(p => ({ ...p, [f.key]: e.target.checked }))} style={{ width: 18, height: 18 }} />
                      <span style={{ fontSize: 13, color: T.text }}>{f.label}</span>
                    </label>
                  ))}
                  <select value={riskForm.alcohol} onChange={e => setRiskForm(p => ({ ...p, alcohol: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13, marginTop: 4 }}>
                    <option value="none">No alcohol</option>
                    <option value="moderate">Moderate (1-2/day)</option>
                    <option value="high">High (3+/day)</option>
                  </select>
                </div>
              )}
              {riskForm.sex === "female" && (
                <div style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.15)", borderRadius: 12, padding: "14px", marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.pink, marginBottom: 10 }}>Female-Specific Factors</p>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={riskForm.gestational} onChange={e => setRiskForm(p => ({ ...p, gestational: e.target.checked }))} style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: 13, color: T.text }}>History of gestational diabetes</span>
                  </label>
                </div>
              )}

              <Btn onClick={calcRisk} style={{ width: "100%", marginTop: 16 }}>Calculate Risk Score</Btn>
            </GlassCard>

            {/* Risk Result */}
            {riskScore !== null && (
              <GlassCard className="fade-up" style={{ border: `1px solid ${riskColor(riskScore)}33` }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: riskColor(riskScore), fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{riskScore}</div>
                  <div style={{ marginTop: 8 }}><Badge color={riskColor(riskScore)}>{riskLabel(riskScore)}</Badge></div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", margin: "16px 0 8px" }}>
                    <div style={{ width: `${Math.min((riskScore / 14) * 100, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${T.green}, ${T.amber}, ${T.red})`, borderRadius: 8, transition: "width 1s ease" }} />
                  </div>
                  <p style={{ fontSize: 11, color: T.muted }}>Score ≥5 = elevated risk (ADA guideline)</p>
                </div>

                {riskBreakdown.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <SectionLabel>Risk Factors</SectionLabel>
                    {riskBreakdown.map((b, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 13, color: T.text }}>{b.factor}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.blueLt }}>+{b.pts}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background: riskScore >= 5 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", borderRadius: 12, padding: "14px", border: `1px solid ${riskScore >= 5 ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: riskScore >= 5 ? T.red : T.green, marginBottom: 6 }}>
                    {riskScore >= 5 ? "⚠ Action Recommended" : "✓ Continue Healthy Habits"}
                  </p>
                  <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                    {riskScore >= 5
                      ? "Your score indicates elevated diabetes risk. Please consult your doctor for a formal HbA1c or fasting glucose test. Early intervention can prevent or significantly delay Type 2 diabetes."
                      : "Your current risk is low. Maintain regular physical activity, a balanced low-GI diet, and routine annual check-ups."}
                  </p>
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* ════ BOT TAB ════ */}
        {tab === "bot" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
            {/* Context bar */}
            {(currentGlucose || sessionStats) && (
              <div className="glass" style={{ borderRadius: 14, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {currentGlucose && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: zone.color }} />
                    <span style={{ fontSize: 12, color: T.muted }}>Glucose: </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: zone.color }}>{currentGlucose} mg/dL</span>
                  </div>
                )}
                {sessionStats && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: T.muted }}>TIR: </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sessionStats.tir >= 70 ? T.green : T.amber }}>{sessionStats.tir}%</span>
                  </div>
                )}
                {foodLog.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: T.muted }}>Last food: </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{foodLog[0].emoji} {foodLog[0].name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
              {messages.map((m, i) => (
                <div key={i} className="fade-in" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 14, gap: 8 }}>
                  {m.role === "bot" && (
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, alignSelf: "flex-end" }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: "80%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.role === "user" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "rgba(255,255,255,0.06)",
                    border: m.role === "bot" ? `1px solid ${T.border}` : "none",
                    fontSize: 14, lineHeight: 1.6, color: T.text,
                  }}>
                    {m.text}
                    <div style={{ fontSize: 10, color: m.role === "user" ? "rgba(255,255,255,0.5)" : T.dim, marginTop: 4, textAlign: "right" }}>{m.time}</div>
                  </div>
                </div>
              ))}
              {botLoading && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`, borderRadius: "18px 18px 18px 4px", padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0,1,2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: T.muted, animation: `blink 1.2s ${j * 0.2}s infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 8px" }}>
              {[
                currentGlucose ? `My glucose is ${currentGlucose}, is that okay?` : "How do I read my CGM?",
                "What should I eat right now?",
                "Explain my TIR score",
                "I feel dizzy",
              ].map(q => (
                <button key={q} onClick={() => setBotInput(q)}
                  style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", color: T.muted, transition: "all .2s" }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input value={botInput} onChange={e => setBotInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask about your glucose, food, or health..."
                style={{ flex: 1, padding: "13px 16px", borderRadius: 25, fontSize: 14 }} />
              <button onClick={sendMessage} disabled={botLoading} style={{
                width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                {botLoading ? <Spinner /> : <span style={{ fontSize: 18 }}>↑</span>}
              </button>
            </div>
          </div>
        )}

        {/* ════ REMINDERS TAB ════ */}
        {tab === "reminders" && (
          <>
            <GlassCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <SectionLabel>Daily Schedule</SectionLabel>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700 }}>Reminders</h2>
                </div>
                <Badge color={T.green}>{reminders.filter(r => r.done).length}/{reminders.length} done</Badge>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ width: `${(reminders.filter(r => r.done).length / reminders.length) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, borderRadius: 6, transition: "width 0.5s ease" }} />
              </div>

              {reminders.map(r => (
                <div key={r.id} className="reminder-row" onClick={() => toggleReminder(r.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                  borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  background: r.done ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${r.done ? "rgba(16,185,129,0.2)" : T.border}`,
                  transition: "all .2s",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: `2px solid ${r.done ? T.green : T.border}`,
                    background: r.done ? T.green : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {r.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: r.done ? T.muted : T.text, textDecoration: r.done ? "line-through" : "none" }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{r.time}</span>
                </div>
              ))}
            </GlassCard>

            {/* Add reminder */}
            <GlassCard>
              <SectionLabel>Add Reminder</SectionLabel>
              <input value={newRemLabel} onChange={e => setNewRemLabel(e.target.value)}
                placeholder="e.g. 💉 Insulin dose"
                style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 14, marginBottom: 10 }} />
              <input type="time" value={newRemTime} onChange={e => setNewRemTime(e.target.value)}
                style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 14, marginBottom: 12 }} />
              <Btn onClick={addReminder} variant="green" style={{ width: "100%" }}>Add Reminder</Btn>
            </GlassCard>
          </>
        )}

        {/* ════ PROFILE TAB ════ */}
        {tab === "profile" && (
          <>
            <GlassCard style={{ textAlign: "center", padding: "32px 24px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>👤</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700 }}>{profile.name}</h2>
              <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>Age {profile.age} · {profile.sex === "male" ? "Male" : "Female"} · {profile.diabetesType}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12 }}>
                {sessionStats && <Badge color={T.blue}>TIR {sessionStats.tir}%</Badge>}
                {sessionStats && <Badge color={glucoseZone(sessionStats.avg).color}>Avg {sessionStats.avg} mg/dL</Badge>}
              </div>
            </GlassCard>

            <GlassCard>
              {[
                { icon: "⚖️", label: "Weight",          value: profile.weight ? `${profile.weight} kg` : "Not set" },
                { icon: "📏", label: "Height",          value: profile.height ? `${profile.height} cm` : "Not set" },
                { icon: "🩺", label: "Diabetes Type",   value: profile.diabetesType },
                { icon: "👨‍👩‍👧", label: "Caregiver",       value: profile.caregiver || "Not set" },
                { icon: "📞", label: "Caregiver Phone", value: profile.caregiverPhone || "Not set" },
                { icon: "🩸", label: "Readings Logged", value: `${cgmHistory.length}` },
                { icon: "🍽", label: "Foods Logged",    value: `${foodLog.length}` },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{item.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 2, textTransform: "capitalize" }}>{item.value}</p>
                  </div>
                </div>
              ))}
              <Btn onClick={() => setProfile(null)} variant="ghost" style={{ width: "100%", marginTop: 16 }}>Edit Profile</Btn>
            </GlassCard>
          </>
        )}

      </div>{/* end content */}

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <div className="glass" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "8px 0 14px", zIndex: 50, borderRadius: 0,
        borderBottom: "none", borderLeft: "none", borderRight: "none",
      }}>
        {[
          { label: "CGM",       icon: "📡", id: "cgm",       alert: hasAlert },
          { label: "Food AI",   icon: "🍽",  id: "food" },
          { label: "Risk",      icon: "📊", id: "risk" },
          { label: "GlycoBot",  icon: "🤖", id: "bot" },
          { label: "Reminders", icon: "💊", id: "reminders", alert: reminders.filter(r => !r.done).length > 0 },
          { label: "Profile",   icon: "👤", id: "profile" },
        ].map(t => (
          <NavTab key={t.id} label={t.label} icon={t.icon} active={tab === t.id} onClick={() => setTab(t.id)} alert={t.alert} />
        ))}
      </div>
    </div>
  );
}
