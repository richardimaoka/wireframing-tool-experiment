import { type ModelNode, type Rectangle } from "./layout";
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
): ModelNode {
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
