import React from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";

const nodes = [
  {
    id: "1",
    position: { x: 250, y: 0 },
    data: { label: "auth.py" },
    style: {
      background: "#dc2626",
      color: "white",
      borderRadius: "10px",
      padding: 10,
      border: "1px solid #ef4444"
    }
  },

  {
    id: "2",
    position: { x: 100, y: 120 },
    data: { label: "payment_service.py" },
    style: {
      background: "#1e293b",
      color: "white",
      borderRadius: "10px",
      padding: 10
    }
  },

  {
    id: "3",
    position: { x: 400, y: 120 },
    data: { label: "user_controller.py" },
    style: {
      background: "#1e293b",
      color: "white",
      borderRadius: "10px",
      padding: 10
    }
  },

  {
    id: "4",
    position: { x: 250, y: 250 },
    data: { label: "invoice_system.py" },
    style: {
      background: "#1e293b",
      color: "white",
      borderRadius: "10px",
      padding: 10
    }
  }
];

const edges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true
  },

  {
    id: "e1-3",
    source: "1",
    target: "3",
    animated: true
  },

  {
    id: "e2-4",
    source: "2",
    target: "4",
    animated: true
  }
];

function BlastRadiusGraph() {

  return (

    <div
      style={{
        height: "500px",
        background: "#020617",
        borderRadius: "20px"
      }}
    >

      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />

    </div>

  );

}

export default BlastRadiusGraph;