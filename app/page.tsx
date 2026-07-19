"use client";

import type { Columns, ModelNode, Rows } from "@/model/layout";
import { initialViewPort } from "@/model/layout";
import { getSiblingPath, type Direction } from "@/model/navigation";
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
  type JSX,
} from "react";

// Minimum size a rectangle must have along the split axis to allow splitting:
// 1px + 1px for the two resulting rectangles, plus the 8px grid gap between them.
const MIN_SPLIT_SIZE = 10;

type SelectedSize = { width: number; height: number };

const arrowKeyDirections: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function RectangleView({ path }: { path: Path }) {
  const { selectedPath, select, reportSelectedSize } =
    useContext(SelectionContext)!;
  const isSelected = isEquvalentPath(selectedPath, path);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSelected || !divRef.current) return;

    // CSS grid sizes (fr units) aren't known until the browser lays them out,
    // so we measure the actual rendered box rather than deriving it from the model.
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

function RowsView({ node, path }: { node: Rows; path: Path }) {
  const { selectedPath } = useContext(SelectionContext)!;
  const isSelected = isEquvalentPath(selectedPath, path);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "grid",
        gridTemplateRows: node.gridTemplateRows.join(" "),
        // 8px gap here is the same value baked into MIN_SPLIT_SIZE below.
        rowGap: "8px",
        backgroundColor: isSelected ? "#dbeafe" : undefined,
        outline: isSelected ? "2px solid #3b82f6" : "1px solid #999",
        outlineOffset: "-2px",
      }}
    >
      {node.children.map((child) => (
        <NodeView key={child.id} node={child} path={[...path, child.id]} />
      ))}
    </div>
  );
}

function ColumnsView({ node, path }: { node: Columns; path: Path }) {
  const { selectedPath } = useContext(SelectionContext)!;
  const isSelected = isEquvalentPath(selectedPath, path);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "grid",
        gridTemplateColumns: node.gridTemplateColumns.join(" "),
        // 8px gap here is the same value baked into MIN_SPLIT_SIZE below.
        columnGap: "8px",
        backgroundColor: isSelected ? "#dbeafe" : undefined,
        outline: isSelected ? "2px solid #3b82f6" : "1px solid #999",
        outlineOffset: "-2px",
      }}
    >
      {node.children.map((child) => (
        <NodeView key={child.id} node={child} path={[...path, child.id]} />
      ))}
    </div>
  );
}

function NodeView({
  node,
  path,
}: {
  node: ModelNode;
  path: Path;
}): JSX.Element {
  switch (node.type) {
    case "rectangle":
      return <RectangleView path={path} />;
    case "rows":
      return <RowsView node={node} path={path} />;
    case "columns":
      return <ColumnsView node={node} path={path} />;
  }
}

// reportSelectedSize lets the selected RectangleView push its live rendered
// size up to Page, which needs it to gate splitting.
const SelectionContext = createContext<{
  selectedPath: Path;
  select: (path: Path) => void;
  reportSelectedSize: (size: SelectedSize) => void;
} | null>(null);

export default function Page() {
  const [viewport, dispatch] = useReducer(layoutReducer, initialViewPort());
  const [selectedPath, setSelectedPath] = useState<Path>(["1"]);
  // Plain ref (not state): resize events fire often and shouldn't re-render
  // Page or force the keydown listener below to be torn down and re-attached.
  const selectedSizeRef = useRef<SelectedSize | null>(null);

  const reportSelectedSize = useCallback((size: SelectedSize) => {
    selectedSizeRef.current = size;
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // "h" splits the selected rectangle into rows, "v" into columns.
      if (e.key === "h" || e.key === "v") {
        const orientation = e.key === "h" ? "rows" : "columns";
        const size = selectedSizeRef.current;
        if (!size) {
          // RectangleView reports its size as soon as it mounts, so by the
          // time a user can press a key the selected rectangle must have one.
          throw new Error("No size reported for selected rectangle.");
        }

        // Compare against the axis the split actually divides (row height vs column width).
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
        return;
      }

      const direction = arrowKeyDirections[e.key];
      if (direction) {
        const siblingPath = getSiblingPath(
          viewport.rootNode,
          selectedPath,
          direction,
        );
        if (siblingPath) {
          setSelectedPath(siblingPath);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPath, viewport.rootNode]);

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
