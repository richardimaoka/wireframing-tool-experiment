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
  const halvedHeight =
    rectangle.height !== undefined
      ? { height: (rectangle.height - 8) / 2 }
      : {};

  return {
    type: "rows",
    id: rectangle.id,
    children: [
      { ...rectangle, id: "1", ...halvedHeight },
      { ...rectangle, id: "2", ...halvedHeight },
    ],
    gridTemplateRows: ["1fr", "1fr"],
  };
}

function splitRectangleToColumns(rectangle: Rectangle): Columns {
  const halvedWidth =
    rectangle.width !== undefined ? { width: (rectangle.width - 8) / 2 } : {};

  return {
    type: "columns",
    id: rectangle.id,
    children: [
      { ...rectangle, id: "1", ...halvedWidth },
      { ...rectangle, id: "2", ...halvedWidth },
    ],
    gridTemplateColumns: ["1fr", "1fr"],
  };
}

function splitRectangle(
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
  parent: ModelNode,
  targetPath: Path,
  action: SplitAction,
): Rows {
  if (parent.type !== "rows") {
    throw new Error(
      `splitRectangleInRows: node search found the target node '${pathToString(targetPath)}' but it was not a rows container, ${parent.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `splitRectangleInRows: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const children = [...parent.children];
  children[childIndex] = splitRectangle(
    children[childIndex],
    targetPath,
    action.orientation,
  );

  return { ...parent, children };
}

export function splitRectangleInColumns(
  parent: ModelNode,
  targetPath: Path,
  action: SplitAction,
): Columns {
  if (parent.type !== "columns") {
    throw new Error(
      `splitRectangleInColumns: node search found the target node '${pathToString(targetPath)}' but it was not a columns container, ${parent.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `splitRectangleInColumns: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const children = [...parent.children];
  children[childIndex] = splitRectangle(
    children[childIndex],
    targetPath,
    action.orientation,
  );

  return { ...parent, children };
}
