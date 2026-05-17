// BobAssistant.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BOB_SIZE = 300; // bigger (was 120)
const BOTTOM_OFFSET = 18; // px from viewport bottom
const WALK_SPEED = 1.4; // px per rAF frame
const PAUSE_MIN = 2000;
const PAUSE_MAX = 5500;
const WALK_MIN = 3500;
const WALK_MAX = 9000;
const SPEECH_MS = 4800;
const EDGE_MARGIN = 8; // near‑zero so Bob reaches true screen edges

const IDLE_QUIPS = [
  "All quiet. Watching the graph.",
  "Dependencies look stable.",
  "Nothing suspicious in the blast radius.",
  "I could scan another PR…",
  "Fan‑in looks clean from here.",
  "No circular deps detected.",
  "Test coverage could be better…",
  "Watching your back, dev. 👀",
];

const LOADING_COMMENTARY = [
  "Cloning repo… hold tight.",
  "Parsing dependency graph…",
  "Building the blast radius…",
  "Calculating risk signals…",
  "Asking the AI oracle…",
  "Almost there…",
];

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
@keyframes bob-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.75; transform: scale(1.07); }
}
@keyframes bob-spin {
  to { transform: rotate(360deg); }
}
@keyframes bob-speech-in {
  from { opacity: 0; transform: translateY(10px) scale(0.93); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes bob-walk-bounce {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-9px); }
}
@keyframes bob-intro-pop {
  0%   { opacity: 0; transform: translateY(20px) scale(0.85); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.03); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes bob-intro-bubble {
  0%   { opacity: 0; transform: translateX(-12px) scale(0.9); }
  50%  { opacity: 1; transform: translateX(4px) scale(1.02); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes bob-wave {
  0%, 100% { transform: rotate(0deg); }
  20%       { transform: rotate(-18deg); }
  40%       { transform: rotate(14deg); }
  60%       { transform: rotate(-10deg); }
  80%       { transform: rotate(6deg); }
}
`;

function useGlobalCss() {
  useEffect(() => {
    const id = "bob-global-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOB BEHAVIOR STATE MACHINE
// ─────────────────────────────────────────────────────────────────────────────

function useBobBehavior(data, isAnalyzing) {
  const [bobState, setBobState] = useState("intro");

  useEffect(() => {
    if (isAnalyzing) {
      setBobState("thinking");
      return;
    }
    if (!data) return;
    if (data.risk_level === "HIGH") {
      setBobState("nervous");
    } else if (data.risk_level === "MEDIUM") {
      setBobState("alert");
    } else {
      setBobState("idle");
    }
  }, [data, isAnalyzing]);

  return { bobState, setBobState };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTONOMOUS WALK SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

function useWalkSystem(bobState) {
  const [x, setX] = useState(EDGE_MARGIN);
  const [facing, setFacing] = useState(1); // 1=right, -1=left
  const [isWalking, setIsWalking] = useState(false);

  const xRef = useRef(EDGE_MARGIN);
  const facingRef = useRef(1);
  const walkRef = useRef(false);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    activeRef.current = bobState !== "intro";
    if (bobState === "intro") {
      walkRef.current = false;
      setIsWalking(false);
    }
  }, [bobState]);

  const scheduleNext = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!activeRef.current) {
      timerRef.current = setTimeout(scheduleNext, 500);
      return;
    }

    const willWalk = Math.random() > 0.32;

    if (willWalk) {
      const maxX = window.innerWidth - BOB_SIZE - EDGE_MARGIN;
      const atRight = xRef.current >= maxX - 10;
      const atLeft = xRef.current <= EDGE_MARGIN + 10;
      let dir;
      if (atRight) {
        dir = -1;
      } else if (atLeft) {
        dir = 1;
      } else {
        dir = Math.random() > 0.5 ? 1 : -1;
      }

      facingRef.current = dir;
      walkRef.current = true;
      setFacing(dir);
      setIsWalking(true);

      const dur = WALK_MIN + Math.random() * (WALK_MAX - WALK_MIN);
      timerRef.current = setTimeout(() => {
        walkRef.current = false;
        setIsWalking(false);
        scheduleNext();
      }, dur);
    } else {
      walkRef.current = false;
      setIsWalking(false);
      const dur = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
      timerRef.current = setTimeout(scheduleNext, dur);
    }
  }, []);

  useEffect(() => {
    const introDelay = setTimeout(scheduleNext, 3200);
    return () => {
      clearTimeout(introDelay);
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleNext]);

  const bobStateRef = useRef(bobState);
  useEffect(() => {
    bobStateRef.current = bobState;
  }, [bobState]);

  useEffect(() => {
    const loop = () => {
      if (walkRef.current && activeRef.current) {
        const state = bobStateRef.current;
        const speed =
          state === "nervous"
            ? WALK_SPEED * 2.5
            : state === "thinking"
              ? WALK_SPEED * 1.7
              : state === "alert"
                ? WALK_SPEED * 1.15
                : WALK_SPEED;

        const maxX = window.innerWidth - BOB_SIZE - EDGE_MARGIN;
        let nx = xRef.current + facingRef.current * speed;

        if (nx >= maxX) {
          nx = maxX;
          facingRef.current = -1;
          setFacing(-1);
        } else if (nx <= EDGE_MARGIN) {
          nx = EDGE_MARGIN;
          facingRef.current = 1;
          setFacing(1);
        }

        xRef.current = nx;
        setX(nx);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { x, facing, isWalking };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTRO BUBBLE
// ─────────────────────────────────────────────────────────────────────────────

function IntroBubble({ visible }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 14px)",
        left: 0,
        width: 260,
        background: "rgba(6, 10, 24, 0.97)",
        border: "1.5px solid rgba(96, 165, 250, 0.45)",
        borderRadius: "16px 16px 16px 4px",
        padding: "14px 18px",
        pointerEvents: "none",
        animation: "bob-intro-bubble 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards",
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(96,165,250,0.1), 0 0 24px rgba(96,165,250,0.15)",
        zIndex: 15,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(29, 78, 216, 0.25)",
          border: "1px solid rgba(96,165,250,0.3)",
          borderRadius: 20,
          padding: "2px 10px",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#60a5fa",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          IBM RepoGuard
        </span>
      </div>
      <p
        style={{
          margin: "0 0 4px 0",
          fontSize: 15,
          fontWeight: 700,
          color: "#f1f5f9",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          letterSpacing: "-0.01em",
        }}
      >
        👋 Hi! I'm Bob.
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.6,
          color: "rgba(148, 163, 184, 0.9)",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      >
        Your ambient engineering companion. I'll patrol your screen and keep an eye on the blast radius.
      </p>
      <div
        style={{
          position: "absolute",
          bottom: -8,
          left: 20,
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid rgba(6,10,24,0.97)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEECH BUBBLE
// ─────────────────────────────────────────────────────────────────────────────

function SpeechBubble({ message, facing }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (!message) return;
    setCurrent(message);
    setVisible(true);
    setFading(false);
    const fadeT = setTimeout(() => setFading(true), SPEECH_MS - 600);
    const doneT = setTimeout(() => {
      setVisible(false);
      setCurrent(null);
    }, SPEECH_MS);
    return () => {
      clearTimeout(fadeT);
      clearTimeout(doneT);
    };
  }, [message]);

  if (!visible || !current) return null;

  const isRight = facing >= 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 12px)",
        ...(isRight ? { left: 0 } : { right: 0 }),
        width: 240,
        background: "rgba(8, 12, 26, 0.96)",
        border: "1px solid rgba(96,165,250,0.22)",
        borderRadius: isRight ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
        padding: "11px 15px",
        pointerEvents: "none",
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        animation: "bob-speech-in 0.25s ease",
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(96,165,250,0.06)",
        zIndex: 10,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.55,
          color: "rgba(203, 213, 235, 0.92)",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        }}
      >
        {current}
      </p>
      <div
        style={{
          position: "absolute",
          bottom: -7,
          ...(isRight ? { left: 18 } : { right: 18 }),
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: "7px solid rgba(8,12,26,0.96)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOW RING
// ─────────────────────────────────────────────────────────────────────────────

function GlowRing({ bobState }) {
  const cfg =
    {
      intro: { color: "rgba(96,165,250,0.6)", pulse: true },
      nervous: { color: "rgba(239,68,68,0.55)", pulse: true },
      alert: { color: "rgba(251,191,36,0.45)", pulse: true },
      thinking: { color: "rgba(96,165,250,0.5)", pulse: true },
      idle: { color: "rgba(100,116,139,0.18)", pulse: false },
    }[bobState] ?? {
      color: "rgba(100,116,139,0.18)",
      pulse: false,
    };

  return (
    <div
      style={{
        position: "absolute",
        inset: -12,
        borderRadius: "50%",
        boxShadow: `0 0 34px 10px ${cfg.color}`,
        animation: cfg.pulse ? "bob-pulse 1.8s ease-in-out infinite" : "none",
        pointerEvents: "none",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THINKING SPINNER RING
// ─────────────────────────────────────────────────────────────────────────────

function ThinkingRing() {
  return (
    <div
      style={{
        position: "absolute",
        inset: -7,
        borderRadius: "50%",
        border: "2.5px solid transparent",
        borderTopColor: "rgba(96,165,250,0.9)",
        borderRightColor: "rgba(96,165,250,0.2)",
        animation: "bob-spin 0.85s linear infinite",
        pointerEvents: "none",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D MODEL (fixed: now faces camera at load, not side‑profile)
// ─────────────────────────────────────────────────────────────────────────────

function BobModel({ bobState, isWalking, facing }) {
  const groupRef = useRef();
  const initialized = useRef(false);
  const { scene } = useGLTF("/bob.glb");
  const tRef = useRef(0);
  const shakeT = useRef(0);

  // 1) On first mount, set correct front‑facing rotation
  useEffect(() => {
    if (!groupRef.current || initialized.current) return;

    // 0 = front‑facing, π = back‑facing
    let targetRotY = facing < 0 ? Math.PI : 0;

    // 2) If Bob loads in side‑profile, add a fixed correction
    //    Right cheek visible → facing too far to right → add π/2
    //    Left cheek visible → facing too far to left → add -π/2
    targetRotY += Math.PI / 2; // ← adjust this once only

    groupRef.current.rotation.y = targetRotY;
    initialized.current = true;
  }, [facing]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    tRef.current += delta;
    const t = tRef.current;

    // Breathing scale
    const breathRate = bobState === "nervous" ? 4.5 : 1.3;
    const breathAmp = bobState === "nervous" ? 0.032 : 0.016;
    groupRef.current.scale.setScalar(1 + Math.sin(t * breathRate) * breathAmp);

    // Smoothly adjust facing based on props
    let targetRotY = facing < 0 ? Math.PI : 0;
    targetRotY += Math.PI / 2; // apply same correction as initialization
    groupRef.current.rotation.y +=
      (targetRotY - groupRef.current.rotation.y) * 0.1;

    // Intro animation
    if (bobState === "intro") {
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.06;
      groupRef.current.rotation.z = Math.sin(t * 2.2) * 0.04;
      return;
    }

    // Vertical bounce while walking
    if (isWalking) {
      const freq = bobState === "nervous" ? 9 : bobState === "thinking" ? 5.5 : 3.5;
      groupRef.current.position.y = Math.abs(Math.sin(t * freq)) * 0.22;
    } else {
      groupRef.current.position.y = Math.sin(t * 1.1) * 0.07;
    }

    // Nervous shake
    if (bobState === "nervous") {
      shakeT.current += delta * 18;
      groupRef.current.position.x = Math.sin(shakeT.current) * 0.1;
    } else {
      groupRef.current.position.x += (0 - groupRef.current.position.x) * 0.1;
    }

    // Body tilt during walk
    if (isWalking) {
      const tiltFreq = bobState === "nervous" ? 8 : 3.2;
      groupRef.current.rotation.z =
        Math.sin(t * tiltFreq) * 0.055 * (facing < 0 ? -1 : 1);
    } else {
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={2.2} position={[0, -1.1, 0]} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI STATS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function MiniStats({ data, visible, facing }) {
  const riskColor =
    { HIGH: "#f87171", MEDIUM: "#fbbf24", LOW: "#4ade80" }[data?.risk_level] ?? "#94a3b8";
  const isRight = facing >= 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        ...(isRight ? { left: 0 } : { right: 0 }),
        width: 220,
        background: "rgba(8, 12, 26, 0.95)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "14px 16px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "rgba(100,116,139,0.8)",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          risk score
        </span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: riskColor,
            fontFamily: "monospace",
          }}
        >
          {data?.risk_score ?? "—"}
          <span
            style={{
              fontSize: 11,
              color: "rgba(100,116,139,0.5)",
              fontWeight: 400,
            }}
          >
            /100
          </span>
        </span>
      </div>
      <div
        style={{
          height: "0.5px",
          background: "rgba(255,255,255,0.06)",
          margin: "8px 0",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <MiniRow
          label="blast radius"
          value={`${data?.blast_radius_size ?? "?"} files`}
        />
        <MiniRow
          label="level"
          value={data?.risk_level ?? "?"}
          color={riskColor}
        />
        <MiniRow
          label="test cover"
          value={`${Math.round((data?.test_coverage_ratio ?? 0) * 100)}%`}
          color={(data?.test_coverage_ratio ?? 0) < 0.2 ? "#f87171" : "#4ade80"}
        />
        {data?.high_coupling_detected && (
          <MiniRow label="coupling" value="HIGH ⚠" color="#fbbf24" />
        )}
      </div>
      {data?.ai_narrative && (
        <p
          style={{
            marginTop: 10,
            fontSize: 10,
            color: "rgba(148,163,184,0.6)",
            lineHeight: 1.5,
            fontStyle: "italic",
            fontFamily: "monospace",
          }}
        >
          {data.ai_narrative.split(".")[0].slice(0, 72)}…
        </p>
      )}
    </div>
  );
}

function MiniRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span
        style={{
          fontSize: 9.5,
          color: "rgba(100,116,139,0.8)",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10.5,
          color: color ?? "rgba(203,213,225,0.85)",
          fontFamily: "monospace",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK BADGE
// ─────────────────────────────────────────────────────────────────────────────

function RiskBadge({ riskLevel, score }) {
  const s =
    {
      HIGH: {
        bg: "rgba(127,29,29,0.9)",
        border: "rgba(239,68,68,0.5)",
        text: "#fca5a5",
      },
      MEDIUM: {
        bg: "rgba(120,53,15,0.9)",
        border: "rgba(250,204,21,0.5)",
        text: "#fde68a",
      },
      LOW: {
        bg: "rgba(6,78,59,0.9)",
        border: "rgba(74,222,128,0.5)",
        text: "#86efac",
      },
    }[riskLevel] ?? {
      bg: "rgba(30,41,59,0.9)",
      border: "rgba(148,163,184,0.3)",
      text: "#94a3b8",
    };

  return (
    <div
      style={{
        position: "absolute",
        top: -16,
        left: "50%",
        transform: "translateX(-50%)",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 10,
        fontFamily: "monospace",
        fontWeight: 700,
        color: s.text,
        letterSpacing: "0.07em",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {score} · {riskLevel}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ isAnalyzing, facing }) {
  const [pct, setPct] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setPct(0);
      setStageIdx(0);
      return;
    }
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 3.5 + 0.4;
      if (p >= 97) p = 97;
      setPct(p);
      setStageIdx(
        Math.min(
          Math.floor((p / 100) * LOADING_COMMENTARY.length),
          LOADING_COMMENTARY.length - 1
        )
      );
    }, 320);
    return () => clearInterval(iv);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;
  const isRight = facing >= 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        ...(isRight ? { left: 0 } : { right: 0 }),
        width: 210,
        background: "rgba(8,12,26,0.94)",
        border: "1px solid rgba(96,165,250,0.2)",
        borderRadius: 12,
        padding: "12px 14px",
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: "rgba(148,163,184,0.8)",
          }}
        >
          {LOADING_COMMENTARY[stageIdx]}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: "rgba(96,165,250,0.9)",
            fontWeight: 600,
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div
        style={{
          height: 3,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
            borderRadius: 99,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function BobAssistant({ data, isAnalyzing = false }) {
  useGlobalCss();

  const { bobState, setBobState } = useBobBehavior(data, isAnalyzing);
  const { x, facing, isWalking } = useWalkSystem(bobState);

  const [hovered, setHovered] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [speech, setSpeech] = useState(null);
  const [quipIdx, setQuipIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const speechKey = useRef(0);

  // Intro: show bubble ~4.2s then switch to idle
  useEffect(() => {
    const hideIntro = setTimeout(() => {
      setShowIntro(false);
      setBobState("idle");
    }, 4200);
    return () => clearTimeout(hideIntro);
  }, []);

  // Data arrives → reactive speech
  useEffect(() => {
    if (!data) return;
    const msg =
      data.risk_level === "HIGH"
        ? `⚠ Blast radius: ${data.blast_radius_size} files. Risk score ${data.risk_score}.`
        : data.risk_level === "MEDIUM"
          ? `${data.blast_radius_size} files in blast radius. Worth a look.`
          : `Looks structurally sound. ${data.blast_radius_size} files affected.`;
    setTimeout(() => {
      speechKey.current += 1;
      setSpeech(msg);
    }, 500);
  }, [data]);

  // Analysis starts → speech
  useEffect(() => {
    if (!isAnalyzing) return;
    speechKey.current += 1;
    setSpeech("Scanning the dependency graph…");
  }, [isAnalyzing]);

  // Click → cycle quips / data facts
  const handleClick = useCallback(() => {
    if (!data) {
      speechKey.current += 1;
      setSpeech(IDLE_QUIPS[quipIdx % IDLE_QUIPS.length]);
      setQuipIdx(i => i + 1);
      return;
    }
    const responses = [
      data.ai_narrative
        ? data.ai_narrative.split(".")[0] + "."
        : `Risk score: ${data.risk_score}/100.`,
      `${data.blast_radius_size} files transitively affected.`,
      `Fan‑in criticality: ${data.risk_signals?.fan_in_criticality ?? 0}/30.`,
      data.high_coupling_detected
        ? "High coupling detected in changed modules."
        : "Coupling looks acceptable.",
      `Test coverage: ${Math.round((data.test_coverage_ratio ?? 0) * 100)}%.`,
    ];
    speechKey.current += 1;
    setSpeech(responses[quipIdx % responses.length]);
    setQuipIdx(i => i + 1);
  }, [data, quipIdx]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if (data) setStatsVisible(true);
  }, [data]);
  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setStatsVisible(false);
  }, []);

  const yPos = window.innerHeight - BOB_SIZE - BOTTOM_OFFSET;
  const walkAnim = isWalking
    ? `bob-walk-bounce ${bobState === "nervous" ? "0.17s" : "0.34s"} ease-in-out infinite`
    : "none";
  const introAnim = bobState === "intro"
    ? "bob-intro-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards"
    : "none";

  const lightColor =
    bobState === "nervous"
      ? "#ff4444"
      : bobState === "thinking"
        ? "#4488ff"
        : bobState === "alert"
          ? "#ffcc44"
          : "#ffffff";

  const lightIntensity =
    bobState === "nervous"
      ? 2.4
      : bobState === "thinking"
        ? 1.6
        : bobState === "alert"
          ? 1.2
          : 0.8;

  return (
    <div
      style={{
        position: "fixed",
        left: bobState === "intro" ? EDGE_MARGIN : x,
        top: yPos,
        width: BOB_SIZE,
        height: BOB_SIZE,
        zIndex: 9999,
        userSelect: "none",
        animation: bobState === "intro" ? introAnim : walkAnim,
      }}
    >
      {showIntro && <IntroBubble visible={showIntro} />}
      {!showIntro && (
        <SpeechBubble key={speechKey.current} message={speech} facing={facing} />
      )}
      <ProgressBar isAnalyzing={isAnalyzing} facing={facing} />
      {data && <MiniStats data={data} visible={statsVisible} facing={facing} />}

      <div
        style={{
          position: "relative",
          width: BOB_SIZE,
          height: BOB_SIZE,
          cursor: "pointer",
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <GlowRing bobState={bobState} />
        {data && <RiskBadge riskLevel={data.risk_level} score={data.risk_score} />}
        {bobState === "thinking" && <ThinkingRing />}

        <div
          style={{
            width: BOB_SIZE,
            height: BOB_SIZE,
            borderRadius: "50%",
            overflow: "hidden",
            background: "rgba(6, 9, 20, 0.75)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            boxShadow: "0 8px 36px rgba(0,0,0,0.6)",
            transition: "transform 0.15s ease",
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
        >
          <Canvas
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 0.5, 7], fov: 42 }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={1.6} />
            <directionalLight position={[3, 5, 3]} intensity={1.8} />
            <pointLight
              position={[-2, 2, 4]}
              intensity={lightIntensity}
              color={lightColor}
            />
            <BobModel bobState={bobState} isWalking={isWalking} facing={facing} />
          </Canvas>
        </div>

        {hovered && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 9.5,
              color: "rgba(100,116,139,0.65)",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              animation: "bob-speech-in 0.2s ease",
            }}
          >
            click to ask
          </div>
        )}
      </div>
    </div>
  );
}

useGLTF.preload("/bob.glb");

export default BobAssistant;