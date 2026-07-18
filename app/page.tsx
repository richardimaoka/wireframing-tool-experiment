"use client";

import type { Node } from "@/model/layout";
import { initialViewPort } from "@/model/layout";
import type { Path } from "@/model/path";
import { isEquvalentPath } from "@/model/path";
import { layoutReducer } from "@/model/reducer";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

// Minimum size a rectangle must have along the split axis to allow splitting:
// 1px + 1px for the two resulting rectangles, plus the 8px grid gap between them.
const MIN_SPLIT_SIZE = 10;

type SelectedSize = { width: number; height: number };

const SelectionContext = createContext<{
  selectedPath: Path;
  select: (path: Path) => void;
  reportSelectedSize: (size: SelectedSize) => void;
} | null>(null);

function RectangleView({ path }: { path: Path }) {
  const { selectedPath, select, reportSelectedSize } =
    useContext(SelectionContext)!;
  const isSelected = isEquvalentPath(selectedPath, path);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(
      `RectangleView: path='${path.join("/")}' isSelected=${isSelected}`,
    );
    if (!isSelected || !divRef.current) return;

    const el = divRef.current;
    const observer = new ResizeObserver(([entry]) => {
      reportSelectedSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSelected, reportSelectedSize]);

  return (
    <div
      ref={divRef}
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
  const selectedSizeRef = useRef<SelectedSize | null>(null);

  const reportSelectedSize = useCallback((size: SelectedSize) => {
    selectedSizeRef.current = size;
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "h" || e.key === "v") {
        const orientation = e.key === "h" ? "rows" : "columns";
        const size = selectedSizeRef.current;
        if (!size) {
          throw new Error("No size reported for selected rectangle.");
        }

        const sizeAlongAxis = orientation === "rows" ? size.height : size.width;
        if (sizeAlongAxis < MIN_SPLIT_SIZE) {
          return;
        }

        dispatch({
          type: "split",
          targetPath: selectedPath,
          orientation,
        });

        setSelectedPath((path) => [...path, "1"]); // Select the first child of the newly split node
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPath]);

  return (
    <SelectionContext.Provider
      value={{ selectedPath, select: setSelectedPath, reportSelectedSize }}
    >
      <div style={{ height: viewport.height }}>
        <NodeView node={viewport.rootNode} path={[viewport.rootNode.id]} />
      </div>
    </SelectionContext.Provider>
  );
}
