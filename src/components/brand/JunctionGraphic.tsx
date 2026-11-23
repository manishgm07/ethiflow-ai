import { useEffect, useRef } from "react";
import type { Direction } from "@/lib/sim/types";

export interface JunctionGraphicProps {
  activePhase?: "NS" | "EW";
  greenDirections?: Direction[];
  emergencyDirection?: Direction | null;
  seniorExtensionActive?: boolean;
  safeZoneActive?: boolean;
  fixedTimerMode?: boolean;
  isFallback?: boolean;
  counts?: Partial<Record<Direction, number>>;
  countdownSec?: number;
  className?: string;
}

interface SimCar {
  dir: Direction;
  pos: number;
  color: string;
  kind: "car" | "bus" | "bike";
  waitTicks: number;
  stopped: boolean;
}

interface SimPed {
  x: number;
  y: number;
  vy: number;
  role: "standard" | "senior" | "safezone";
  phase: number;
}

const CAR_COLORS = ["#38bdf8", "#818cf8", "#34d399", "#2dd4bf", "#a78bfa"];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function JunctionGraphic({
  activePhase = "NS",
  greenDirections,
  emergencyDirection = null,
  seniorExtensionActive = false,
  safeZoneActive = false,
  fixedTimerMode = false,
  isFallback = false,
  counts = { N: 14, S: 12, E: 0, W: 1 },
  countdownSec = 18,
  className = "",
}: JunctionGraphicProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    activePhase,
    greenDirections,
    emergencyDirection,
    seniorExtensionActive,
    safeZoneActive,
    fixedTimerMode,
    isFallback,
    counts,
    countdownSec,
  });

  useEffect(() => {
    stateRef.current = {
      activePhase,
      greenDirections,
      emergencyDirection,
      seniorExtensionActive,
      safeZoneActive,
      fixedTimerMode,
      isFallback,
      counts,
      countdownSec,
    };
  }, [
    activePhase,
    greenDirections,
    emergencyDirection,
    seniorExtensionActive,
    safeZoneActive,
    fixedTimerMode,
    isFallback,
    counts,
    countdownSec,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cars: SimCar[] = [];
    let peds: SimPed[] = [];
    let ambX = 440;
    let frameId = 0;

    const isDirGreen = (dir: Direction) => {
      const s = stateRef.current;
      if (s.safeZoneActive) return false;
      if (s.emergencyDirection) return s.emergencyDirection === dir;
      if (s.greenDirections && s.greenDirections.length > 0) {
        return s.greenDirections.includes(dir);
      }
      return s.activePhase === "NS"
        ? dir === "N" || dir === "S"
        : dir === "E" || dir === "W";
    };

    const drawVectorVehicle = (car: SimCar, W: number, H: number) => {
      const delayed = car.waitTicks > 180;
      const warn = car.waitTicks > 95;
      const bodyColor = delayed ? "#ef4444" : warn ? "#f59e0b" : car.color;

      const len = car.kind === "bus" ? 36 : car.kind === "bike" ? 15 : 24;
      const wid = car.kind === "bus" ? 16 : car.kind === "bike" ? 8 : 13;

      let cx = 0;
      let cy = 0;
      let angle = 0;

      if (car.dir === "E") {
        cx = car.pos;
        cy = 228;
        angle = 0;
      } else if (car.dir === "W") {
        cx = W - car.pos;
        cy = 192;
        angle = Math.PI;
      } else if (car.dir === "N") {
        cx = 228;
        cy = car.pos;
        angle = Math.PI / 2;
      } else {
        cx = 192;
        cy = H - car.pos;
        angle = -Math.PI / 2;
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.fillStyle = "rgba(2, 6, 23, 0.45)";
      drawRoundedRect(ctx, -len / 2 + 1, -wid / 2 + 2, len, wid, 3);
      ctx.fill();

      ctx.fillStyle = bodyColor;
      drawRoundedRect(ctx, -len / 2, -wid / 2, len, wid, car.kind === "bike" ? 4 : 3);
      ctx.fill();

      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      if (car.kind === "bus") {
        drawRoundedRect(ctx, len / 2 - 8, -wid / 2 + 2, 5, wid - 4, 1.5);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillRect(-len / 2 + 4, -wid / 2 + 3, len - 15, wid - 6);
      } else if (car.kind === "car") {
        drawRoundedRect(ctx, len / 2 - 10, -wid / 2 + 2, 6, wid - 4, 1.5);
        ctx.fill();
        drawRoundedRect(ctx, -len / 2 + 3, -wid / 2 + 2.5, 4, wid - 5, 1);
        ctx.fill();
      } else {
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#fef08a";
      ctx.fillRect(len / 2 - 1.5, -wid / 2 + 1.5, 1.5, 2.5);
      ctx.fillRect(len / 2 - 1.5, wid / 2 - 4, 1.5, 2.5);

      if (car.stopped) {
        ctx.fillStyle = "#ff2a55";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#ff2a55";
        ctx.fillRect(-len / 2, -wid / 2 + 1.5, 1.8, 2.5);
        ctx.fillRect(-len / 2, wid / 2 - 4, 1.8, 2.5);
      }

      ctx.restore();
    };

    const drawVectorAmbulance = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, -20, -10, 40, 20, 4);
      ctx.fill();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-14, -1.5, 22, 3);
      ctx.fillRect(-4.5, -6, 3, 12);

      ctx.fillStyle = "#0f172a";
      drawRoundedRect(ctx, -18, -7, 6, 14, 1.5);
      ctx.fill();

      const flashRed = Date.now() % 300 < 150;
      ctx.shadowBlur = 14;
      ctx.shadowColor = flashRed ? "#ef4444" : "#38bdf8";
      ctx.fillStyle = flashRed ? "#ef4444" : "#38bdf8";
      ctx.beginPath();
      ctx.arc(-6, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawVectorPedestrian = (p: SimPed) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const stride = Math.sin(p.phase) * 2.5;

      if (p.role !== "standard") {
        ctx.strokeStyle = p.role === "safezone" ? "#ec4899" : "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle =
        p.role === "safezone"
          ? "#f472b6"
          : p.role === "senior"
          ? "#fbbf24"
          : "#38bdf8";
      drawRoundedRect(ctx, -4.5, -2.5 + stride * 0.3, 9, 5, 2.5);
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = () => {
      const s = stateRef.current;
      const W = 420;
      const H = 420;

      (["N", "S", "E", "W"] as Direction[]).forEach((dir) => {
        const demand = s.counts[dir] ?? 0;
        const spawnProb = demand === 0 ? 0 : Math.min(0.035, 0.006 + demand * 0.0014);
        const dirCars = cars.filter((c) => c.dir === dir);
        if (
          !s.safeZoneActive &&
          Math.random() < spawnProb &&
          dirCars.length < 6 &&
          !dirCars.some((c) => c.pos < 38)
        ) {
          const r = Math.random();
          const kind = r < 0.2 ? "bus" : r < 0.55 ? "bike" : "car";
          cars.push({
            dir,
            pos: -30,
            color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
            kind,
            waitTicks: 0,
            stopped: false,
          });
        }
      });

      const STOP_POS = 128;
      (["N", "S", "E", "W"] as Direction[]).forEach((dir) => {
        const green = isDirGreen(dir);
        const laneCars = cars
          .filter((c) => c.dir === dir)
          .sort((a, b) => b.pos - a.pos);
        let aheadPos: number | null = null;

        laneCars.forEach((car) => {
          const gap = car.kind === "bus" ? 44 : 32;
          let target = car.pos + (car.kind === "bus" ? 1.45 : 1.9);
          if (aheadPos !== null) target = Math.min(target, aheadPos - gap);
          if (!green && car.pos <= STOP_POS) {
            target = Math.min(target, STOP_POS);
          }
          if (Math.abs(target - car.pos) < 0.15) {
            car.waitTicks += 1;
            car.stopped = true;
          } else {
            car.waitTicks = Math.max(0, car.waitTicks - 2);
            car.stopped = false;
          }
          car.pos = Math.max(car.pos, target);
          aheadPos = car.pos;
        });
      });
      cars = cars.filter((c) => c.pos < 460);

      const pedWalkActive =
        s.safeZoneActive ||
        s.seniorExtensionActive ||
        (!isDirGreen("E") && !isDirGreen("W") && !s.emergencyDirection);

      if (pedWalkActive && peds.length < 6 && Math.random() < 0.025) {
        const down = Math.random() < 0.5;
        const role: SimPed["role"] = s.safeZoneActive
          ? "safezone"
          : s.seniorExtensionActive && Math.random() < 0.65
          ? "senior"
          : "standard";
        peds.push({
          x: 133 + Math.random() * 14,
          y: down ? 156 : 264,
          vy: (down ? 1 : -1) * (role === "senior" ? 0.36 : 0.72),
          role,
          phase: Math.random() * Math.PI * 2,
        });
      }
      peds.forEach((p) => {
        p.y += p.vy;
        p.phase += 0.14;
      });
      peds = peds.filter((p) => (p.vy > 0 ? p.y < 268 : p.y > 152));

      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#131c2e";
      drawRoundedRect(ctx, 14, 38, 140, 118, 10);
      ctx.fill();
      drawRoundedRect(ctx, 266, 38, 140, 118, 10);
      ctx.fill();
      drawRoundedRect(ctx, 14, 266, 140, 140, 10);
      ctx.fill();
      drawRoundedRect(ctx, 266, 266, 140, 140, 10);
      ctx.fill();

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 166, W, 88);
      ctx.fillRect(166, 0, 88, H);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-2, 166, W + 4, 88);
      ctx.strokeRect(166, -2, 88, H + 4);

      ctx.strokeStyle = "rgba(248, 250, 252, 0.32)";
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      [
        [0, 210, 156, 210],
        [264, 210, W, 210],
        [210, 32, 210, 156],
        [210, 264, 210, H],
      ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(248, 250, 252, 0.75)";
      ctx.fillRect(122, 212, 3, 40);
      ctx.fillRect(295, 168, 3, 40);
      ctx.fillRect(212, 122, 40, 3);
      ctx.fillRect(168, 295, 40, 3);

      ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
      for (let y = 170; y < 250; y += 11) {
        ctx.fillRect(129, y, 22, 5.5);
        ctx.fillRect(269, y, 22, 5.5);
      }
      for (let x = 170; x < 250; x += 11) {
        ctx.fillRect(x, 129, 5.5, 22);
        ctx.fillRect(x, 269, 5.5, 22);
      }

      if (s.emergencyDirection) {
        const pulse = 0.2 + 0.1 * Math.sin(Date.now() / 160);
        ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
        if (s.emergencyDirection === "E" || s.emergencyDirection === "W") {
          ctx.fillRect(0, 166, W, 88);
        } else {
          ctx.fillRect(166, 0, 88, H);
        }
      }

      cars.forEach((car) => drawVectorVehicle(car, W, H));

      const drawLamp = (x: number, y: number, green: boolean) => {
        ctx.save();
        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 14;
        ctx.shadowColor = green ? "#10b981" : "#ef4444";
        ctx.fillStyle = green ? "#10b981" : "#ef4444";
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawLamp(152, 266, isDirGreen("E"));
      drawLamp(268, 154, isDirGreen("W"));
      drawLamp(268, 266, isDirGreen("N"));
      drawLamp(152, 154, isDirGreen("S"));

      peds.forEach((p) => drawVectorPedestrian(p));

      if (s.emergencyDirection) {
        ambX -= 2.9;
        if (ambX < -45) ambX = 455;
        drawVectorAmbulance(ambX, 192);
      }

      if (s.safeZoneActive) {
        const radius = 56 + Math.sin(Date.now() / 180) * 5;
        ctx.fillStyle = "rgba(236, 72, 153, 0.18)";
        ctx.strokeStyle = "#ec4899";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(140, 210, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = s.safeZoneActive
        ? "#be185d"
        : s.emergencyDirection
        ? "#047857"
        : s.isFallback
        ? "#b45309"
        : "rgba(15, 23, 42, 0.92)";
      ctx.fillRect(0, 0, W, 30);

      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(14, 15, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 11px monospace";
      const hudText = s.safeZoneActive
        ? "CHILD & WOMEN SAFE-ZONE • ALL TRAFFIC HALTED"
        : s.emergencyDirection
        ? `EMERGENCY CORRIDOR LOCKED (${s.emergencyDirection}-BOUND)`
        : s.isFallback
        ? "CONFIDENCE <70% • SAFE FIXED-TIMER FALLBACK"
        : `${s.fixedTimerMode ? "FIXED 22s" : "AI ADAPTIVE"} • ${
            isDirGreen("N") ? "N-S GREEN" : "E-W GREEN"
          } (${s.countdownSec}s)${s.seniorExtensionActive ? " • 25s WALK" : ""}`;
      ctx.fillText(hudText, 25, 19);

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl bg-slate-950 ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        className="w-full h-auto block"
        aria-label="Live animated Bengaluru junction traffic simulation"
      />
    </div>
  );
}