import type { Rectangle } from "./layout";

type SetRectangleHeightAction = {
  type: "setRectangleHeight";
  targetPath: string[];
  height: number;
};

type SetRectangleWidthAction = {
  type: "setRectangleWidth";
  targetPath: string[];
  width: number;
};

type SetRectangleWidthHeightAction = {
  type: "setRectangleWidthHeight";
  targetPath: string[];
  width: number;
  height: number;
};

export type ResizeAction =
  | SetRectangleHeightAction
  | SetRectangleWidthAction
  | SetRectangleWidthHeightAction;

export function setRectangleHeight(
  rectangle: Rectangle,
  height: number,
): Rectangle {
  return {
    ...rectangle,
    height: `${height}px`,
  };
}

export function setRectangleWidth(
  rectangle: Rectangle,
  width: number,
): Rectangle {
  return {
    ...rectangle,
    width: `${width}px`,
  };
}

export function setRectangleWidthHeight(
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
