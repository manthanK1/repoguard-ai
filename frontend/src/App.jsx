import { useState } from "react";
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

  const riskBorder =
    data?.risk_level === "HIGH"   ? "border-red-900/50"
    : data?.risk_level === "MEDIUM" ? "border-yellow-900/50"
    : "border-green-900/50";

  const SIGNAL_CONFIG = [
    { key: "fan_in_criticality",    label: "Fan-in Criticality",     max: 30, desc: "How many modules import the changed files" },
    { key: "blast_radius_score",    label: "Blast Radius Magnitude",  max: 25, desc: "Number of transitively affected files" },
    { key: "test_coverage_penalty", label: "Test Coverage Gap",       max: 25, desc: "Risk from low test coverage ratio" },
    { key: "change_surface",        label: "Change Surface Area",     max: 20, desc: "Lines changed in this diff" },
  ];

  const shortName = (path) =>
    path?.replace(/\\/g, "/").split("/").pop() ?? path;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-6xl font-bold mb-4">RepoGuard AI</h1>
          <p className="text-slate-400 text-xl">
            Static Analysis · Dependency Intelligence · Risk Scoring
          </p>
          {data && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-slate-500 text-sm font-mono">Analyzing</span>
              <span className="text-blue-400 font-mono text-sm bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
                {repoUrl.replace("https://github.com/", "")}
              </span>
            </div>
          )}
        </div>

        {/* ── INPUT SECTION ───────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="space-y-6">

            <div>
              <label className="block mb-3 text-lg font-medium text-slate-300">
                GitHub Repository URL
              </label>
              <input
                type="text"
                placeholder="https://github.com/tiangolo/fastapi"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block mb-3 text-lg font-medium text-slate-300">
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-mono text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl px-4 py-3">
                <span className="font-semibold">Error: </span>{error}
              </div>
            )}

            <button
              onClick={analyzeRepo}
              disabled={loading || !repoUrl}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                loading || !repoUrl
                  ? "bg-slate-700 cursor-not-allowed text-slate-400"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {loading ? loadingMessage : "Analyze Repository"}
            </button>

          </div>
        </div>

        {/* ── LOADING BAR ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-8">
            <div className="bg-blue-500 h-2 animate-pulse w-full rounded-full" />
          </div>
        )}

        {/* ── RESULTS ─────────────────────────────────────────────────────── */}
        {data && (
          <div className="space-y-6">

            {/* ROW 1: Risk Overview + Signal Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* RISK OVERVIEW */}
              <div className={`bg-slate-900 border ${riskBorder} rounded-2xl p-8`}>
                <h2 className="text-2xl font-semibold mb-6 text-slate-200">Risk Overview</h2>

                <div className={`text-7xl font-bold mb-2 ${riskColor}`}>
                  {data.risk_score}
                </div>
                <div className={`text-xl font-bold mb-6 ${riskColor}`}>
                  {data.risk_level} RISK
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {data.summary}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold">{data.total_files}</div>
                    <div className="text-slate-400 text-xs mt-1">total files</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold">{data.blast_radius_size}</div>
                    <div className="text-slate-400 text-xs mt-1">blast radius</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold">
                      {Math.round((data.test_coverage_ratio ?? 0) * 100)}%
                    </div>
                    <div className="text-slate-400 text-xs mt-1">test coverage</div>
                  </div>
                </div>

                {data.high_coupling_detected && (
                  <div className="inline-flex items-center gap-2 bg-red-950/60 border border-red-700 rounded-lg px-4 py-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    <span className="text-red-400 text-sm font-semibold tracking-wide">
                      HIGH COUPLING DETECTED
                    </span>
                  </div>
                )}
              </div>

              {/* SIGNAL BREAKDOWN */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
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
                          <span className="text-slate-400 font-mono">{val}/{max}</span>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold mb-4 text-slate-200">
                  Changed Files
                  <span className="text-slate-500 text-sm font-normal ml-2">(from diff)</span>
                </h2>
                {data.changed_files?.length > 0 ? (
                  <div className="space-y-2">
                    {data.changed_files.map((file, i) => (
                      <div
                        key={i}
                        className="bg-red-500/10 border border-red-800/40 px-4 py-3 rounded-xl"
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
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
                          className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl font-mono text-sm"
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-200">Detected Languages</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.languages || {}).map(([lang, count]) => (
                  <div
                    key={lang}
                    className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-sm"
                  >
                    <span className="font-medium text-white">{lang}</span>
                    <span className="text-slate-400 ml-2">{count} files</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 4: AI Narrative */}
            {data.ai_narrative && (
              <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-8">
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
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
                    className="flex flex-col bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3"
                  >
                    <span className="text-slate-500 text-xs mb-1">{label}</span>
                    <span className="text-slate-300 text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 6: Blast Radius Graph */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
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