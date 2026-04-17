import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
export default function Main() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    const SPACING = 28;
    const DOT_R = 1.2;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2,
        cy = H / 2;
      t += 0.008;

      const cols = Math.ceil(W / SPACING) + 2;
      const rows = Math.ceil(H / SPACING) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING;
          const y = r * SPACING;
          const dx = x - cx,
            dy = y - cy;
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
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-zinc-950 flex items-center justify-center overflow-hidden font-sans">

      {/* Dot grid canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Glow orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3.5">
        <p className="text-[11px] tracking-[0.18em] text-white/25 uppercase mb-1.5">
          Select a module
        </p>

        <SweepButton  route="/calculator" icon={<CalcIcon />} label="Queue Calculator" delay="0s" />
        <SweepButton route="/simulator" icon={<SimIcon />} label="Queue Simulator" delay="0.15s" />
      </div>
    </div>
  );
}

function SweepButton({ route, icon, label, delay }) {
  const navigate = useNavigate();

  return (
    <button
    onClick={() => navigate(route)} 
      className="sweep-btn h-12 bg-transparent border-none cursor-pointer p-0 outline-none"
      style={{ animationDelay: delay }}
    >
      <div>
      

        {/* Shimmer */}
        {/* <div
          className="btn-shimmer absolute top-0 w-[40%] h-full"
          style={{
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
            transform: "skewX(-20deg)",
          }}
        /> */}

        {/* Corner glints */}
        <span
          className="btn-corner absolute top-0 left-0 w-1.5 h-1.5"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.30)",
            borderLeft: "1px solid rgba(255,255,255,0.30)",
            borderRadius: "10px 0 0 0",
            transition: "border-color 0.3s",
          }}
        />
        <span
          className="btn-corner absolute bottom-0 right-0 w-1.5 h-1.5"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.30)",
            borderRight: "1px solid rgba(255,255,255,0.30)",
            borderRadius: "0 0 10px 0",
            transition: "border-color 0.3s",
          }}
        />

        {/* Label */}
        <span
          className="btn-label relative z-10 flex items-center gap-2 text-[14px] font-normal text-white/80"
          style={{
            letterSpacing: "0.04em",
            transition: "color 0.3s, letter-spacing 0.3s",
          }}
        >
          <span
            className="btn-icon w-4 h-4"
            style={{
              opacity: 0.6,
              transition: "opacity 0.3s, transform 0.3s",
            }}
          >
            {icon}
          </span>
          {label}
        </span>
      </div>
    </button>
  );
}

function CalcIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5" />
      <path d="M11.5 9v6M9 11.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SimIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <circle cx="3"  cy="8" r="2" fill="currentColor" />
      <circle cx="8"  cy="8" r="2" fill="currentColor" opacity=".6" />
      <circle cx="13" cy="8" r="2" fill="currentColor" opacity=".3" />
      <path d="M5 8h1M10 8h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}