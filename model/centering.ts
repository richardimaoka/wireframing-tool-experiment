import { Columns, Rows, type ModelNode } from "./layout";
import { pathToString, type Path } from "./path";

export type HorizontalCenterAction = {
  type: "center";
  axis: "horizontal";
  targetPath: Path;
  width: number;
};

export type VerticalCenterAction = {
  type: "center";
  axis: "vertical";
  targetPath: Path;
  height: number;
};

export type CenterAction = HorizontalCenterAction | VerticalCenterAction;

export function centerRectangleInRows(
  parent: ModelNode,
  targetPath: Path,
  action: CenterAction,
): Rows {
  if (parent.type !== "rows") {
    throw new Error(
      `centerRectangleInRows: node search found the target node '${pathToString(targetPath)}' but it was not a rows container, ${parent.type} instead.`,
    );
  }

  if (action.axis === "vertical") {
    throw new Error(
      "centerRectangleInRows: vertical centering within a rows container is not implemented yet.",
    );
  }

  if (parent.children.length > 1) {
    throw new Error(
      "centerRectangleInRows: centering a rectangle whose parent has more than one child is not implemented yet.",
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `centerRectangleInRows: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const child = parent.children[childIndex];
  if (child.type !== "rectangle") {
    throw new Error(
      `centerRectangleInRows: matched child '${childId}' under '${pathToString(targetPath)}' is not a rectangle, ${child.type} instead.`,
    );
  }

  const children = [...parent.children];
  children[childIndex] = { ...child, width: action.width };

  return { ...parent, children, gridTemplateRows: ["max-content"] };
}

export function centerRectangleInColumns(
  parent: ModelNode,
  targetPath: Path,
  action: CenterAction,
): Columns {
  if (parent.type !== "columns") {
    throw new Error(
      `centerRectangleInColumns: node search found the target node '${pathToString(targetPath)}' but it was not a columns container, ${parent.type} instead.`,
    );
  }

  if (action.axis === "horizontal") {
    throw new Error(
      "centerRectangleInColumns: horizontal centering within a columns container is not implemented yet.",
    );
  }

  if (parent.children.length > 1) {
    throw new Error(
      "centerRectangleInColumns: centering a rectangle whose parent has more than one child is not implemented yet.",
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `centerRectangleInColumns: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const child = parent.children[childIndex];
  if (child.type !== "rectangle") {
    throw new Error(
      `centerRectangleInColumns: matched child '${childId}' under '${pathToString(targetPath)}' is not a rectangle, ${child.type} instead.`,
    );
  }

  const children = [...parent.children];
  children[childIndex] = { ...child, height: action.height };

  return { ...parent, children, gridTemplateColumns: ["max-content"] };
}
