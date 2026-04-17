import { useEffect, useRef, useState } from "react";

const MODELS = {
  "M/M/1": { servers: 1, general: false },
  "M/M/2": { servers: 2, general: false },
  "M/G/1": { servers: 1, general: true },
  "M/G/2": { servers: 2, general: true },
};


function validate(fields, model, inputMode) {
  const errs = {};
  const toNum = (v) => parseFloat(v);

  const lambda = inputMode === "rate"
    ? toNum(fields.lambda)
    : 1 / toNum(fields.meanIAT);

  const mu = inputMode === "rate"
    ? toNum(fields.mu)
    : 1 / toNum(fields.meanST);

  if (!fields.lambda && !fields.meanIAT) errs.arrival = "Required.";
  else if (isNaN(lambda) || lambda <= 0) errs.arrival = "Must be a positive number.";

  if (!fields.mu && !fields.meanST) errs.service = "Required.";
  else if (isNaN(mu) || mu <= 0) errs.service = "Must be a positive number.";

  if (MODELS[model].general) {
    if (!fields.sigma) errs.sigma = "Required for M/G models.";
    else if (isNaN(toNum(fields.sigma)) || toNum(fields.sigma) < 0)
      errs.sigma = "Must be ≥ 0.";
  }

  const c = MODELS[model].servers;
  if (!errs.arrival && !errs.service && lambda >= c * mu)
    errs.stability = `System unstable: λ must be < ${c} × μ (= ${(c * mu).toFixed(4)}).`;

  return errs;
}


async function calculateModels(model, lambda, mu, variance) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/calculate?model=${model}&lambda=${lambda}&mu=${mu}&variance=${variance || 0}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "API Error");
    }

    const safe = (v) => (v === undefined || v === null || v === "" ? null : parseFloat(v));

return {
  rho: safe(data.trafficIntensity),
  L: safe(data.avgCustomersSystem),
  Lq: safe(data.avgCustomersQueue),
  W: safe(data.waitTimeSystem),
  Wq: safe(data.waitTimeQueue),
  P0: safe(data.probZeroCustomers),
};
  } catch (err) {
    console.error("API ERROR:", err);
    return null;
  }
}

const fmt = (n, d = 4) => (isNaN(n) || n == null ? "—" : Number(n).toFixed(d));
const pct = (n) => (isNaN(n) || n == null ? "—" : (n * 100).toFixed(2) + "%");

export default function QueueCalculator() {
  const canvasRef = useRef(null);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId, t = 0;
    const SPACING = 28, DOT_R = 1.2;
    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      t += 0.008;
      const cols = Math.ceil(W / SPACING) + 2;
      const rows = Math.ceil(H / SPACING) + 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING, y = r * SPACING;
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wave = Math.sin(dist * 0.045 - t * 2.2) * 0.5 + 0.5;
          const falloff = Math.max(0, 1 - dist / (Math.max(W, H) * 0.72));
          const breath = Math.sin(t + dist * 0.02) * 0.25 + 0.75;
          const alpha = wave * falloff * breath * 0.55;
          if (alpha < 0.015) continue;
          ctx.beginPath();
          ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160,160,200,${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }
      animId = requestAnimationFrame(draw);
    }
    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const [model, setModel]     = useState("M/M/1");
  const [inputMode, setInputMode] = useState("rate"); // "rate" | "mean"
  const [fields, setFields]   = useState({ lambda: "", mu: "", sigma: "", meanIAT: "", meanST: "" });
  const [errors, setErrors]   = useState({});
  const [result, setResult]   = useState(null);
  const [touched, setTouched] = useState({});

  const isGeneral = MODELS[model].general;
  const servers   = MODELS[model].servers;

  const setField = (k, v) => {
    setFields((f) => ({ ...f, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };

  const handleCalculate = async () => {
    setTouched({ lambda: true, mu: true, sigma: true, meanIAT: true, meanST: true });
    const errs = validate(fields, model, inputMode);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setResult(null); return; }

    const toNum = (v) => parseFloat(v);
    const lambda = inputMode === "rate" ? toNum(fields.lambda) : 1 / toNum(fields.meanIAT);
    const mu     = inputMode === "rate" ? toNum(fields.mu)     : 1 / toNum(fields.meanST);
    // const c      = servers;

    let res;
    const variance = isGeneral ? Math.pow(toNum(fields.sigma), 2) : 0;

    // map model names for backend
    const formattedModel = model.toLowerCase().replace(/\//g, '');
    // M/M/1 → mm1, M/G/1 → mg1

    res = await calculateModels(formattedModel, lambda, mu, variance);

    if (!res) {
    setErrors({ stability: "System unstable or invalid parameters." });
    setResult(null);
    return;
  }

  setResult({ ...res, lambda, mu });
  }

  const handleModelChange = (m) => {
    setModel(m);
    setResult(null);
    setErrors({});
    setTouched({});
    setFields({ lambda: "", mu: "", sigma: "", meanIAT: "", meanST: "" });
  };

  const good = result && result.rho < 0.8;
  const warn = result && result.rho >= 0.8 && result.rho < 1;

  const inputCls = (errKey) => {
    const hasErr = touched[errKey] && errors[errKey];
    return {
      width: "100%",
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${hasErr ? "#f87171" : "rgba(255,255,255,0.12)"}`,
      borderRadius: 8,
      color: "#f1f5f9",
      padding: "9px 12px",
      fontSize: 13,
      outline: "none",
      fontFamily: "inherit",
      boxSizing: "border-box",
      transition: "border-color 0.2s",
    };
  };

  const labelCls = { fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 4, display: "block", letterSpacing: "0.06em" };
  const errCls   = { fontSize: 11, color: "#f87171", marginTop: 4 };

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "stretch", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Dot canvas */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

      {/* Orbs */}
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "#6366f1", filter: "blur(80px)", opacity: 0.13, top: -120, left: -100, animation: "drift 10s ease-in-out infinite alternate" }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "#06b6d4", filter: "blur(80px)", opacity: 0.12, bottom: -60, right: -60, animation: "drift 10s ease-in-out infinite alternate", animationDelay: "3s" }} />

      {/* ── LEFT PANEL ── */}
      <div style={{ position: "relative", zIndex: 10, width: "42%", minWidth: 320, maxWidth: 460, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "36px 32px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>

        {/* Header */}
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", margin: "0 0 6px" }}>Queueing Theory</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#f1f5f9", margin: 0 }}>Queue Calculator</h1>
        </div>

        {/* Model selector */}
        <div>
          <span style={labelCls}>Model</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.keys(MODELS).map((m) => (
              <button key={m} onClick={() => handleModelChange(m)} style={{
                padding: "9px 0",
                borderRadius: 8,
                border: model === m ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.10)",
                background: model === m ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                color: model === m ? "#a5b4fc" : "rgba(255,255,255,0.55)",
                fontSize: 13,
                fontWeight: model === m ? 500 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Input mode */}
        <div>
          <span style={labelCls}>Input mode</span>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 3 }}>
            {["rate", "mean"].map((mode) => (
              <button key={mode} onClick={() => { setInputMode(mode); setResult(null); setErrors({}); setTouched({}); }} style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 6,
                border: "none",
                background: inputMode === mode ? "rgba(99,102,241,0.25)" : "transparent",
                color: inputMode === mode ? "#a5b4fc" : "rgba(255,255,255,0.4)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}>{mode === "rate" ? "Rate (λ, μ)" : "Mean values"}</button>
            ))}
          </div>
        </div>

        {/* Arrival input */}
        <div>
          <label style={labelCls}>{inputMode === "rate" ? "Arrival rate λ (customers/unit time)" : "Mean inter-arrival time (1/λ)"}</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder={inputMode === "rate" ? "e.g. 3" : "e.g. 0.333"}
            value={inputMode === "rate" ? fields.lambda : fields.meanIAT}
            onChange={(e) => setField(inputMode === "rate" ? "lambda" : "meanIAT", e.target.value)}
            style={inputCls("arrival")}
            onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
            onBlur={(e) => { e.target.style.borderColor = (touched.arrival && errors.arrival) ? "#f87171" : "rgba(255,255,255,0.12)"; }}
          />
          {touched.arrival && errors.arrival && <p style={errCls}>{errors.arrival}</p>}
        </div>

        {/* Service input */}
        <div>
          <label style={labelCls}>{inputMode === "rate" ? `Service rate μ (per server, customers/unit time)` : "Mean service time (1/μ)"}</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder={inputMode === "rate" ? "e.g. 5" : "e.g. 0.2"}
            value={inputMode === "rate" ? fields.mu : fields.meanST}
            onChange={(e) => setField(inputMode === "rate" ? "mu" : "meanST", e.target.value)}
            style={inputCls("service")}
            onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
            onBlur={(e) => { e.target.style.borderColor = (touched.service && errors.service) ? "#f87171" : "rgba(255,255,255,0.12)"; }}
          />
          {touched.service && errors.service && <p style={errCls}>{errors.service}</p>}
        </div>

        {/* Sigma — M/G models only */}
        {isGeneral && (
          <div>
            <label style={labelCls}>Variance of service time σ</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 0.1"
              value={fields.sigma}
              onChange={(e) => setField("sigma", e.target.value)}
              style={inputCls("sigma")}
              onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
              onBlur={(e) => { e.target.style.borderColor = (touched.sigma && errors.sigma) ? "#f87171" : "rgba(255,255,255,0.12)"; }}
            />
            {touched.sigma && errors.sigma && <p style={errCls}>{errors.sigma}</p>}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 5 }}>
              Set σ = 0 for deterministic (M/D/{servers}). For M/M/{servers} equivalent use σ = 1/μ.
            </p>
          </div>
        )}

        {/* Stability error */}
        {errors.stability && (
          <div style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{errors.stability}</p>
          </div>
        )}

        {/* Stability hint */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", margin: 0, lineHeight: 1.6 }}>
            Stability condition: <span style={{ color: "rgba(255,255,255,0.5)" }}>λ &lt; {servers} × μ</span> (traffic intensity ρ &lt; 1).
            {isGeneral && servers === 2 && " M/G/2 uses the Kimura approximation."}
          </p>
        </div>

        {/* Calculate button */}
        <button onClick={handleCalculate} style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(120deg, #6366f1, #06b6d4)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.04em",
          marginTop: "auto",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={(e) => e.target.style.opacity = 0.88}
          onMouseLeave={(e) => e.target.style.opacity = 1}
        >
          Calculate
        </button>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

        {!result && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.35 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M16 24h16M24 16v16" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>Results will appear here</p>
            <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, margin: 0 }}>Fill in the parameters and click Calculate</p>
          </div>
        )}

        {result && (
          <>
            {/* Status banner */}
            <div style={{
              borderRadius: 10,
              padding: "14px 18px",
              border: `1px solid ${good ? "rgba(52,211,153,0.30)" : warn ? "rgba(251,191,36,0.30)" : "rgba(248,113,113,0.30)"}`,
              background: good ? "rgba(52,211,153,0.08)" : warn ? "rgba(251,191,36,0.07)" : "rgba(248,113,113,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: good ? "#34d399" : warn ? "#fbbf24" : "#f87171",
                flexShrink: 0,
              }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: good ? "#34d399" : warn ? "#fbbf24" : "#f87171" }}>
                  {good ? "System healthy" : warn ? "System under load" : "System overloaded"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
                  Model: {model} · ρ = {pct(result.rho)} · {servers} server{servers > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Metric grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Traffic intensity ρ",       val: pct(result.rho),     good: result.rho < 0.8, warn: result.rho >= 0.8, desc: "Server utilisation" },
                { label: "Avg customers in system L",  val: fmt(result.L, 3),    good, desc: "E[L]" },
                { label: "Avg customers in queue Lq",  val: fmt(result.Lq, 3),   good, desc: "E[Lq]" },
                { label: "Avg time in system W",       val: fmt(result.W, 4),    good, desc: "E[W] time units" },
                { label: "Avg waiting time Wq",        val: fmt(result.Wq, 4),   good, desc: "E[Wq] time units" },
                ...(result.P0 != null ? [{ label: "Idle probability P₀", val: pct(result.P0), good, desc: "P(0 customers)" }] : []),
              ].map((m) => (
                <div key={m.label} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${m.good ? "rgba(52,211,153,0.18)" : m.warn ? "rgba(251,191,36,0.18)" : "rgba(248,113,113,0.15)"}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.36)", letterSpacing: "0.05em" }}>{m.label}</p>
                  <p style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 500, color: m.good ? "#34d399" : m.warn ? "#fbbf24" : "#f87171" }}>{m.val}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{m.desc}</p>
                </div>
              ))}
            </div>

            {/* Little's Law summary */}
            <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "rgba(165,180,252,0.8)", fontWeight: 500 }}>Little's Law verification</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
                L = λ × W &nbsp;→&nbsp;
                <span style={{ color: "#a5b4fc" }}>{fmt(result.L, 3)}</span> ≈ {fmt(result.lambda, 3)} × {fmt(result.W, 4)} = <span style={{ color: "#a5b4fc" }}>{fmt(result.lambda * result.W, 3)}</span>
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
                Lq = λ × Wq &nbsp;→&nbsp;
                <span style={{ color: "#a5b4fc" }}>{fmt(result.Lq, 3)}</span> ≈ {fmt(result.lambda, 3)} × {fmt(result.Wq, 4)} = <span style={{ color: "#a5b4fc" }}>{fmt(result.lambda * result.Wq, 3)}</span>
              </p>
            </div>

            {/* Interpretation */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Interpretation</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.75 }}>
                {good
                  ? `Servers are ${pct(result.rho)} utilised on average. A customer waits about ${fmt(result.Wq, 3)} time units in queue and spends ${fmt(result.W, 3)} total in the system.`
                  : warn
                  ? `Utilisation at ${pct(result.rho)} is high. Queues will grow significantly. Consider adding capacity or reducing service time.`
                  : `At ρ ≥ 1 the queue grows without bound. The system cannot handle this load — increase μ or number of servers.`}
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes drift {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(30px,20px) scale(1.08); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }
      `}</style>
    </div>
  );
}