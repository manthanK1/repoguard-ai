import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

function BlastRadiusGraph({ changedFiles = [], blastRadius = [], graphEdges = {} }) {
  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    const seen = new Set();

    const CENTER_X = 400;
    const CENTER_Y = 300;
    const RING1_RADIUS = 180;
    const RING2_RADIUS = 340;

    // Separate into 1-hop and 2-hop — cap both rings
    const directDeps = new Set();
    changedFiles.forEach((f) => {
      (graphEdges[f] || []).forEach((d) => directDeps.add(d));
    });

    const ring1 = blastRadius.filter((f) => directDeps.has(f)).slice(0, 12);
    const ring2 = blastRadius.filter((f) => !directDeps.has(f)).slice(0, 18);

    // Show only the final filename, strip extension, strip Windows backslashes
    const makeLabel = (path) => {
      const normalized = path.replace(/\\/g, "/");
      const filename = normalized.split("/").pop();
      return filename.replace(/\.(py|js|jsx|ts|tsx)$/, "");
    };

    const nodeStyle = (color, size = "normal") => ({
      background: color,
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: size === "center" ? "8px 14px" : "5px 9px",
      fontSize: size === "center" ? "12px" : "9px",
      fontFamily: "monospace",
      maxWidth: size === "center" ? "140px" : "110px",
      textAlign: "center",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
    });

    // Center — changed files
    changedFiles.forEach((f, i) => {
      if (seen.has(f)) return;
      seen.add(f);
      nodes.push({
        id: f,
        data: { label: makeLabel(f) },
        position: {
          x: CENTER_X,
          y: CENTER_Y + i * 70 - ((changedFiles.length - 1) * 35),
        },
        style: nodeStyle("#dc2626", "center"),
      });
    });

    // Ring 1 — direct dependents
    ring1.forEach((f, i) => {
      if (seen.has(f)) return;
      seen.add(f);
      const angle = (2 * Math.PI * i) / ring1.length - Math.PI / 2;
      nodes.push({
        id: f,
        data: { label: makeLabel(f) },
        position: {
          x: CENTER_X + RING1_RADIUS * Math.cos(angle) - 55,
          y: CENTER_Y + RING1_RADIUS * Math.sin(angle) - 15,
        },
        style: nodeStyle("#ea580c"),
      });
    });

    // Ring 2 — indirect dependents
    ring2.forEach((f, i) => {
      if (seen.has(f)) return;
      seen.add(f);
      const angle = (2 * Math.PI * i) / ring2.length - Math.PI / 2;
      nodes.push({
        id: f,
        data: { label: makeLabel(f) },
        position: {
          x: CENTER_X + RING2_RADIUS * Math.cos(angle) - 55,
          y: CENTER_Y + RING2_RADIUS * Math.sin(angle) - 15,
        },
        style: nodeStyle("#ca8a04"),
      });
    });

    // Spoke edges: center → ring1 (animated)
    changedFiles.forEach((cf) => {
      ring1.forEach((r1) => {
        edges.push({
          id: `spoke-${cf}-${r1}`,
          source: cf,
          target: r1,
          style: { stroke: "#ef4444", strokeWidth: 1, opacity: 0.6 },
          animated: true,
        });
      });
    });

    // Ring1 → Ring2 edges (static, subtle)
    ring1.forEach((r1) => {
      ring2.forEach((r2, i) => {
        if (i < 2) { // only draw 2 edges per ring1 node to avoid clutter
          edges.push({
            id: `r1r2-${r1}-${r2}`,
            source: r1,
            target: r2,
            style: { stroke: "#334155", strokeWidth: 0.8, opacity: 0.4 },
            animated: false,
          });
        }
      });
    });

    return { nodes, edges };
  }, [changedFiles, blastRadius, graphEdges]);

  if (nodes.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No dependency data to visualize.
      </div>
    );
  }

  // Count totals for the subtitle
  const totalAffected = blastRadius.length;
  const shown = Math.min(blastRadius.length, 30);

  return (
    <div>
      {totalAffected > 30 && (
        <p className="text-xs text-slate-500 mb-3 font-mono">
          Showing {shown} of {totalAffected} affected files — top by dependency depth
        </p>
      )}
      <div style={{ height: "520px", background: "#0f172a", borderRadius: "12px" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={true}
          nodesConnectable={false}
          minZoom={0.3}
          maxZoom={2.5}
        >
          <Background color="#1e293b" gap={20} />
          <Controls style={{ background: "#1e293b", border: "1px solid #334155" }} />
          <MiniMap
            nodeColor={(n) => n.style?.background || "#888"}
            style={{ background: "#0f172a", border: "1px solid #334155" }}
            maskColor="rgba(0,0,0,0.55)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default BlastRadiusGraph;