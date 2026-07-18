import type { Columns, Node, Rectangle, Rows } from "./layout";
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
  target: Node,
  targetPath: Path,
  orientation: SplitOrientation,
): Node {
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
