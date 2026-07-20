"use client";

import type {
  Columns,
  ContainerNode,
  ModelNode,
  Rectangle,
  Rows,
} from "@/model/layout";
import { initialColumns, initialRows } from "@/model/layout";
import {
  getFirstChildPath,
  getNodeByPath,
  getParentSelectionPath,
  getRectangle,
  getSiblingPath,
  isRectangle,
  type Direction,
} from "@/model/navigation";
import type { Path } from "@/model/path";
import { getParentPath, isEquvalentPath } from "@/model/path";
import { layoutReducerNew } from "@/model/reducer";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type JSX,
  type SubmitEvent,
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

function RectangleView({ node, path }: { node: Rectangle; path: Path }) {
  const { selectedPath, select, reportSelectedSize } =
    useContext(SelectionContext)!;
  const isSelected = isEquvalentPath(selectedPath, path);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measure the Rectangle size, and let entire App know if this Rectangle can be split, or too small to split.

    // CSS grid sizes (fr units) aren't known until the browser lays them out,
    // so we measure the actual rendered box rather than deriving it from the model.

    // this callback only works if selectedPath is the same as path, and divRef.current is not null.
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
        // An explicit width/height (set via the "s" shortcut) overrides the
        // default of filling the grid cell.
        height: node.height ?? "100%",
        width: node.width ?? "100%",
        backgroundColor: isSelected ? "#bfdbfe" : "#e0e0e0",
        outline: isSelected ? "2px solid #3b82f6" : "1px solid #999",
        outlineOffset: "-2px",
      }}
    />
  );
}

function RowsView({ node, path }: { node: Rows; path: Path }) {
  const { selectedPath } = useContext(SelectionContext)!;
  const isSelected = isEquvalentPath(selectedPath, path);
  const hasSelectedChild = isEquvalentPath(getParentPath(selectedPath), path);

  // Selected container gets the strongest tint; a container whose child is
  // selected gets a lighter/softer tint; otherwise no fill.
  const backgroundColor = isSelected
    ? "#bfdbfe"
    : hasSelectedChild
      ? "#fef9c3"
      : "white";
  // Selected container's outline is blue, unselected is neutral gray.
  const outlineColor = isSelected ? "#3b82f6" : "#999";
  // Selected container gets a thicker outline to stand out.
  const outlineWidth = isSelected ? 2 : 1;
  const justifyContent = node.justifyContent
    ? { justifyContent: node.justifyContent }
    : {};

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "grid",
        gridTemplateRows: node.gridTemplateRows.join(" "),
        // 8px gap here is the same value baked into MIN_SPLIT_SIZE below.
        rowGap: "8px",
        backgroundColor,
        outline: `${outlineWidth}px solid ${outlineColor}`,
        outlineOffset: "-2px",
        ...justifyContent,
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
  const hasSelectedChild = isEquvalentPath(getParentPath(selectedPath), path);

  // Selected container gets the strongest tint; a container whose child is
  // selected gets a lighter/softer tint; otherwise no fill.
  const backgroundColor = isSelected
    ? "#bfdbfe"
    : hasSelectedChild
      ? "#fef9c3"
      : "white";
  // Selected container's outline is blue, unselected is neutral gray.
  const outlineColor = isSelected ? "#3b82f6" : "#999";
  // Selected container gets a thicker outline to stand out.
  const outlineWidth = isSelected ? 2 : 1;
  const justifyContent = node.justifyContent
    ? { justifyContent: node.justifyContent }
    : {};

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "grid",
        gridTemplateColumns: node.gridTemplateColumns.join(" "),
        // 8px gap here is the same value baked into MIN_SPLIT_SIZE below.
        columnGap: "8px",
        backgroundColor,
        outline: `${outlineWidth}px solid ${outlineColor}`,
        outlineOffset: "-2px",
        ...justifyContent,
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
      return <RectangleView node={node} path={path} />;
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

function ResizeDialog({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (width: number | null, height: number | null) => void;
}) {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const parsedWidth = width.trim() === "" ? null : Number(width);
    const parsedHeight = height.trim() === "" ? null : Number(height);
    if (
      (parsedWidth !== null && !Number.isFinite(parsedWidth)) ||
      (parsedHeight !== null && !Number.isFinite(parsedHeight))
    ) {
      return;
    }
    onSubmit(parsedWidth, parsedHeight);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onCancel();
        }
        // Prevent the global keydown shortcuts (h/v/i/o/arrows) from firing
        // while typing in this dialog.
        e.stopPropagation();
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          minWidth: "240px",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          Width (px)
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            autoFocus
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          Height (px)
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </label>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Apply</button>
        </div>
      </form>
    </div>
  );
}

function CenterAxisDialog({
  onCancel,
  onSelect,
}: {
  onCancel: () => void;
  onSelect: (axis: "horizontal" | "vertical") => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onCancel();
        }
        e.stopPropagation();
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          minWidth: "240px",
        }}
      >
        <p>Center horizontally or vertically?</p>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={() => onSelect("horizontal")}>
            Horizontal
          </button>
          <button type="button" onClick={() => onSelect("vertical")}>
            Vertical
          </button>
        </div>
      </div>
    </div>
  );
}

function CenterDimensionDialog({
  label,
  onCancel,
  onSubmit,
}: {
  label: string;
  onCancel: () => void;
  onSubmit: (value: number) => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const parsed = Number(value);
    if (value.trim() === "" || !Number.isFinite(parsed)) {
      return;
    }
    onSubmit(parsed);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onCancel();
        }
        e.stopPropagation();
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          minWidth: "240px",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {label}
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </label>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Apply</button>
        </div>
      </form>
    </div>
  );
}

function WireframeEditor({ rootContainer }: { rootContainer: ContainerNode }) {
  const [rootNode, dispatch] = useReducer(layoutReducerNew, rootContainer);
  const [selectedPath, setSelectedPath] = useState<Path>(["root", "1"]);
  // Plain ref (not state): resize events fire often and shouldn't re-render
  // Page or force the keydown listener below to be torn down and re-attached.
  const selectedSizeRef = useRef<SelectedSize | null>(null);
  const [isResizeDialogOpen, setIsResizeDialogOpen] = useState(false);
  // Which step of the "c" (center) flow is open, if any: an axis choice,
  // then - only when the rectangle doesn't already have that dimension set -
  // a prompt for the width or height needed to center it.
  const [centerDialogStep, setCenterDialogStep] = useState<
    "chooseAxis" | "setWidth" | "setHeight" | null
  >(null);

  const reportSelectedSize = useCallback((size: SelectedSize) => {
    selectedSizeRef.current = size;
  }, []);

  const closeResizeDialog = useCallback(() => setIsResizeDialogOpen(false), []);
  const closeCenterDialog = useCallback(() => setCenterDialogStep(null), []);

  const selectCenterAxis = useCallback(
    (axis: "horizontal" | "vertical") => {
      const rectangle = getRectangle(rootNode, selectedPath);
      if (!rectangle) {
        setCenterDialogStep(null);
        return;
      }

      if (axis === "horizontal") {
        if (rectangle.width == null) {
          setCenterDialogStep("setWidth");
          return;
        }
        dispatch({
          type: "center",
          axis: "horizontal",
          targetPath: selectedPath,
          width: rectangle.width,
        });
      } else {
        if (rectangle.height == null) {
          setCenterDialogStep("setHeight");
          return;
        }
        dispatch({
          type: "center",
          axis: "vertical",
          targetPath: selectedPath,
          height: rectangle.height,
        });
      }
      setCenterDialogStep(null);
    },
    [rootNode, selectedPath],
  );

  const submitCenterDimension = useCallback(
    (value: number) => {
      if (centerDialogStep === "setWidth") {
        dispatch({
          type: "center",
          axis: "horizontal",
          targetPath: selectedPath,
          width: value,
        });
      } else if (centerDialogStep === "setHeight") {
        dispatch({
          type: "center",
          axis: "vertical",
          targetPath: selectedPath,
          height: value,
        });
      }
      setCenterDialogStep(null);
    },
    [centerDialogStep, selectedPath],
  );

  const submitResize = useCallback(
    (width: number | null, height: number | null) => {
      if (width !== null && height !== null) {
        dispatch({
          type: "resize",
          subType: "setRectangleWidthHeight",
          targetPath: selectedPath,
          width,
          height,
        });
      } else if (width !== null) {
        dispatch({
          type: "resize",
          subType: "setRectangleWidth",
          targetPath: selectedPath,
          width,
        });
      } else if (height !== null) {
        dispatch({
          type: "resize",
          subType: "setRectangleHeight",
          targetPath: selectedPath,
          height,
        });
      }
      setIsResizeDialogOpen(false);
    },
    [selectedPath],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // While the resize or center dialog is open, let its own inputs
      // handle keys instead of triggering other shortcuts (e.g. typing "h"
      // into the width field shouldn't split the rectangle).
      if (isResizeDialogOpen || centerDialogStep) {
        return;
      }

      // "s" opens a dialog to set the selected rectangle's width/height.
      if (e.key === "s") {
        if (!isRectangle(rootNode, selectedPath)) {
          return;
        }
        setIsResizeDialogOpen(true);
        return;
      }

      // "c" opens a dialog to center the selected rectangle horizontally
      // or vertically.
      if (e.key === "c") {
        if (!isRectangle(rootNode, selectedPath)) {
          return;
        }

        // Centering is only implemented for a rectangle that is its
        // parent's only child.
        const parent = getNodeByPath(rootNode, getParentPath(selectedPath));
        if (parent.type === "rectangle") {
          // A rectangle can never be the parent of another node - if
          // selectedPath is a rectangle (checked above), its parent must be
          // a Rows/Columns container.
          throw new Error("Unexpected rectangle parent for a rectangle leaf.");
        }
        // Centering more than one child is not implemented yet (see
        // centerRectangleInRows/centerRectangleInColumns).
        if (parent.children.length > 1) {
          return;
        }

        setCenterDialogStep("chooseAxis");
        return;
      }

      // "h" splits the selected rectangle into rows, "v" into columns.
      if (e.key === "h" || e.key === "v") {
        // Splitting only makes sense for a rectangle leaf, not a
        // Rows/Columns container (e.g. after navigating there with "o").
        if (!isRectangle(rootNode, selectedPath)) {
          return;
        }

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

      // "i" selects the first child of the selection (goes in), "o"
      // selects its parent (goes out).
      if (e.key === "i" || e.key === "o") {
        const targetPath =
          e.key === "i"
            ? getFirstChildPath(rootNode, selectedPath)
            : getParentSelectionPath(selectedPath);
        if (targetPath) {
          setSelectedPath(targetPath);
        }
        return;
      }

      const direction = arrowKeyDirections[e.key];
      if (direction) {
        const siblingPath = getSiblingPath(rootNode, selectedPath, direction);
        if (siblingPath) {
          setSelectedPath(siblingPath);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPath, rootNode, isResizeDialogOpen, centerDialogStep]);

  return (
    <SelectionContext.Provider
      value={{ selectedPath, select: setSelectedPath, reportSelectedSize }}
    >
      <div style={{ height: "100vh" }}>
        <NodeView node={rootNode} path={[rootNode.id]} />
      </div>
      {isResizeDialogOpen && (
        <ResizeDialog onCancel={closeResizeDialog} onSubmit={submitResize} />
      )}
      {centerDialogStep === "chooseAxis" && (
        <CenterAxisDialog
          onCancel={closeCenterDialog}
          onSelect={selectCenterAxis}
        />
      )}
      {centerDialogStep === "setWidth" && (
        <CenterDimensionDialog
          label="Width (px)"
          onCancel={closeCenterDialog}
          onSubmit={submitCenterDimension}
        />
      )}
      {centerDialogStep === "setHeight" && (
        <CenterDimensionDialog
          label="Height (px)"
          onCancel={closeCenterDialog}
          onSubmit={submitCenterDimension}
        />
      )}
    </SelectionContext.Provider>
  );
}

function RootContainerDialog({
  onSelect,
}: {
  onSelect: (orientation: "rows" | "columns") => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          minWidth: "240px",
        }}
      >
        <p>Start the wireframe with Rows or Columns as the root container?</p>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button type="button" onClick={() => onSelect("rows")}>
            Rows
          </button>
          <button type="button" onClick={() => onSelect("columns")}>
            Columns
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [rootContainer, setRootContainer] = useState<ContainerNode | null>(
    null,
  );

  if (!rootContainer) {
    return (
      <RootContainerDialog
        onSelect={(orientation) =>
          setRootContainer(
            orientation === "rows" ? initialRows() : initialColumns(),
          )
        }
      />
    );
  }

  return <WireframeEditor rootContainer={rootContainer} />;
}
