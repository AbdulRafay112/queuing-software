import React from 'react'
import { useEffect, useRef } from "react";

const QueueSimulator = () => {
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

       <div className="relative z-10 flex flex-col items-center gap-3.5">
        <p className="text-[15px] tracking-[0.18em] text-white uppercase mb-1.5">
          Will create in the Future
        </p>
      </div>
    </div>
  )
}

export default QueueSimulator