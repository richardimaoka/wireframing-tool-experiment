"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { Node, Path } from "@/model/layout";
import { initialViewPort } from "@/model/layout";
import { layoutReducer } from "@/model/reducer";

const SelectionContext = createContext<{
  selectedPath: Path;
  select: (path: Path) => void;
} | null>(null);

function pathsEqual(a: Path, b: Path) {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function RectangleView({ path }: { path: Path }) {
  const { selectedPath, select } = useContext(SelectionContext)!;
  const isSelected = pathsEqual(selectedPath, path);

  return (
    <div
      onClick={() => select(path)}
      style={{
        height: "100%",
        width: "100%",
        backgroundColor: "#e0e0e0",
        outline: isSelected ? "2px solid #3b82f6" : "1px solid #999",
        outlineOffset: "-2px",
      }}
    />
  );
}

function NodeView({ node, path }: { node: Node; path: Path }) {
  if (node.type === "rectangle") {
    return <RectangleView path={path} />;
  }

  const gridStyle =
    node.type === "rows"
      ? { gridTemplateRows: node.gridTemplateRows.join(" "), rowGap: "8px" }
      : { gridTemplateColumns: node.gridTemplateColumns.join(" "), columnGap: "8px" };

  return (
    <div style={{ height: "100%", width: "100%", display: "grid", ...gridStyle }}>
      {node.children.map((child, i) => (
        <NodeView key={i} node={child} path={[...path, i]} />
      ))}
    </div>
  );
}

export default function Page() {
  const [viewport, dispatch] = useReducer(layoutReducer, initialViewPort());
  const [selectedPath, setSelectedPath] = useState<Path>([]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "h" || e.key === "v") {
        dispatch({
          type: "split",
          path: selectedPath,
          orientation: e.key === "h" ? "rows" : "columns",
        });
        setSelectedPath((path) => [...path, 0]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPath]);

  return (
    <SelectionContext.Provider value={{ selectedPath, select: setSelectedPath }}>
      <div style={{ height: viewport.height }}>
        <NodeView node={viewport.child} path={[]} />
      </div>
    </SelectionContext.Provider>
  );
}
