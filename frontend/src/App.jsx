import { useState } from "react";
import axios from "axios";
import BlastRadiusGraph from "./components/BlastRadiusGraph";

function App() {

  const [data, setData] = useState(null);

  const analyzeRepo = async () => {

    try {

      const response = await axios.post(
        "http://127.0.0.1:8001/analyze"
      );

      setData(response.data);

    } catch (error) {

      console.error(error);

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

        {/* ANALYZE BUTTON */}

        <button
          onClick={analyzeRepo}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
        >
          Analyze Repository
        </button>

        {/* RESULTS SECTION */}

        {data && (

          <>

            {/* TOP DASHBOARD CARDS */}

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* RISK OVERVIEW CARD */}

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

              </div>

              {/* IMPACTED FILES CARD */}

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

            {/* BLAST RADIUS GRAPH */}

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