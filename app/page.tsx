"use client";

import type { Rows } from "@/model/layout";
import { useEffect, useState } from "react";

const initialModel: Rows = {
  type: "rows",
  children: [{ type: "rectangle" }],
};

function RectangleView() {
  return <div style={{ backgroundColor: "#e0e0e0" }}></div>;
}

function RowsView({ model }: { model: Rows }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        rowGap: "8px",
        gridTemplateRows: `repeat(${model.children.length}, 1fr)`,
      }}
    >
      {model.children.map((_, i) => (
        <RectangleView key={i} />
      ))}
    </div>
  );
}

export default function Page() {
  const [model, setModel] = useState<Rows>(initialModel);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "h") {
        setModel(() => ({
          type: "rows",
          children: [{ type: "rectangle" }, { type: "rectangle" }],
        }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <RowsView model={model} />;
}
