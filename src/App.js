import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area,
  RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ── Global Styles (Light Theme) ───────────────────────────────────────────────
const globalStyle = document.createElement("style");
globalStyle.innerHTML = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #f0f4f8; font-family: 'Inter', sans-serif; color: #1e293b; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 4px; }
  ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn   { from{opacity:0;} to{opacity:1;} }
  @keyframes pulse    { 0%,100%{transform:scale(1);} 50%{transform:scale(1.07);} }
  @keyframes spin     { to{transform:rotate(360deg);} }
  @keyframes blink    { 0%,100%{opacity:1;} 50%{opacity:0.15;} }
  @keyframes numberUp { from{transform:translateY(8px);opacity:0;} to{transform:translateY(0);opacity:1;} }
  @keyframes slideIn  { from{transform:translateX(-16px);opacity:0;} to{transform:translateX(0);opacity:1;} }

  .fade-up    { animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both; }
  .fade-in    { animation: fadeIn 0.35s ease both; }
  .pulse-anim { animation: pulse 2s ease-in-out infinite; }
  .spin-anim  { animation: spin 0.75s linear infinite; }
  .slide-in   { animation: slideIn 0.4s cubic-bezier(.16,1,.3,1) both; }

  .card { background:#fff; border:1px solid #e2e8f0; box-shadow:0 2px 16px rgba(0,0,0,0.06); border-radius:20px; }
  .card-blue  { background:linear-gradient(135deg,#eff6ff,#f5f3ff); border:1px solid #ddd6fe; box-shadow:0 2px 16px rgba(99,102,241,0.08); }
  .card-green { background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border:1px solid #bbf7d0; }

  .gradient-text {
    background: linear-gradient(135deg,#1d4ed8,#7c3aed);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .nav-btn:hover  { background:#f1f5f9 !important; }
  .btn-p:hover    { opacity:.88; transform:translateY(-1px); }
  .btn-p          { transition:all .2s ease; }
  .chip:hover     { border-color:#3b82f6 !important; background:#eff6ff !important; color:#1d4ed8 !important; }
  .rem-row:hover  { background:#f8fafc !important; }
  .sc-btn         { transition:all .2s; }
  .sc-btn:hover   { box-shadow:0 4px 12px rgba(0,0,0,0.1); }

  input, select, textarea {
    background:#f8fafc !important; border:1.5px solid #e2e8f0 !important;
    color:#1e293b !important; font-family:'Inter',sans-serif !important;
    outline:none !important; transition:border-color .2s, box-shadow .2s;
  }
  input:focus, select:focus, textarea:focus {
    border-color:#3b82f6 !important;
    box-shadow:0 0 0 3px rgba(59,130,246,0.12) !important;
    background:#fff !important;
  }
  input::placeholder { color:#94a3b8 !important; }
  select option { background:#fff; color:#1e293b; }
  input[type="checkbox"] { accent-color:#3b82f6; }
  input[type="time"]::-webkit-calendar-picker-indicator { opacity:.5; }

  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line { stroke:#f1f5f9 !important; }
  .recharts-text { fill:#94a3b8 !important; font-size:11px !important; }
`;
document.head.appendChild(globalStyle);

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#f0f4f8", surface:"#fff", border:"#e2e8f0", borderHi:"#cbd5e1",
  text:"#1e293b", muted:"#64748b", dim:"#94a3b8",
  blue:"#2563eb", blueLt:"#3b82f6",
  purple:"#7c3aed", purpleLt:"#8b5cf6",
  green:"#059669", greenLt:"#10b981",
  amber:"#d97706", amberLt:"#f59e0b",
  red:"#dc2626", redLt:"#ef4444",
  teal:"#0d9488", tealLt:"#14b8a6",
  pink:"#db2777",
};

// ── Glucose helpers ───────────────────────────────────────────────────────────
const glucoseZone = (v) => {
  if (!v||isNaN(v)) return {color:T.muted, label:"No Data",    severity:0};
  if (v < 54)       return {color:T.red,   label:"CRITICAL LOW",severity:4};
  if (v < 70)       return {color:T.amber, label:"LOW",         severity:3};
  if (v <= 99)      return {color:T.green, label:"NORMAL",      severity:0};
  if (v <= 125)     return {color:T.amber, label:"ELEVATED",    severity:1};
  if (v <= 180)     return {color:T.red,   label:"HIGH",        severity:2};
  return             {color:T.red,   label:"CRITICAL HIGH",severity:4};
};
const trendArrow = (history) => {
  if (history.length < 3) return {arrow:"→",label:"Stable",color:T.muted};
  const last = history.slice(-3).map(h=>h.value);
  const d = last[2]-last[0];
  if (d > 15)  return {arrow:"↑↑",label:"Rising Fast", color:T.red};
  if (d > 5)   return {arrow:"↑", label:"Rising",      color:T.amber};
  if (d < -15) return {arrow:"↓↓",label:"Falling Fast",color:T.red};
  if (d < -5)  return {arrow:"↓", label:"Falling",     color:T.amber};
  return              {arrow:"→", label:"Stable",       color:T.green};
};

// ── Food DB ───────────────────────────────────────────────────────────────────
const FOOD_DB = {
  rice:       {name:"White Rice",      gi:73,carbs:28, fiber:0.4,protein:2.7,fat:0.3, glucoseImpact:35,peakTime:45,emoji:"🍚",tip:"High GI — pair with protein and vegetables to blunt the glucose spike."},
  brown_rice: {name:"Brown Rice",      gi:50,carbs:23, fiber:1.8,protein:2.5,fat:0.9, glucoseImpact:20,peakTime:60,emoji:"🍚",tip:"Better than white rice. Fiber slows glucose absorption."},
  apple:      {name:"Apple",           gi:36,carbs:25, fiber:4.4,protein:0.3,fat:0.2, glucoseImpact:12,peakTime:30,emoji:"🍎",tip:"Excellent choice. Low GI, high fiber — minimal glucose impact."},
  banana:     {name:"Banana",          gi:51,carbs:23, fiber:2.6,protein:1.1,fat:0.3, glucoseImpact:18,peakTime:35,emoji:"🍌",tip:"Moderate impact. Eat with peanut butter to slow absorption."},
  bread:      {name:"White Bread",     gi:75,carbs:15, fiber:0.6,protein:2.7,fat:1.0, glucoseImpact:30,peakTime:30,emoji:"🍞",tip:"High GI. Switch to whole grain or sourdough for better control."},
  oats:       {name:"Oatmeal",         gi:55,carbs:27, fiber:4.0,protein:5.0,fat:2.5, glucoseImpact:15,peakTime:60,emoji:"🥣",tip:"Great breakfast. Beta-glucan fiber significantly slows glucose rise."},
  egg:        {name:"Boiled Egg",      gi:0, carbs:0.6,fiber:0,  protein:13, fat:11,  glucoseImpact:2, peakTime:0, emoji:"🥚",tip:"Near-zero glucose impact. Excellent protein source for diabetics."},
  chicken:    {name:"Grilled Chicken", gi:0, carbs:0,  fiber:0,  protein:31, fat:3.6, glucoseImpact:1, peakTime:0, emoji:"🍗",tip:"Zero carbs, zero glucose impact. Ideal for blood sugar management."},
  chocolate:  {name:"Milk Chocolate",  gi:45,carbs:60, fiber:1.5,protein:7.7,fat:30,  glucoseImpact:40,peakTime:40,emoji:"🍫",tip:"High sugar. Dark chocolate (70%+) is significantly better."},
  salad:      {name:"Green Salad",     gi:15,carbs:3,  fiber:2.0,protein:1.5,fat:0.2, glucoseImpact:3, peakTime:20,emoji:"🥗",tip:"Excellent! Low carb, high fiber. Eat before high-GI foods to blunt spikes."},
  pizza:      {name:"Pizza Slice",     gi:60,carbs:33, fiber:2.3,protein:11, fat:10,  glucoseImpact:38,peakTime:50,emoji:"🍕",tip:"Moderate-high impact. Fat slows absorption but carbs are significant."},
  idli:       {name:"Idli (2 pcs)",    gi:70,carbs:26, fiber:1.0,protein:4.0,fat:0.5, glucoseImpact:28,peakTime:40,emoji:"🫓",tip:"Fermented — slightly better than plain rice. Pair with sambar for fiber."},
  dal:        {name:"Dal / Lentils",   gi:29,carbs:20, fiber:8.0,protein:9.0,fat:0.4, glucoseImpact:8, peakTime:60,emoji:"🍲",tip:"Excellent for diabetics. High protein and fiber, very low GI."},
  mango:      {name:"Mango",           gi:51,carbs:15, fiber:1.6,protein:0.8,fat:0.4, glucoseImpact:20,peakTime:35,emoji:"🥭",tip:"Moderate GI. Limit portions and avoid overripe varieties."},
  roti:       {name:"Whole Wheat Roti",gi:62,carbs:18, fiber:2.7,protein:3.5,fat:0.5, glucoseImpact:22,peakTime:45,emoji:"🫓",tip:"Better than white bread. Fiber helps moderate glucose rise."},
};

// ── CGM Scenarios ─────────────────────────────────────────────────────────────
const CGM_SCENARIOS = {
  normal:   {label:"Stable Normal",   color:T.green,  data:[88,90,92,89,94,91,95,93,90,96,92,88,91,94,90,93]},
  postmeal: {label:"Post-Meal Spike", color:T.amber,  data:[95,110,138,165,192,210,195,175,155,138,122,110,102,97,94,92]},
  hypo:     {label:"Hypoglycemia",    color:T.red,    data:[105,95,82,70,62,55,48,60,75,88,95,100,98,96,94,92]},
  dawn:     {label:"Dawn Phenomenon", color:T.purple, data:[88,86,84,82,88,96,108,118,125,130,128,122,115,108,102,96]},
  labile:   {label:"Labile / Brittle",color:T.pink,   data:[95,140,80,165,60,130,190,75,110,155,70,125,180,90,140,100]},
};

// ── GlycoTrack AI Logo (inline SVG) ──────────────────────────────────────────
const GlycoLogo = ({size=40}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" fill="#0f172a"/>
    <circle cx="52"  cy="48"  r="7"  fill="#14b8a6"/>
    <circle cx="38"  cy="110" r="5"  fill="#14b8a6"/>
    <circle cx="148" cy="145" r="8"  fill="#14b8a6"/>
    <circle cx="162" cy="68"  r="5"  fill="#14b8a6"/>
    <circle cx="70"  cy="158" r="6"  fill="#f59e0b"/>
    <circle cx="155" cy="110" r="4"  fill="#f59e0b"/>
    <rect x="28" y="72" width="38" height="48" rx="6" fill="#fff" stroke="#14b8a6" strokeWidth="2"/>
    <polyline points="34,108 40,96 46,102 52,84 58,90 62,80" stroke="#14b8a6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="44" y="118" width="6" height="10" rx="2" fill="#14b8a6"/>
    <ellipse cx="95" cy="88" rx="22" ry="24" fill="#b2e4f0"/>
    <rect x="76" y="56" width="38" height="30" rx="12" fill="#b2e4f0"/>
    <ellipse cx="88" cy="70" rx="4" ry="4" fill="#0f172a"/>
    <ellipse cx="102" cy="70" rx="4" ry="4" fill="#0f172a"/>
    <circle cx="89" cy="69" r="1.5" fill="#fff"/>
    <circle cx="103" cy="69" r="1.5" fill="#fff"/>
    <path d="M88 78 Q95 84 102 78" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="76" cy="68" r="5" fill="#7dd3e8"/>
    <circle cx="114" cy="68" r="5" fill="#7dd3e8"/>
    <path d="M90 92 C90 89 86 87 86 91 C86 94 90 97 90 97 C90 97 94 94 94 91 C94 87 90 89 90 92Z" fill="#ef4444"/>
    <path d="M112 95 Q130 90 132 105" stroke="#b2e4f0" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <circle cx="133" cy="108" r="5" fill="#b2e4f0"/>
    <circle cx="148" cy="78" r="16" fill="#f4c5a8"/>
    <path d="M133 72 Q140 60 148 62 Q156 60 163 72 Q158 65 148 66 Q138 65 133 72Z" fill="#94a3b8"/>
    <path d="M141 76 Q143 74 145 76" stroke="#7c5c3e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M151 76 Q153 74 155 76" stroke="#7c5c3e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M142 82 Q148 87 154 82" stroke="#7c5c3e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="148" cy="108" rx="16" ry="18" fill="#14b8a6"/>
    <rect x="138" y="38" width="32" height="26" rx="6" fill="#14b8a6"/>
    <line x1="154" y1="40" x2="154" y2="62" stroke="#fff" strokeWidth="1.5"/>
    <line x1="148" y1="40" x2="148" y2="62" stroke="#fff" strokeWidth="1.5"/>
    <ellipse cx="154" cy="51" rx="8" ry="7" fill="none" stroke="#fff" strokeWidth="1.5"/>
    <path d="M162 88 L162 100 Q162 108 170 112 Q178 108 178 100 L178 88 L170 85 Z" fill="#f59e0b"/>
    <path d="M166 99 L169 102 L174 96" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="38" y="38" width="22" height="10" rx="5" fill="#f59e0b" transform="rotate(-35 49 43)"/>
    <line x1="43" y1="47" x2="55" y2="39" stroke="#fff" strokeWidth="1.5"/>
  </svg>
);

// ── Reusable components ───────────────────────────────────────────────────────
const Card = ({children, style={}, className=""}) => (
  <div className={`card fade-up ${className}`} style={{padding:"22px 20px",marginBottom:16,...style}}>{children}</div>
);

const Btn = ({children, onClick, variant="primary", style={}, disabled=false, small=false}) => {
  const bg = {
    primary:`linear-gradient(135deg,${T.blue},${T.purple})`,
    green:  `linear-gradient(135deg,${T.green},${T.teal})`,
    red:    `linear-gradient(135deg,${T.red},${T.pink})`,
    amber:  `linear-gradient(135deg,${T.amber},#f97316)`,
    ghost:  "#f1f5f9",
  };
  return (
    <button onClick={onClick} disabled={disabled} className="btn-p" style={{
      background:disabled?"#e2e8f0":bg[variant],
      color:disabled?T.dim:variant==="ghost"?T.text:"#fff",
      border:variant==="ghost"?`1px solid ${T.border}`:"none",
      borderRadius:12, padding:small?"8px 14px":"13px 20px",
      fontSize:small?13:15, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
      fontFamily:"'Inter',sans-serif", display:"inline-flex", alignItems:"center",
      justifyContent:"center", gap:8, ...style
    }}>{children}</button>
  );
};

const Badge = ({children, color=T.blue}) => (
  <span style={{background:`${color}18`,color,border:`1px solid ${color}40`,
    borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,
    letterSpacing:.5,textTransform:"uppercase"}}>{children}</span>
);

const Spinner = () => (
  <div className="spin-anim" style={{width:17,height:17,border:"2.5px solid rgba(255,255,255,0.35)",borderTopColor:"#fff",borderRadius:"50%"}}/>
);

const Label = ({children}) => (
  <p style={{fontSize:11,fontWeight:700,color:T.dim,letterSpacing:1.4,textTransform:"uppercase",marginBottom:10}}>{children}</p>
);

// ── CGM Gauge ─────────────────────────────────────────────────────────────────
const CGMGauge = ({value, zone, trend, isLive}) => {
  const pct = Math.min(Math.max(((value||0)-40)/(300-40),0),1);
  return (
    <div style={{textAlign:"center",position:"relative"}}>
      {isLive && <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${zone.color}12 0%,transparent 70%)`,animation:"pulse 2s ease-in-out infinite",pointerEvents:"none"}}/>}
      <div style={{position:"relative",display:"inline-block"}}>
        <RadialBarChart width={200} height={200} cx={100} cy={100} innerRadius={70} outerRadius={90} startAngle={220} endAngle={-40}
          data={[{value:100,fill:"#e2e8f0"},{value:pct*100,fill:zone.color}]} barSize={12}>
          <PolarAngleAxis type="number" domain={[0,100]} tick={false}/>
          <RadialBar dataKey="value" cornerRadius={6}/>
        </RadialBarChart>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <div style={{fontSize:value?42:28,fontWeight:900,color:zone.color,fontFamily:"'Space Grotesk',sans-serif",lineHeight:1,animation:isLive?"numberUp .4s ease":"none"}}>{value||"—"}</div>
          <div style={{fontSize:11,color:T.muted,fontWeight:600,marginTop:2}}>mg/dL</div>
        </div>
      </div>
      <div style={{marginTop:6}}><Badge color={zone.color}>{zone.label}</Badge></div>
      {trend && value && (
        <div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span style={{fontSize:20,color:trend.color,fontWeight:900}}>{trend.arrow}</span>
          <span style={{fontSize:12,color:trend.color,fontWeight:600}}>{trend.label}</span>
        </div>
      )}
    </div>
  );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const GlucoseTooltip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  const v=payload[0].value; const z=glucoseZone(v);
  return (
    <div style={{background:"#fff",border:`1px solid ${z.color}44`,borderRadius:12,padding:"10px 14px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
      <p style={{fontSize:11,color:T.muted,marginBottom:4}}>Reading #{label}</p>
      <p style={{fontSize:18,fontWeight:800,color:z.color}}>{v} <span style={{fontSize:11}}>mg/dL</span></p>
      <p style={{fontSize:11,color:z.color,marginTop:2}}>{z.label}</p>
    </div>
  );
};

// ── Nav Tab ───────────────────────────────────────────────────────────────────
const NavTab = ({icon,label,active,onClick,alert}) => (
  <button onClick={onClick} className="nav-btn" style={{
    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
    padding:"8px 10px",border:"none",borderRadius:14,cursor:"pointer",
    background:active?"#eff6ff":"transparent",
    color:active?T.blue:T.muted,
    fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:10,
    transition:"all .2s",position:"relative",minWidth:50,
  }}>
    {alert && <div style={{position:"absolute",top:6,right:8,width:8,height:8,borderRadius:"50%",background:T.red,border:"2px solid #f0f4f8"}}/>}
    <span style={{fontSize:20}}>{icon}</span>{label}
  </button>
);

// ════════════════════════════════════════════════════════════════════════════
export default function App() {

  const [tab, setTab]         = useState("cgm");
  const [profile, setProfile] = useState(null);
  const [pForm, setPForm]     = useState({name:"",age:"",sex:"male",weight:"",height:"",diabetesType:"type2",caregiver:"",caregiverPhone:""});

  // CGM
  const [cgmActive, setCgmActive]           = useState(false);
  const [scenario, setScenario]             = useState("normal");
  const [cgmHistory, setCgmHistory]         = useState([]);
  const [currentGlucose, setCurrentGlucose] = useState(null);
  const [cgmAlerts, setCgmAlerts]           = useState([]);
  const [sessionStats, setSessionStats]     = useState(null);
  const cgmIntervalRef = useRef(null);
  const cgmIndexRef    = useRef(0);

  // Manual
  const [manualGlucose, setManualGlucose] = useState("");
  const [manualNote, setManualNote]       = useState("");
  const [manualMeal, setManualMeal]       = useState("fasting");

  // Food AI
  const [foodQuery, setFoodQuery]           = useState("");
  const [selectedFood, setSelectedFood]     = useState(null);
  const [foodLog, setFoodLog]               = useState([]);
  const [foodLoading, setFoodLoading]       = useState(false);
  const [predictedSpike, setPredictedSpike] = useState(null);

  // Risk — merged into CGM tab via sub-toggle
  const [showRisk, setShowRisk]         = useState(false);
  const [riskForm, setRiskForm]         = useState({age:"",sex:"male",bmi:"",activity:"moderate",familyHistory:false,highBP:false,gestational:false,waist:"",sleepApnea:false,smoking:false,alcohol:"none"});
  const [riskScore, setRiskScore]       = useState(null);
  const [riskBreakdown, setRiskBreakdown] = useState([]);

  // Bot
  const [messages, setMessages]     = useState([{role:"bot",text:"Hi! I'm GlycoBot 🤖 — your AI diabetes companion. I can see your live CGM data and help you understand your readings, food choices, and health trends. What's on your mind?",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
  const [botInput, setBotInput]     = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Reminders
  const [reminders, setReminders] = useState([
    {id:1,label:"💊 Morning Medication",   time:"08:00",done:false},
    {id:2,label:"🩸 Fasting Glucose Check",time:"07:00",done:false},
    {id:3,label:"🍽 Log Breakfast",         time:"08:30",done:false},
    {id:4,label:"🩸 Post-Lunch Check",      time:"14:00",done:false},
    {id:5,label:"💊 Evening Medication",    time:"18:00",done:false},
    {id:6,label:"🩸 Bedtime Check",         time:"22:00",done:false},
  ]);
  const [newRemLabel, setNewRemLabel] = useState("");
  const [newRemTime,  setNewRemTime]  = useState("");
  const [sosActive, setSosActive]     = useState(false);

  const zone     = glucoseZone(currentGlucose);
  const trend    = trendArrow(cgmHistory);
  const hasAlert = cgmAlerts.length > 0 || zone.severity >= 3;

  // ── CGM Engine ──────────────────────────────────────────────────────────────
  const startCGM = useCallback(() => {
    cgmIndexRef.current = 0;
    setCgmHistory([]); setCgmAlerts([]); setSessionStats(null); setCgmActive(true);
  }, []);

  const stopCGM = useCallback(() => {
    setCgmActive(false);
    if (cgmIntervalRef.current) clearInterval(cgmIntervalRef.current);
  }, []);

  useEffect(() => {
    if (!cgmActive) return;
    const data = CGM_SCENARIOS[scenario].data;
    cgmIntervalRef.current = setInterval(() => {
      const idx = cgmIndexRef.current;
      if (idx >= data.length) { stopCGM(); return; }
      const v = Math.round(data[idx] + (Math.random()-.5)*4);
      cgmIndexRef.current++;
      setCurrentGlucose(v);
      setCgmHistory(prev => {
        const updated = [...prev, {time:idx+1,value:v,timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),zone:glucoseZone(v).label}];
        const vals = updated.map(e=>e.value);
        const avg  = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
        const tir  = Math.round((vals.filter(x=>x>=70&&x<=180).length/vals.length)*100);
        setSessionStats({avg,tir,eA1c:((avg+46.7)/28.7).toFixed(1),min:Math.min(...vals),max:Math.max(...vals),readings:vals.length});
        return updated;
      });
      const z = glucoseZone(v);
      if (z.severity >= 3) {
        setCgmAlerts(prev => {
          const msg = v<70 ? `⚠️ LOW: ${v} mg/dL — take fast-acting carbs immediately.` : `🚨 HIGH: ${v} mg/dL — check insulin and hydration.`;
          if (prev.find(a=>a.msg===msg)) return prev;
          return [...prev,{id:Date.now(),msg,color:z.color,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}];
        });
      }
    }, 1800);
    return () => clearInterval(cgmIntervalRef.current);
  }, [cgmActive, scenario, stopCGM]);

  const logManual = () => {
    const v = parseFloat(manualGlucose);
    if (!v||v<20||v>600) return;
    setCgmHistory(prev=>[...prev,{time:prev.length+1,value:v,timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),zone:glucoseZone(v).label,note:manualNote,meal:manualMeal,manual:true}]);
    setCurrentGlucose(v); setManualGlucose(""); setManualNote("");
  };

  // ── Food AI ─────────────────────────────────────────────────────────────────
  const searchFood = () => {
    if (!foodQuery.trim()) return;
    setFoodLoading(true);
    setTimeout(() => {
      const q = foodQuery.toLowerCase().trim();
      let match = null;
      for (const [key,food] of Object.entries(FOOD_DB)) {
        if (q.includes(key)||key.includes(q)||food.name.toLowerCase().includes(q)) {match={key,...food};break;}
      }
      if (!match) {
        for (const word of q.split(" ")) {
          for (const [key,food] of Object.entries(FOOD_DB)) {
            if (key.includes(word)||food.name.toLowerCase().includes(word)||word.includes(key)) {match={key,...food};break;}
          }
          if (match) break;
        }
      }
      if (match) {
        setSelectedFood(match);
        if (currentGlucose) {
          const predicted = Math.round(currentGlucose+match.glucoseImpact);
          setPredictedSpike({current:currentGlucose,predicted,peakTime:match.peakTime,peakAt:new Date(Date.now()+match.peakTime*60000).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),zone:glucoseZone(predicted),delta:match.glucoseImpact});
        }
      } else { setSelectedFood({notFound:true,query:foodQuery}); setPredictedSpike(null); }
      setFoodLoading(false);
    }, 800);
  };

  const logFood = () => {
    if (!selectedFood||selectedFood.notFound) return;
    setFoodLog(prev=>[{...selectedFood,loggedAt:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),glucoseAtLog:currentGlucose,id:Date.now()},...prev]);
    setFoodQuery(""); setSelectedFood(null); setPredictedSpike(null);
  };

  // ── Risk ─────────────────────────────────────────────────────────────────────
  const calcRisk = () => {
    let score=0; const bd=[];
    const f=riskForm, age=parseFloat(f.age), bmi=parseFloat(f.bmi);
    if(age>=40&&age<50){score+=1;bd.push({factor:"Age 40–49",pts:1});}
    else if(age>=50&&age<60){score+=2;bd.push({factor:"Age 50–59",pts:2});}
    else if(age>=60){score+=3;bd.push({factor:"Age 60+",pts:3});}
    if(f.sex==="male"){score+=1;bd.push({factor:"Male sex",pts:1});}
    if(f.familyHistory){score+=1;bd.push({factor:"Family history of diabetes",pts:1});}
    if(f.highBP){score+=1;bd.push({factor:"High blood pressure",pts:1});}
    if(f.activity==="low"){score+=1;bd.push({factor:"Sedentary lifestyle",pts:1});}
    if(bmi>=25&&bmi<30){score+=1;bd.push({factor:"Overweight (BMI 25–29.9)",pts:1});}
    else if(bmi>=30){score+=2;bd.push({factor:"Obese (BMI 30+)",pts:2});}
    if(f.sex==="male"){
      const w=parseFloat(f.waist);
      if(w>102){score+=2;bd.push({factor:"Waist > 102cm",pts:2});}
      if(f.sleepApnea){score+=1;bd.push({factor:"Sleep apnea",pts:1});}
      if(f.smoking){score+=1;bd.push({factor:"Smoking",pts:1});}
      if(f.alcohol==="high"){score+=1;bd.push({factor:"High alcohol intake",pts:1});}
    }
    if(f.sex==="female"&&f.gestational){score+=1;bd.push({factor:"Gestational diabetes history",pts:1});}
    // Integrate live CGM data
    if(sessionStats){
      if(sessionStats.tir<70){score+=1;bd.push({factor:`Low TIR (${sessionStats.tir}% — from CGM)`,pts:1});}
      if(sessionStats.avg>154){score+=1;bd.push({factor:`High avg glucose (${sessionStats.avg} mg/dL — from CGM)`,pts:1});}
    }
    setRiskScore(score); setRiskBreakdown(bd);
  };
  const riskColor = s => s<3?T.green:s<6?T.amber:T.red;
  const riskLabel = s => s<3?"Low Risk":s<6?"Moderate Risk":"High Risk";

  // ── Bot ──────────────────────────────────────────────────────────────────────
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const sendMessage = async () => {
    if (!botInput.trim()) return;
    const userText=botInput.trim(); setBotInput("");
    const time=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    setMessages(prev=>[...prev,{role:"user",text:userText,time}]); setBotLoading(true);
    try {
      const cgmCtx   = currentGlucose?`Current CGM: ${currentGlucose} mg/dL (${zone.label}), trend: ${trend.label}.`:"No CGM active.";
      const statsCtx = sessionStats?`Session: avg ${sessionStats.avg} mg/dL, TIR ${sessionStats.tir}%, eA1c ${sessionStats.eA1c}%.`:"";
      const foodCtx  = foodLog.length>0?`Recent food: ${foodLog.slice(0,3).map(f=>f.name).join(", ")}.`:"";
      const riskCtx  = riskScore!==null?`ADA risk score: ${riskScore} (${riskLabel(riskScore)}).`:"";
      const profCtx  = profile?`Patient: ${profile.name}, age ${profile.age}, ${profile.diabetesType}.`:"No profile.";
      const sys = `You are GlycoBot, an expert AI diabetes care assistant in GlycoTrack — a real-time CGM app. ${profCtx} ${cgmCtx} ${statsCtx} ${foodCtx} ${riskCtx} Be warm, precise, 2-4 sentences. Always recommend consulting a doctor. For emergencies (glucose<54 or >300, chest pain), urge calling emergency services immediately.`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:sys,
          messages:[...messages.filter(m=>m.role!=="bot"||messages.indexOf(m)!==0).map(m=>({role:m.role==="user"?"user":"assistant",content:m.text})),{role:"user",content:userText}]})
      });
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("")||"I couldn't respond right now.";
      setMessages(prev=>[...prev,{role:"bot",text:reply,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
    } catch { setMessages(prev=>[...prev,{role:"bot",text:"Connection issue. Please try again.",time}]); }
    setBotLoading(false);
  };

  const triggerSOS    = () => {setSosActive(true);setTimeout(()=>setSosActive(false),6000);};
  const toggleReminder= id=>setReminders(prev=>prev.map(r=>r.id===id?{...r,done:!r.done}:r));
  const addReminder   = () => {
    if(!newRemLabel||!newRemTime) return;
    setReminders(prev=>[...prev,{id:Date.now(),label:newRemLabel,time:newRemTime,done:false}]);
    setNewRemLabel(""); setNewRemTime("");
  };
  const saveProfile = () => {
    if(!pForm.name||!pForm.age) return;
    setProfile(pForm);
    setRiskForm(prev=>({...prev,age:pForm.age,sex:pForm.sex,bmi:pForm.weight&&pForm.height?(pForm.weight/((pForm.height/100)**2)).toFixed(1):""}));
    setTab("cgm");
  };

  // ── Profile Setup ────────────────────────────────────────────────────────────
  if (!profile) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#dbeafe 0%,#ede9fe 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{position:"fixed",top:-100,left:-100,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:-100,right:-100,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div className="card fade-up" style={{borderRadius:28,padding:"40px 32px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><GlycoLogo size={88}/></div>
          <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:26,fontWeight:700,color:T.text,marginBottom:6}}>
            <span className="gradient-text">GlycoTrack AI</span>
          </h1>
          <p style={{color:T.muted,fontSize:14}}>Advanced CGM Diabetes Companion</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{label:"Full Name",key:"name",type:"text",placeholder:"Your name",span:2},{label:"Age",key:"age",type:"number",placeholder:"e.g. 65"},{label:"Weight (kg)",key:"weight",type:"number",placeholder:"e.g. 72"},{label:"Height (cm)",key:"height",type:"number",placeholder:"e.g. 165"},{label:"Caregiver Name",key:"caregiver",type:"text",placeholder:"Family contact"},{label:"Caregiver Phone",key:"caregiverPhone",type:"tel",placeholder:"Phone number",span:2}].map(f=>(
            <div key={f.key} style={{gridColumn:f.span===2?"1 / -1":"auto"}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:T.muted,marginBottom:5}}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={pForm[f.key]} onChange={e=>setPForm(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%",padding:"11px 14px",borderRadius:10,fontSize:14}}/>
            </div>
          ))}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:T.muted,marginBottom:5}}>Sex</label>
            <select value={pForm.sex} onChange={e=>setPForm(p=>({...p,sex:e.target.value}))} style={{width:"100%",padding:"11px 14px",borderRadius:10,fontSize:14}}>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:T.muted,marginBottom:5}}>Diabetes Type</label>
            <select value={pForm.diabetesType} onChange={e=>setPForm(p=>({...p,diabetesType:e.target.value}))} style={{width:"100%",padding:"11px 14px",borderRadius:10,fontSize:14}}>
              <option value="none">Not Diagnosed</option><option value="prediabetes">Prediabetes</option>
              <option value="type2">Type 2</option><option value="type1">Type 1</option>
            </select>
          </div>
        </div>
        <Btn onClick={saveProfile} style={{width:"100%",marginTop:24,padding:"15px",fontSize:16}}>Launch GlycoTrack →</Btn>
      </div>
    </div>
  );

  // ── Main App ─────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Inter',sans-serif",paddingBottom:80}}>
      <div style={{position:"fixed",top:-150,left:-150,width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,${zone.color}06 0%,transparent 70%)`,pointerEvents:"none",transition:"background 1.2s ease",zIndex:0}}/>

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"#fff",borderBottom:`1px solid ${T.border}`,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",padding:"11px 20px"}}>
        <div style={{maxWidth:520,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <GlycoLogo size={36}/>
            <div>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15}}><span className="gradient-text">GlycoTrack AI</span></div>
              <div style={{fontSize:10,color:T.muted,marginTop:-1}}>Hello, {profile.name.split(" ")[0]}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {cgmActive && (
              <div style={{display:"flex",alignItems:"center",gap:5,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:20,padding:"5px 11px"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:T.green,animation:"blink 1s infinite"}}/>
                <span style={{fontSize:11,fontWeight:700,color:T.green}}>LIVE</span>
              </div>
            )}
            {currentGlucose && (
              <div style={{background:`${zone.color}14`,border:`1px solid ${zone.color}40`,borderRadius:20,padding:"5px 11px",display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:16,fontWeight:800,color:zone.color,fontFamily:"'Space Grotesk',sans-serif"}}>{currentGlucose}</span>
                <span style={{fontSize:10,color:T.muted}}>mg/dL</span>
                <span style={{fontSize:13,color:trend.color}}>{trend.arrow}</span>
              </div>
            )}
            <button onClick={triggerSOS} className={sosActive?"pulse-anim":""} style={{background:sosActive?T.red:"#fef2f2",border:`1px solid ${sosActive?T.red:"#fecaca"}`,color:sosActive?"#fff":T.red,borderRadius:10,padding:"7px 12px",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              🆘 {sosActive?"SENT!":"SOS"}
            </button>
          </div>
        </div>
      </div>

      {sosActive && (
        <div className="fade-in" style={{background:`linear-gradient(135deg,${T.red},#b91c1c)`,padding:"13px 20px",textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:15,color:"#fff"}}>🚨 Emergency alert sent to {profile.caregiver||"caregiver"}!</p>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.9)",marginTop:2}}>If life-threatening — call 112 / 911 immediately</p>
        </div>
      )}
      {cgmAlerts.length > 0 && (
        <div style={{background:`${cgmAlerts[cgmAlerts.length-1].color}10`,borderBottom:`1px solid ${cgmAlerts[cgmAlerts.length-1].color}35`,padding:"9px 20px"}}>
          <div style={{maxWidth:520,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{fontSize:13,fontWeight:600,color:cgmAlerts[cgmAlerts.length-1].color}}>{cgmAlerts[cgmAlerts.length-1].msg}</p>
            <button onClick={()=>setCgmAlerts([])} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:16}}>✕</button>
          </div>
        </div>
      )}

      <div style={{maxWidth:520,margin:"0 auto",padding:"16px 16px 0",position:"relative",zIndex:1}}>

        {/* ════ CGM + HEALTH RISK (merged) ════ */}
        {tab === "cgm" && (
          <>
            {/* Sub-tab toggle */}
            <div style={{display:"flex",background:"#f1f5f9",borderRadius:14,padding:4,marginBottom:16}}>
              {[["cgm-live","📡 CGM Monitor"],["cgm-risk","📊 Health Risk"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setShowRisk(id==="cgm-risk")} style={{
                  flex:1,padding:"10px",border:"none",borderRadius:11,cursor:"pointer",
                  background:(id==="cgm-risk")===showRisk?"#fff":"transparent",
                  color:(id==="cgm-risk")===showRisk?T.blue:T.muted,
                  fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,
                  boxShadow:(id==="cgm-risk")===showRisk?"0 2px 8px rgba(0,0,0,0.08)":"none",
                  transition:"all .2s"
                }}>{lbl}</button>
              ))}
            </div>

            {/* ── CGM LIVE PANEL ── */}
            {!showRisk && (
              <>
                <Card className="card-blue" style={{padding:"28px 24px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                    <div>
                      <Label>Continuous Glucose Monitor</Label>
                      <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,color:T.text}}>Live Reading</h2>
                    </div>
                    {sessionStats && <Badge color={T.green}>Session Active</Badge>}
                  </div>
                  <CGMGauge value={currentGlucose} zone={zone} trend={trend} isLive={cgmActive}/>
                  <div style={{marginTop:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:10,color:T.muted}}>40</span>
                      <span style={{fontSize:10,color:T.muted}}>Target: 70–180 mg/dL</span>
                      <span style={{fontSize:10,color:T.muted}}>300</span>
                    </div>
                    <div style={{height:8,background:"#e2e8f0",borderRadius:8,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:"11.5%",width:"53.8%",height:"100%",background:"rgba(5,150,105,0.15)",borderRadius:8}}/>
                      {currentGlucose && <div style={{position:"absolute",left:`${Math.min(Math.max(((currentGlucose-40)/260)*100,0),100)}%`,top:"50%",transform:"translate(-50%,-50%)",width:14,height:14,borderRadius:"50%",background:zone.color,border:"2px solid #fff",boxShadow:`0 0 8px ${zone.color}80`,transition:"left .8s ease"}}/>}
                    </div>
                  </div>
                  <div style={{marginTop:18}}>
                    <Label>Simulation Scenario</Label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {Object.entries(CGM_SCENARIOS).map(([key,sc])=>(
                        <button key={key} className="sc-btn" onClick={()=>{setScenario(key);if(cgmActive){stopCGM();setTimeout(startCGM,100);}}} style={{padding:"7px 12px",borderRadius:10,fontSize:12,fontWeight:600,border:`1px solid ${scenario===key?sc.color:T.border}`,background:scenario===key?`${sc.color}14`:"#fff",color:scenario===key?sc.color:T.muted,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>{sc.label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,marginTop:16}}>
                    <Btn onClick={cgmActive?stopCGM:startCGM} variant={cgmActive?"red":"green"} style={{flex:1}}>
                      {cgmActive?"⏹ Stop CGM":"▶ Start CGM Simulation"}
                    </Btn>
                    {!cgmActive && <Btn variant="ghost" onClick={()=>{setCgmHistory([]);setCurrentGlucose(null);setSessionStats(null);setCgmAlerts([]);}} small>Reset</Btn>}
                  </div>
                </Card>

                {sessionStats && (
                  <Card className="fade-up">
                    <Label>Session Analytics</Label>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                      {[
                        {label:"Avg Glucose", value:`${sessionStats.avg}`,    unit:"mg/dL",color:glucoseZone(sessionStats.avg).color},
                        {label:"Time in Range",value:`${sessionStats.tir}`,   unit:"%",    color:sessionStats.tir>=70?T.green:sessionStats.tir>=50?T.amber:T.red},
                        {label:"Est. A1c",     value:sessionStats.eA1c,       unit:"%",    color:parseFloat(sessionStats.eA1c)<7?T.green:parseFloat(sessionStats.eA1c)<8?T.amber:T.red},
                        {label:"Min",          value:sessionStats.min,        unit:"mg/dL",color:glucoseZone(sessionStats.min).color},
                        {label:"Max",          value:sessionStats.max,        unit:"mg/dL",color:glucoseZone(sessionStats.max).color},
                        {label:"Readings",     value:sessionStats.readings,   unit:"pts",  color:T.blue},
                      ].map(s=>(
                        <div key={s.label} style={{background:"#f8fafc",borderRadius:12,padding:"12px 10px",textAlign:"center",border:`1px solid ${T.border}`}}>
                          <p style={{fontSize:10,color:T.muted,fontWeight:600,marginBottom:4}}>{s.label}</p>
                          <p style={{fontSize:20,fontWeight:800,color:s.color,fontFamily:"'Space Grotesk',sans-serif",lineHeight:1}}>{s.value}</p>
                          <p style={{fontSize:10,color:T.dim,marginTop:2}}>{s.unit}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:12,fontWeight:600,color:T.text}}>Time in Range</span>
                      <span style={{fontSize:12,fontWeight:700,color:sessionStats.tir>=70?T.green:T.amber}}>{sessionStats.tir}%</span>
                    </div>
                    <div style={{height:10,background:"#e2e8f0",borderRadius:10,overflow:"hidden"}}>
                      <div style={{width:`${sessionStats.tir}%`,height:"100%",background:`linear-gradient(90deg,${T.green},${T.teal})`,borderRadius:10,transition:"width .8s ease"}}/>
                    </div>
                    <p style={{fontSize:11,color:T.muted,marginTop:6}}>
                      {sessionStats.tir>=70?"✓ Good control — target is ≥70% TIR":sessionStats.tir>=50?"⚠ Below target — aim for ≥70% TIR":"⚠ Poor control — consult your doctor"}
                    </p>
                  </Card>
                )}

                {cgmHistory.length > 1 && (
                  <Card>
                    <Label>Glucose Trace</Label>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={cgmHistory}>
                        <defs>
                          <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={zone.color} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={zone.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="time"/><YAxis domain={[40,280]}/>
                        <Tooltip content={<GlucoseTooltip/>}/>
                        <ReferenceLine y={70}  stroke={T.amber} strokeDasharray="4 4" strokeWidth={1.5}/>
                        <ReferenceLine y={180} stroke={T.red}   strokeDasharray="4 4" strokeWidth={1.5}/>
                        <Area type="monotone" dataKey="value" stroke={zone.color} strokeWidth={2.5} fill="url(#gGrad)" dot={false} activeDot={{r:5,fill:zone.color}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{display:"flex",gap:16,marginTop:10,justifyContent:"center"}}>
                      {[["Low < 70",T.amber],["Target 70–180",T.green],["High > 180",T.red]].map(([l,c])=>(
                        <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:20,height:2,background:c,borderRadius:2}}/><span style={{fontSize:10,color:T.muted}}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card>
                  <Label>Manual Glucose Entry</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div>
                      <label style={{display:"block",fontSize:12,color:T.muted,marginBottom:5}}>Glucose (mg/dL)</label>
                      <input type="number" value={manualGlucose} onChange={e=>setManualGlucose(e.target.value)} placeholder="e.g. 95" style={{width:"100%",padding:"11px 12px",borderRadius:10,fontSize:16,fontWeight:700,textAlign:"center"}}/>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,color:T.muted,marginBottom:5}}>Context</label>
                      <select value={manualMeal} onChange={e=>setManualMeal(e.target.value)} style={{width:"100%",padding:"11px 12px",borderRadius:10,fontSize:13}}>
                        <option value="fasting">Fasting</option><option value="pre-meal">Pre-Meal</option>
                        <option value="post-meal">Post-Meal (2hr)</option><option value="bedtime">Bedtime</option><option value="random">Random</option>
                      </select>
                    </div>
                  </div>
                  <input value={manualNote} onChange={e=>setManualNote(e.target.value)} placeholder="Optional note (e.g. after exercise, stressed)" style={{width:"100%",padding:"10px 12px",borderRadius:10,fontSize:13,marginBottom:10}}/>
                  <Btn onClick={logManual} disabled={!manualGlucose} style={{width:"100%"}}>Log Reading</Btn>
                </Card>

                {cgmAlerts.length > 0 && (
                  <Card>
                    <Label>Alert History</Label>
                    {cgmAlerts.map(a=>(
                      <div key={a.id} className="slide-in" style={{display:"flex",gap:10,padding:"10px 12px",borderRadius:10,background:`${a.color}10`,border:`1px solid ${a.color}28`,marginBottom:8}}>
                        <div style={{flex:1}}>
                          <p style={{fontSize:13,fontWeight:600,color:a.color}}>{a.msg}</p>
                          <p style={{fontSize:11,color:T.muted,marginTop:2}}>{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </>
            )}

            {/* ── HEALTH RISK PANEL (merged) ── */}
            {showRisk && (
              <>
                <Card>
                  <Label>ADA Diabetes Risk Assessment</Label>
                  <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,marginBottom:4,color:T.text}}>Health Risk Score</h2>
                  {sessionStats && (
                    <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
                      <p style={{fontSize:12,color:T.blue,fontWeight:600}}>📡 CGM data integrated — avg {sessionStats.avg} mg/dL, TIR {sessionStats.tir}% will factor into your score</p>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[{label:"Age",key:"age",type:"number",placeholder:"e.g. 65"},{label:"BMI",key:"bmi",type:"number",placeholder:"e.g. 27.5"}].map(f=>(
                      <div key={f.key}>
                        <label style={{display:"block",fontSize:12,color:T.muted,marginBottom:5}}>{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} value={riskForm[f.key]} onChange={e=>setRiskForm(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%",padding:"11px 12px",borderRadius:10,fontSize:14}}/>
                      </div>
                    ))}
                    <div>
                      <label style={{display:"block",fontSize:12,color:T.muted,marginBottom:5}}>Sex</label>
                      <select value={riskForm.sex} onChange={e=>setRiskForm(p=>({...p,sex:e.target.value}))} style={{width:"100%",padding:"11px 12px",borderRadius:10,fontSize:14}}>
                        <option value="male">Male</option><option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,color:T.muted,marginBottom:5}}>Activity</label>
                      <select value={riskForm.activity} onChange={e=>setRiskForm(p=>({...p,activity:e.target.value}))} style={{width:"100%",padding:"11px 12px",borderRadius:10,fontSize:14}}>
                        <option value="high">Active</option><option value="moderate">Moderate</option><option value="low">Sedentary</option>
                      </select>
                    </div>
                  </div>
                  <div style={{marginTop:14}}>
                    {[{key:"familyHistory",label:"Family history of diabetes"},{key:"highBP",label:"History of high blood pressure"}].map(f=>(
                      <label key={f.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,cursor:"pointer"}}>
                        <input type="checkbox" checked={riskForm[f.key]} onChange={e=>setRiskForm(p=>({...p,[f.key]:e.target.checked}))} style={{width:18,height:18}}/>
                        <span style={{fontSize:14,color:T.text}}>{f.label}</span>
                      </label>
                    ))}
                  </div>
                  {riskForm.sex==="male" && (
                    <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,padding:"14px",marginTop:12}}>
                      <p style={{fontSize:12,fontWeight:700,color:T.blue,marginBottom:10}}>👨 Male-Specific Factors</p>
                      <input type="number" placeholder="Waist circumference (cm)" value={riskForm.waist} onChange={e=>setRiskForm(p=>({...p,waist:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:10,fontSize:13,marginBottom:10}}/>
                      {[{key:"sleepApnea",label:"Sleep apnea / heavy snoring"},{key:"smoking",label:"Smoker / tobacco user"}].map(f=>(
                        <label key={f.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}}>
                          <input type="checkbox" checked={riskForm[f.key]} onChange={e=>setRiskForm(p=>({...p,[f.key]:e.target.checked}))} style={{width:18,height:18}}/>
                          <span style={{fontSize:13,color:T.text}}>{f.label}</span>
                        </label>
                      ))}
                      <select value={riskForm.alcohol} onChange={e=>setRiskForm(p=>({...p,alcohol:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:10,fontSize:13,marginTop:4}}>
                        <option value="none">No alcohol</option><option value="moderate">Moderate (1-2/day)</option><option value="high">High (3+/day)</option>
                      </select>
                    </div>
                  )}
                  {riskForm.sex==="female" && (
                    <div style={{background:"#fdf4ff",border:"1px solid #e9d5ff",borderRadius:12,padding:"14px",marginTop:12}}>
                      <p style={{fontSize:12,fontWeight:700,color:T.pink,marginBottom:10}}>👩 Female-Specific Factors</p>
                      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                        <input type="checkbox" checked={riskForm.gestational} onChange={e=>setRiskForm(p=>({...p,gestational:e.target.checked}))} style={{width:18,height:18}}/>
                        <span style={{fontSize:13,color:T.text}}>History of gestational diabetes</span>
                      </label>
                    </div>
                  )}
                  <Btn onClick={calcRisk} style={{width:"100%",marginTop:16}}>Calculate Risk Score</Btn>
                </Card>

                {riskScore !== null && (
                  <Card className="fade-up" style={{border:`1px solid ${riskColor(riskScore)}30`}}>
                    <div style={{textAlign:"center",marginBottom:20}}>
                      <div style={{fontSize:64,fontWeight:900,color:riskColor(riskScore),fontFamily:"'Space Grotesk',sans-serif",lineHeight:1}}>{riskScore}</div>
                      <div style={{marginTop:8}}><Badge color={riskColor(riskScore)}>{riskLabel(riskScore)}</Badge></div>
                      <div style={{height:8,background:"#e2e8f0",borderRadius:8,overflow:"hidden",margin:"16px 0 8px"}}>
                        <div style={{width:`${Math.min((riskScore/14)*100,100)}%`,height:"100%",background:`linear-gradient(90deg,${T.green},${T.amber},${T.red})`,borderRadius:8,transition:"width 1s ease"}}/>
                      </div>
                      <p style={{fontSize:11,color:T.muted}}>Score ≥5 = elevated risk (ADA guideline)</p>
                    </div>
                    {riskBreakdown.length > 0 && (
                      <div style={{marginBottom:16}}>
                        <Label>Risk Factors Identified</Label>
                        {riskBreakdown.map((b,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                            <span style={{fontSize:13,color:T.text}}>{b.factor}</span>
                            <span style={{fontSize:13,fontWeight:700,color:T.blue}}>+{b.pts}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{background:riskScore>=5?"#fef2f2":"#f0fdf4",borderRadius:12,padding:"14px",border:`1px solid ${riskScore>=5?"#fecaca":"#bbf7d0"}`}}>
                      <p style={{fontWeight:700,fontSize:14,color:riskScore>=5?T.red:T.green,marginBottom:6}}>{riskScore>=5?"⚠ Action Recommended":"✓ Continue Healthy Habits"}</p>
                      <p style={{fontSize:13,color:T.text,lineHeight:1.7}}>
                        {riskScore>=5?"Your score indicates elevated diabetes risk. Please consult your doctor for a formal HbA1c or fasting glucose test. Early intervention can prevent or significantly delay Type 2 diabetes.":"Your current risk is low. Maintain regular physical activity, a balanced low-GI diet, and routine annual check-ups."}
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* ════ FOOD AI ════ */}
        {tab === "food" && (
          <>
            <Card>
              <Label>Food AI — Glucose Impact Predictor</Label>
              <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,marginBottom:4,color:T.text}}>What are you eating?</h2>
              <p style={{fontSize:13,color:T.muted,marginBottom:16}}>
                {currentGlucose?`Current glucose: ${currentGlucose} mg/dL — I'll predict your post-meal spike.`:"Start CGM for real-time spike prediction."}
              </p>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input value={foodQuery} onChange={e=>setFoodQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchFood()} placeholder="Type food name (e.g. rice, apple, dal, roti...)" style={{flex:1,padding:"12px 14px",borderRadius:12,fontSize:14}}/>
                <Btn onClick={searchFood} small style={{padding:"12px 16px"}}>{foodLoading?<Spinner/>:"🔍"}</Btn>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["rice","dal","roti","apple","egg","oats","banana","salad"].map(f=>(
                  <button key={f} className="chip" onClick={()=>setFoodQuery(f)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${T.border}`,background:"#fff",color:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s"}}>
                    {FOOD_DB[f]?.emoji} {f}
                  </button>
                ))}
              </div>
            </Card>

            {selectedFood && !selectedFood.notFound && (
              <Card className="fade-up">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:36,marginBottom:6}}>{selectedFood.emoji}</div>
                    <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,color:T.text}}>{selectedFood.name}</h3>
                    <Badge color={selectedFood.gi>60?T.red:selectedFood.gi>40?T.amber:T.green}>GI: {selectedFood.gi} — {selectedFood.gi>60?"High":selectedFood.gi>40?"Medium":"Low"}</Badge>
                  </div>
                  <Btn onClick={logFood} variant="green" small>+ Log Food</Btn>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
                  {[["🍬 Carbs",`${selectedFood.carbs}g`,T.amber],["💪 Protein",`${selectedFood.protein}g`,T.blue],["🧈 Fat",`${selectedFood.fat}g`,T.purple],["🌿 Fiber",`${selectedFood.fiber}g`,T.green]].map(([l,v,c])=>(
                    <div key={l} style={{background:"#f8fafc",borderRadius:10,padding:"10px 8px",textAlign:"center",border:`1px solid ${T.border}`}}>
                      <p style={{fontSize:10,color:T.muted,marginBottom:3}}>{l}</p>
                      <p style={{fontSize:15,fontWeight:700,color:c}}>{v}</p>
                    </div>
                  ))}
                </div>
                {predictedSpike && (
                  <div style={{background:`${predictedSpike.zone.color}10`,border:`1px solid ${predictedSpike.zone.color}30`,borderRadius:14,padding:"16px",marginBottom:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Predicted Glucose Impact</p>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div style={{textAlign:"center"}}>
                        <p style={{fontSize:10,color:T.muted}}>Now</p>
                        <p style={{fontSize:26,fontWeight:800,color:glucoseZone(predictedSpike.current).color,fontFamily:"'Space Grotesk',sans-serif"}}>{predictedSpike.current}</p>
                      </div>
                      <div style={{flex:1,height:3,background:`linear-gradient(90deg,${glucoseZone(predictedSpike.current).color},${predictedSpike.zone.color})`,borderRadius:3,position:"relative"}}>
                        <span style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:14,color:T.muted}}>→</span>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <p style={{fontSize:10,color:T.muted}}>Peak ~{predictedSpike.peakTime}min</p>
                        <p style={{fontSize:26,fontWeight:800,color:predictedSpike.zone.color,fontFamily:"'Space Grotesk',sans-serif"}}>{predictedSpike.predicted}</p>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <Badge color={predictedSpike.zone.color}>+{predictedSpike.delta} mg/dL spike</Badge>
                      <span style={{fontSize:11,color:T.muted}}>Peak at ~{predictedSpike.peakAt}</span>
                    </div>
                    {predictedSpike.predicted > 180 && <p style={{fontSize:12,color:T.amber,marginTop:10,fontWeight:600}}>⚠ This food may push you above target range. Consider a smaller portion or pairing with protein/fiber.</p>}
                  </div>
                )}
                <div style={{display:"flex",gap:10,background:"#f8fafc",borderRadius:12,padding:"12px 14px"}}>
                  <span style={{fontSize:18}}>💡</span>
                  <p style={{fontSize:13,color:T.text,lineHeight:1.6}}>{selectedFood.tip}</p>
                </div>
              </Card>
            )}
            {selectedFood?.notFound && (
              <Card className="fade-up"><p style={{color:T.muted,fontSize:14}}>No match for "{selectedFood.query}". Try: rice, dal, roti, apple, banana, egg, oats, chicken, salad, bread, pizza, idli, mango, chocolate</p></Card>
            )}
            {foodLog.length > 0 && (
              <Card>
                <Label>Today's Food Log</Label>
                {foodLog.map(f=>(
                  <div key={f.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:24}}>{f.emoji}</span>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,fontWeight:600,color:T.text}}>{f.name}</p>
                      <p style={{fontSize:11,color:T.muted}}>Logged at {f.loggedAt} · Glucose was {f.glucoseAtLog||"—"} mg/dL</p>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:12,color:T.amber,fontWeight:700}}>+{f.glucoseImpact} mg/dL</p>
                      <p style={{fontSize:10,color:T.muted}}>GI {f.gi}</p>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:12,padding:"10px 12px",background:"#f8fafc",borderRadius:10,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:T.muted}}>Total carbs today</span>
                    <span style={{fontSize:13,fontWeight:700,color:T.amber}}>{foodLog.reduce((a,f)=>a+f.carbs,0).toFixed(0)}g</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                    <span style={{fontSize:13,color:T.muted}}>Avg GI</span>
                    <span style={{fontSize:13,fontWeight:700,color:T.blue}}>{Math.round(foodLog.reduce((a,f)=>a+f.gi,0)/foodLog.length)}</span>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ════ BOT ════ */}
        {tab === "bot" && (
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 200px)"}}>
            {(currentGlucose||sessionStats) && (
              <div style={{background:"#f8fafc",border:`1px solid ${T.border}`,borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",gap:12,flexWrap:"wrap"}}>
                {currentGlucose && <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:zone.color}}/><span style={{fontSize:12,color:T.muted}}>Glucose: </span><span style={{fontSize:12,fontWeight:700,color:zone.color}}>{currentGlucose} mg/dL</span></div>}
                {sessionStats && <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:T.muted}}>TIR: </span><span style={{fontSize:12,fontWeight:700,color:sessionStats.tir>=70?T.green:T.amber}}>{sessionStats.tir}%</span></div>}
                {foodLog.length>0 && <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,color:T.muted}}>Last food: </span><span style={{fontSize:12,fontWeight:700,color:T.text}}>{foodLog[0].emoji} {foodLog[0].name}</span></div>}
              </div>
            )}
            <div style={{flex:1,overflowY:"auto",paddingRight:4}}>
              {messages.map((m,i)=>(
                <div key={i} className="fade-in" style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:14,gap:8}}>
                  {m.role==="bot" && <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,alignSelf:"flex-end"}}>🤖</div>}
                  <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?"linear-gradient(135deg,#2563eb,#6366f1)":"#f1f5f9",border:m.role==="bot"?`1px solid ${T.border}`:"none",fontSize:14,lineHeight:1.6,color:m.role==="user"?"#fff":T.text}}>
                    {m.text}
                    <div style={{fontSize:10,color:m.role==="user"?"rgba(255,255,255,0.6)":T.dim,marginTop:4,textAlign:"right"}}>{m.time}</div>
                  </div>
                </div>
              ))}
              {botLoading && (
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div>
                  <div style={{background:"#f1f5f9",border:`1px solid ${T.border}`,borderRadius:"18px 18px 18px 4px",padding:"14px 18px"}}>
                    <div style={{display:"flex",gap:5}}>{[0,1,2].map(j=><div key={j} style={{width:7,height:7,borderRadius:"50%",background:T.dim,animation:`blink 1.2s ${j*.2}s infinite`}}/>)}</div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"10px 0 8px"}}>
              {[currentGlucose?`My glucose is ${currentGlucose}, is that okay?`:"How do I read my CGM?","What should I eat right now?","Explain my TIR score","I feel dizzy"].map(q=>(
                <button key={q} onClick={()=>setBotInput(q)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${T.border}`,background:"#f8fafc",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",color:T.muted}}>{q}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={botInput} onChange={e=>setBotInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Ask about your glucose, food, or health..." style={{flex:1,padding:"13px 16px",borderRadius:25,fontSize:14}}/>
              <button onClick={sendMessage} disabled={botLoading} style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {botLoading?<Spinner/>:<span style={{fontSize:18,color:"#fff"}}>↑</span>}
              </button>
            </div>
          </div>
        )}

        {/* ════ REMINDERS ════ */}
        {tab === "reminders" && (
          <>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><Label>Daily Schedule</Label><h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>Reminders</h2></div>
                <Badge color={T.green}>{reminders.filter(r=>r.done).length}/{reminders.length} done</Badge>
              </div>
              <div style={{height:6,background:"#e2e8f0",borderRadius:6,overflow:"hidden",marginBottom:20}}>
                <div style={{width:`${(reminders.filter(r=>r.done).length/reminders.length)*100}%`,height:"100%",background:`linear-gradient(90deg,${T.green},${T.teal})`,borderRadius:6,transition:"width .5s ease"}}/>
              </div>
              {reminders.map(r=>(
                <div key={r.id} className="rem-row" onClick={()=>toggleReminder(r.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:12,marginBottom:8,cursor:"pointer",background:r.done?"#f0fdf4":"#fafafa",border:`1px solid ${r.done?"#bbf7d0":T.border}`,transition:"all .2s"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${r.done?T.green:T.border}`,background:r.done?T.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {r.done && <span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{flex:1,fontSize:14,fontWeight:500,color:r.done?T.muted:T.text,textDecoration:r.done?"line-through":"none"}}>{r.label}</span>
                  <span style={{fontSize:13,color:T.muted,fontWeight:600}}>{r.time}</span>
                </div>
              ))}
            </Card>
            <Card>
              <Label>Add Reminder</Label>
              <input value={newRemLabel} onChange={e=>setNewRemLabel(e.target.value)} placeholder="e.g. 💉 Insulin dose" style={{width:"100%",padding:"11px 12px",borderRadius:10,fontSize:14,marginBottom:10}}/>
              <input type="time" value={newRemTime} onChange={e=>setNewRemTime(e.target.value)} style={{width:"100%",padding:"11px 12px",borderRadius:10,fontSize:14,marginBottom:12}}/>
              <Btn onClick={addReminder} variant="green" style={{width:"100%"}}>Add Reminder</Btn>
            </Card>
          </>
        )}

        {/* ════ PROFILE ════ */}
        {tab === "profile" && (
          <>
            <Card style={{textAlign:"center",padding:"32px 24px"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><GlycoLogo size={72}/></div>
              <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,color:T.text}}>{profile.name}</h2>
              <p style={{color:T.muted,fontSize:14,marginTop:4}}>Age {profile.age} · {profile.sex==="male"?"Male":"Female"} · {profile.diabetesType}</p>
              <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:12}}>
                {sessionStats && <Badge color={T.blue}>TIR {sessionStats.tir}%</Badge>}
                {sessionStats && <Badge color={glucoseZone(sessionStats.avg).color}>Avg {sessionStats.avg} mg/dL</Badge>}
              </div>
            </Card>
            <Card>
              {[{icon:"⚖️",label:"Weight",value:profile.weight?`${profile.weight} kg`:"Not set"},{icon:"📏",label:"Height",value:profile.height?`${profile.height} cm`:"Not set"},{icon:"🩺",label:"Diabetes Type",value:profile.diabetesType},{icon:"👨‍👩‍👧",label:"Caregiver",value:profile.caregiver||"Not set"},{icon:"📞",label:"Caregiver Phone",value:profile.caregiverPhone||"Not set"},{icon:"🩸",label:"Readings Logged",value:`${cgmHistory.length}`},{icon:"🍽",label:"Foods Logged",value:`${foodLog.length}`}].map(item=>(
                <div key={item.label} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:20,width:28,textAlign:"center"}}>{item.icon}</span>
                  <div style={{flex:1}}>
                    <p style={{fontSize:11,color:T.muted,fontWeight:600}}>{item.label}</p>
                    <p style={{fontSize:14,fontWeight:600,color:T.text,marginTop:2,textTransform:"capitalize"}}>{item.value}</p>
                  </div>
                </div>
              ))}
              <Btn onClick={()=>setProfile(null)} variant="ghost" style={{width:"100%",marginTop:16}}>Edit Profile</Btn>
            </Card>
          </>
        )}

      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:`1px solid ${T.border}`,boxShadow:"0 -4px 20px rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-around",alignItems:"center",padding:"6px 0 12px",zIndex:50}}>
        {[
          {label:"CGM",      icon:"📡",id:"cgm",      alert:hasAlert},
          {label:"Food AI",  icon:"🍽", id:"food"},
          {label:"GlycoBot", icon:"🤖",id:"bot"},
          {label:"Reminders",icon:"💊",id:"reminders",alert:reminders.filter(r=>!r.done).length>0},
          {label:"Profile",  icon:"👤",id:"profile"},
        ].map(t=>(
          <NavTab key={t.id} label={t.label} icon={t.icon} active={tab===t.id} onClick={()=>setTab(t.id)} alert={t.alert}/>
        ))}
      </div>
    </div>
  );
}
