import { Columns, Rows, type ModelNode, type Rectangle } from "./layout";
import { pathToString, type Path } from "./path";

type SetRectangleHeightAction = {
  type: "resize";
  subType: "setRectangleHeight";
  targetPath: string[];
  height: number;
};

type SetRectangleWidthAction = {
  type: "resize";
  subType: "setRectangleWidth";
  targetPath: string[];
  width: number;
};

type SetRectangleWidthHeightAction = {
  type: "resize";
  subType: "setRectangleWidthHeight";
  targetPath: string[];
  width: number;
  height: number;
};

export type ResizeAction =
  | SetRectangleHeightAction
  | SetRectangleWidthAction
  | SetRectangleWidthHeightAction;

function setRectangleHeight(rectangle: Rectangle, height: number): Rectangle {
  return {
    ...rectangle,
    height: `${height}px`,
  };
}

function setRectangleWidth(rectangle: Rectangle, width: number): Rectangle {
  return {
    ...rectangle,
    width: `${width}px`,
  };
}

function setRectangleWidthHeight(
  rectangle: Rectangle,
  width: number,
  height: number,
): Rectangle {
  return {
    ...rectangle,
    width: `${width}px`,
    height: `${height}px`,
  };
}

export function resizeRectangle(
  target: ModelNode,
  targetPath: Path,
  action: ResizeAction,
): Rectangle {
  if (target.type !== "rectangle") {
    throw new Error(
      `splitNode: node search found the target node '${pathToString(targetPath)}' but it was not a rectangle, ${target.type} instead.`,
    );
  }

  switch (action.subType) {
    case "setRectangleHeight":
      return setRectangleHeight(target, action.height);
    case "setRectangleWidth":
      return setRectangleWidth(target, action.width);
    case "setRectangleWidthHeight":
      return setRectangleWidthHeight(target, action.width, action.height);
  }
}

// Explicit boolean return type makes this exhaustiveness-checked: a new
// ResizeAction subType left out of the switch fails to compile instead of
// silently falling through.
function setsHeight(subType: ResizeAction["subType"]): boolean {
  switch (subType) {
    case "setRectangleHeight":
    case "setRectangleWidthHeight":
      return true;
    case "setRectangleWidth":
      return false;
  }
}

function setsWidth(subType: ResizeAction["subType"]): boolean {
  switch (subType) {
    case "setRectangleWidth":
    case "setRectangleWidthHeight":
      return true;
    case "setRectangleHeight":
      return false;
  }
}

export function resizeRectangleInRows(
  parent: ModelNode,
  targetPath: Path,
  action: ResizeAction,
): Rows {
  if (parent.type !== "rows") {
    throw new Error(
      `resizeRectangleInRows: node search found the target node '${pathToString(targetPath)}' but it was not a rows container, ${parent.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `resizeRectangleInRows: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const children = [...parent.children];
  children[childIndex] = resizeRectangle(
    children[childIndex],
    targetPath,
    action,
  );

  const gridTemplateRows = [...parent.gridTemplateRows];
  if (setsHeight(action.subType)) {
    // The resized row now sizes itself to its content instead of sharing
    // the remaining space via `fr`, since it has an explicit pixel height.
    gridTemplateRows[childIndex] = "max-content";
  }

  return { ...parent, children, gridTemplateRows };
}

export function resizeRectangleInColumns(
  parent: ModelNode,
  targetPath: Path,
  action: ResizeAction,
): Columns {
  if (parent.type !== "columns") {
    throw new Error(
      `resizeRectangleInColumns: node search found the target node '${pathToString(targetPath)}' but it was not a columns container, ${parent.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `resizeRectangleInColumns: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const children = [...parent.children];
  children[childIndex] = resizeRectangle(
    children[childIndex],
    targetPath,
    action,
  );

  const gridTemplateColumns = [...parent.gridTemplateColumns];
  if (setsWidth(action.subType)) {
    // The resized column now sizes itself to its content instead of
    // sharing the remaining space via `fr`, since it has an explicit
    // pixel width.
    gridTemplateColumns[childIndex] = "max-content";
  }

  return { ...parent, children, gridTemplateColumns };
}
