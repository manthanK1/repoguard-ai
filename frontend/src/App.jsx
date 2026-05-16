import { useState } from "react";
import axios from "axios";
import BlastRadiusGraph from "./components/BlastRadiusGraph";

function App() {

  const [data, setData] = useState(null);

  const [repoUrl, setRepoUrl] = useState("");
  const [prDiff, setPrDiff] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const analyzeRepo = async () => {

    try {

      setLoading(true);

      setLoadingMessage("Cloning repository...");

      setTimeout(() => {
        setLoadingMessage("Analyzing repository structure...");
      }, 1500);

      setTimeout(() => {
        setLoadingMessage("Calculating risk graph...");
      }, 3000);

      setTimeout(() => {
        setLoadingMessage("Generating impact analysis...");
      }, 4500);

      const response = await axios.post(
        "http://127.0.0.1:8001/analyze",
        {
          repo_url: repoUrl,
          pr_diff: prDiff
        }
      );

      setData(response.data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

      setLoadingMessage("");

    }

  };

  return (

    <div className="min-h-screen bg-slate-950 text-white p-10">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}

        <h1 className="text-5xl font-bold mb-4">
          RepoGuard AI
        </h1>

        <p className="text-slate-400 mb-10 text-lg">
          AI-Powered Change Risk Intelligence Platform
        </p>

        {/* INPUT SECTION */}

        <div className="space-y-6 mb-8">

          {/* REPO URL */}

          <div>

            <label className="block mb-2 text-slate-300 font-medium">
              GitHub Repository URL
            </label>

            <input
              type="text"
              placeholder="https://github.com/example/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />

          </div>

          {/* PR DIFF */}

          <div>

            <label className="block mb-2 text-slate-300 font-medium">
              Pull Request Diff / Code Change
            </label>

            <textarea
              rows="6"
              placeholder="Paste PR diff or describe code changes..."
              value={prDiff}
              onChange={(e) => setPrDiff(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />

          </div>

        </div>

        {/* ANALYZE BUTTON */}

        <button
          onClick={analyzeRepo}
          disabled={loading}
          className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
            loading
              ? "bg-slate-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >

          {loading
            ? loadingMessage
            : "Analyze Repository"}

        </button>

        {/* LOADING BAR */}

        {loading && (

          <div className="mt-6 w-full bg-slate-800 rounded-full h-3 overflow-hidden">

            <div
              className="bg-blue-500 h-3 animate-pulse"
              style={{
                width: "100%"
              }}
            />

          </div>

        )}

        {/* RESULTS */}

        {data && (

          <>

            {/* TOP DASHBOARD */}

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* RISK CARD */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">

                <h2 className="text-2xl font-semibold mb-4">
                  Risk Overview
                </h2>

                <div className="text-6xl font-bold text-red-500">
                  {data.risk_score}
                </div>

                <p className="mt-4 text-red-400 font-semibold text-lg">
                  {data.risk_level} RISK
                </p>

                <p className="mt-6 text-slate-300 leading-relaxed">
                  {data.summary}
                </p>

                <div className="mt-6 text-slate-400">
                  Total Repository Files: {data.total_files}
                </div>

                {/* LANGUAGES */}

                <div className="mt-6">

                  <h3 className="text-lg font-semibold mb-3">
                    Detected Languages
                  </h3>

                  <div className="space-y-2">

                    {Object.entries(data.languages).map(([lang, count]) => (

                      <div
                        key={lang}
                        className="flex justify-between bg-slate-800 px-4 py-2 rounded-lg"
                      >
                        <span>{lang}</span>
                        <span>{count} files</span>
                      </div>

                    ))}

                  </div>

                </div>

              </div>

              {/* IMPACTED FILES */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">

                <h2 className="text-2xl font-semibold mb-4">
                  Impacted Files
                </h2>

                <ul className="space-y-3">

                  {data.impacted_files.map((file, index) => (

                    <li
                      key={index}
                      className="bg-slate-800 px-4 py-3 rounded-lg border border-slate-700"
                    >
                      {file}
                    </li>

                  ))}

                </ul>

              </div>

            </div>

            {/* GRAPH SECTION */}

            <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">

              <h2 className="text-2xl font-semibold mb-6">
                Blast Radius Visualization
              </h2>

              <BlastRadiusGraph />

            </div>

          </>

        )}

      </div>

    </div>

  );

}

export default App;