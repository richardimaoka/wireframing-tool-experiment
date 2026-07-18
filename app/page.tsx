"use client";

import type { Node } from "@/model/layout";
import { initialViewPort } from "@/model/layout";
import type { Path } from "@/model/path";
import { isEquvalentPath } from "@/model/path";
import { layoutReducer } from "@/model/reducer";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

const SelectionContext = createContext<{
  selectedPath: Path;
  select: (path: Path) => void;
} | null>(null);

function RectangleView({ path }: { path: Path }) {
  const { selectedPath, select } = useContext(SelectionContext)!;
  const isSelected = isEquvalentPath(selectedPath, path);

  return (
    <div
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
  console.log(`NodeView: path='${path.join("/")}' node.type='${node.type}'`);
  if (node.type === "rectangle") {
    return <RectangleView path={path} />;
  }

  const gridStyle =
    node.type === "rows"
      ? { gridTemplateRows: node.gridTemplateRows.join(" "), rowGap: "8px" }
      : {
          gridTemplateColumns: node.gridTemplateColumns.join(" "),
          columnGap: "8px",
        };

  return (
    <div
      style={{ height: "100%", width: "100%", display: "grid", ...gridStyle }}
    >
      {node.children.map((child) => (
        <NodeView key={child.id} node={child} path={[...path, child.id]} />
      ))}
    </div>
  );
}

export default function Page() {
  const [viewport, dispatch] = useReducer(layoutReducer, initialViewPort());
  const [selectedPath, setSelectedPath] = useState<Path>(["1"]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "h" || e.key === "v") {
        dispatch({
          type: "split",
          targetPath: selectedPath,
          orientation: e.key === "h" ? "rows" : "columns",
        });
        setSelectedPath((path) => [...path, "1"]); // Select the first child of the newly split node
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPath]);

  return (
    <SelectionContext.Provider
      value={{ selectedPath, select: setSelectedPath }}
    >
      <div style={{ height: viewport.height }}>
        <NodeView node={viewport.rootNode} path={[viewport.rootNode.id]} />
      </div>
    </SelectionContext.Provider>
  );
}
