import type { Rectangle } from "./layout";

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
