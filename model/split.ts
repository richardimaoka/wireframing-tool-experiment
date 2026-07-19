import type {
  Columns,
  ContainerNode,
  ModelNode,
  Rectangle,
  Rows,
} from "./layout";
import type { Path } from "./path";
import { pathToString } from "./path";

export type SplitOrientation = "rows" | "columns";

export type SplitAction = {
  type: "split";
  targetPath: Path;
  orientation: "rows" | "columns";
};

function splitRectangleToRows(rectangle: Rectangle): Rows {
  return {
    type: "rows",
    id: rectangle.id,
    children: [
      { ...rectangle, id: "1" },
      { ...rectangle, id: "2" },
    ],
    gridTemplateRows: ["1fr", "1fr"],
  };
}

function splitRectangleToColumns(rectangle: Rectangle): Columns {
  return {
    type: "columns",
    id: rectangle.id,
    children: [
      { ...rectangle, id: "1" },
      { ...rectangle, id: "2" },
    ],
    gridTemplateColumns: ["1fr", "1fr"],
  };
}

export function splitRectangle(
  target: ModelNode,
  targetPath: Path,
  orientation: SplitOrientation,
): ContainerNode {
  if (target.type !== "rectangle") {
    throw new Error(
      `splitNode: node search found the target node '${pathToString(targetPath)}' but it was not a rectangle, ${target.type} instead.`,
    );
  }

  switch (orientation) {
    case "rows":
      return splitRectangleToRows(target);
    case "columns":
      return splitRectangleToColumns(target);
  }
}

export function splitRectangleInRows(
  target: ModelNode,
  targetPath: Path,
  action: SplitAction,
): Rows {
  if (target.type !== "rows") {
    throw new Error(
      `splitRectangleInRows: node search found the target node '${pathToString(targetPath)}' but it was not a rows container, ${target.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = target.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `splitRectangleInRows: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const children = [...target.children];
  children[childIndex] = splitRectangle(
    children[childIndex],
    targetPath,
    action.orientation,
  );

  return { ...target, children };
}

export function splitRectangleInColumns(
  target: ModelNode,
  targetPath: Path,
  action: SplitAction,
): Columns {
  if (target.type !== "columns") {
    throw new Error(
      `splitRectangleInColumns: node search found the target node '${pathToString(targetPath)}' but it was not a columns container, ${target.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = target.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `splitRectangleInColumns: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const children = [...target.children];
  children[childIndex] = splitRectangle(
    children[childIndex],
    targetPath,
    action.orientation,
  );

  return { ...target, children };
}
