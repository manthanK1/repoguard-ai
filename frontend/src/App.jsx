import { useEffect, useState } from "react";
import axios from "axios";

import BlastRadiusGraph from "./components/BlastRadiusGraph";
import BobAssistant from "./components/BobAssistant";

function App() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [prDiff, setPrDiff] = useState("");

  const LOADING_STEPS = [
    "Cloning repository...",
    "Analyzing repository structure...",
    "Building dependency graph...",
    "Calculating blast radius...",
    "Scoring risk signals...",
    "Generating AI risk narrative...",
  ];

  const analyzeRepo = async () => {
    setLoading(true);
    setError("");
    setData(null);
    setLoadingMessage(LOADING_STEPS[0]);

    const timers = LOADING_STEPS.map((msg, i) => {
      if (i === 0) return null;
      return setTimeout(() => setLoadingMessage(msg), i * 1800);
    });

    try {
      const response = await axios.post(
        "http://127.0.0.1:8001/analyze",
        { repo_url: repoUrl, pr_diff: prDiff }
      );
      setData(response.data);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Failed to analyze repository. Check the URL or backend server.";
      setError(msg);
    } finally {
      timers.forEach((t) => t && clearTimeout(t));
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const riskColor =
    data?.risk_level === "HIGH"   ? "text-red-500"
    : data?.risk_level === "MEDIUM" ? "text-yellow-400"
    : "text-green-400";

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 80);
          }
        });
      },
      { threshold: 0.1 }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [data]);

  const SIGNAL_CONFIG = [
    { key: "fan_in_criticality",    label: "Fan-in Criticality",     max: 30, desc: "How many modules import the changed files" },
    { key: "blast_radius_score",    label: "Blast Radius Magnitude",  max: 25, desc: "Number of transitively affected files" },
    { key: "test_coverage_penalty", label: "Test Coverage Gap",       max: 25, desc: "Risk from low test coverage ratio" },
    { key: "change_surface",        label: "Change Surface Area",     max: 20, desc: "Lines changed in this diff" },
  ];

  const shortName = (path) =>
    path?.replace(/\\/g, "/").split("/").pop() ?? path;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white p-8">
      <div className="rg-orb-blue" />
      <div className="rg-orb-purple" />
      <div className="relative max-w-7xl mx-auto z-10">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="rg-eyebrow">
            <span className="rg-eyebrow-dot" />
            Change Risk Intelligence
          </div>
          <h1 className="text-6xl font-bold mb-4 rg-title-gradient">RepoGuard AI</h1>
          <p className="text-slate-400 text-xl">
            Static Analysis · Dependency Intelligence · Risk Scoring
          </p>
          {data && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-slate-500 text-sm rg-mono">Analyzing</span>
              <span className="text-blue-400 rg-mono text-sm bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
                {repoUrl.replace("https://github.com/", "")}
              </span>
            </div>
          )}
        </div>

        {/* ── INPUT SECTION ───────────────────────────────────────────────── */}
        <div className="rg-card rg-card-lined mb-8 reveal">
          <div className="space-y-6">

            <div>
              <label className="rg-label text-lg font-medium text-slate-300">
                GitHub Repository URL
              </label>
              <input
                type="text"
                placeholder="https://github.com/tiangolo/fastapi"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="rg-input"
              />
            </div>

            <div>
              <label className="rg-label text-lg font-medium text-slate-300">
                Pull Request Diff
                <span className="text-slate-500 text-sm ml-2 font-normal">
                  (paste unified diff for precise file detection)
                </span>
              </label>
              <textarea
                rows="8"
                placeholder={`--- a/app/services/auth.py\n+++ b/app/services/auth.py\n@@ -1,5 +1,6 @@`}
                value={prDiff}
                onChange={(e) => setPrDiff(e.target.value)}
                className="rg-input rg-input-mono"
              />
            </div>

            {error && (
              <div className="rg-error">
                <span className="font-semibold">Error: </span>{error}
              </div>
            )}

            <button
              onClick={analyzeRepo}
              disabled={loading || !repoUrl}
              className="rg-btn-primary"
            >
              {loading ? loadingMessage : "Analyze Repository"}
            </button>

          </div>
        </div>

        {/* ── LOADING BAR ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="rg-progress mb-8">
            <div className="rg-progress-fill" />
          </div>
        )}

        {/* ── RESULTS ─────────────────────────────────────────────────────── */}
        {data && (
          <div className="space-y-6">

            {/* ROW 1: Risk Overview + Signal Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* RISK OVERVIEW */}
              <div className={`rg-risk-card ${data.risk_level === "HIGH" ? "high" : data.risk_level === "MEDIUM" ? "medium" : "low"} reveal`}>
                <h2 className="text-2xl font-semibold mb-6 text-slate-200">Risk Overview</h2>

                <div className={`rg-risk-ring ${data.risk_level === "HIGH" ? "rg-risk-high" : data.risk_level === "MEDIUM" ? "rg-risk-medium" : "rg-risk-low"}`}>
                  {data.risk_score}
                </div>
                <div className={`text-xl font-bold mb-6 ${riskColor}`}>
                  {data.risk_level} RISK
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {data.summary}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="rg-stat-box">
                    <div className="rg-stat-number">{data.total_files}</div>
                    <div className="rg-stat-label">total files</div>
                  </div>
                  <div className="rg-stat-box">
                    <div className="rg-stat-number">{data.blast_radius_size}</div>
                    <div className="rg-stat-label">blast radius</div>
                  </div>
                  <div className="rg-stat-box">
                    <div className="rg-stat-number">
                      {Math.round((data.test_coverage_ratio ?? 0) * 100)}%
                    </div>
                    <div className="rg-stat-label">test coverage</div>
                  </div>
                </div>

                {data.high_coupling_detected && (
                  <div className="rg-coupling-badge">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    <span>HIGH COUPLING DETECTED</span>
                  </div>
                )}
              </div>

              {/* SIGNAL BREAKDOWN */}
              <div className="rg-card reveal">
                <h2 className="text-2xl font-semibold mb-6 text-slate-200">Risk Signal Breakdown</h2>
                <div className="space-y-5">
                  {SIGNAL_CONFIG.map(({ key, label, max, desc }) => {
                    const val = data.risk_signals?.[key] ?? 0;
                    const pct = Math.round((val / max) * 100);
                    const barColor =
                      pct >= 75 ? "bg-red-500"
                      : pct >= 45 ? "bg-yellow-400"
                      : "bg-green-500";
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">{label}</span>
                          <span className="text-slate-400 rg-mono">{val}/{max}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className={`${barColor} h-2 rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ROW 2: Changed Files + Blast Radius Files */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* CHANGED FILES */}
              <div className="rg-card reveal">
                <h2 className="text-2xl font-semibold mb-4 text-slate-200">
                  Changed Files
                  <span className="text-slate-500 text-sm font-normal ml-2">(from diff)</span>
                </h2>
                {data.changed_files?.length > 0 ? (
                  <div className="space-y-2">
                    {data.changed_files.map((file, i) => (
                      <div
                        key={i}
                        className="rg-file-changed"
                      >
                        <div className="text-red-300 font-mono text-sm font-semibold">
                          {shortName(file)}
                        </div>
                        <div className="text-red-900 font-mono text-xs mt-0.5">
                          {file.replace(/\\/g, "/")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">
                    No unified diff detected — using highest fan-in file as change origin.
                  </p>
                )}
              </div>

              {/* BLAST RADIUS FILES */}
              <div className="rg-card reveal">
                <h2 className="text-2xl font-semibold mb-4 text-slate-200">
                  Blast Radius Files
                  <span className="text-slate-500 text-sm font-normal ml-2">(2-hop walk)</span>
                </h2>
                {data.impacted_files?.length > 0 ? (
                  <>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {data.impacted_files.map((file, i) => (
                        <div
                          key={i}
                          className="rg-file-blast"
                        >
                          {shortName(file)}
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-600 text-xs mt-3 font-mono">
                      {data.impacted_files.length} total files in blast radius
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">
                    No dependent files found — this module has low coupling.
                  </p>
                )}
              </div>
            </div>

            {/* ROW 3: Languages */}
            <div className="rg-card reveal">
              <h2 className="text-2xl font-semibold mb-4 text-slate-200">Detected Languages</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.languages || {}).map(([lang, count]) => (
                  <div
                    key={lang}
                    className="rg-lang-chip"
                  >
                    <span className="font-medium text-white">{lang}</span>
                    <span className="text-slate-400 ml-2">{count} files</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 4: AI Narrative */}
            {data.ai_narrative && (
              <div className="rg-ai-panel reveal">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <h2 className="text-lg font-semibold text-slate-200">AI Risk Assessment</h2>
                  <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded">
                    IBM watsonx · Granite 13B
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-sm">{data.ai_narrative}</p>
              </div>
            )}

            {/* ROW 5: How Risk Was Calculated */}
            <div className="rg-card reveal">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                How Risk Was Calculated
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
                {[
                  { label: "Analysis Method",  value: "4-signal structural scoring" },
                  { label: "Import Graph",      value: "Python AST · JS/TS regex" },
                  { label: "Blast Radius",      value: "2-hop dependency traversal" },
                  { label: "Changed Files",     value: 'Unified diff "+++ b/" parsing' },
                  { label: "Fan-in Score",      value: "Inbound import count per module" },
                  { label: "AI Layer",          value: "Interprets structural output — does not generate it" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rg-meta-cell"
                  >
                    <span className="rg-meta-key">{label}</span>
                    <span className="rg-meta-val">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 6: Blast Radius Graph */}
            <div className="rg-card reveal">
              <h2 className="text-2xl font-semibold mb-2 text-slate-200">
                Blast Radius Visualization
              </h2>
              <div className="flex gap-6 text-xs text-slate-500 mb-5 flex-wrap">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  Changed file
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                  Direct dependents (1-hop)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                  Indirect dependents (2-hop)
                </span>
                {data.blast_radius_size > 30 && (
                  <span className="text-slate-600">
                    · Showing top 30 of {data.blast_radius_size} affected files
                  </span>
                )}
              </div>
              <BlastRadiusGraph
                changedFiles={data.changed_files}
                blastRadius={data.impacted_files}
                graphEdges={data.graph_edges}
              />
            </div>

          </div>
        )}

      </div>

      {/*
        ── BOB ASSISTANT ──────────────────────────────────────────────────────
        Always mounted. Wanders along the bottom of the screen.
        data     → null (idle wandering) or analysis result (reactive states)
        isAnalyzing → true while the API call is in flight (thinking state)
      */}
      <BobAssistant data={data} isAnalyzing={loading} />

    </div>
  );
}

export default App;