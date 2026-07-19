import { Columns, Rows, type ModelNode } from "./layout";
import { pathToString, type Path } from "./path";

export type CenterAction = {
  type: "center";
  targetPath: Path;
  axis: "horizontal" | "vertical";
};

// Placeholder: centering is not implemented yet, so the container is
// returned unchanged.
export function centerRectangleInRows(
  target: ModelNode,
  targetPath: Path,
  _action: CenterAction,
): Rows {
  if (target.type !== "rows") {
    throw new Error(
      `centerRectangleInRows: node search found the target node '${pathToString(targetPath)}' but it was not a rows container, ${target.type} instead.`,
    );
  }

  return target;
}

// Placeholder: centering is not implemented yet, so the container is
// returned unchanged.
export function centerRectangleInColumns(
  target: ModelNode,
  targetPath: Path,
  _action: CenterAction,
): Columns {
  if (target.type !== "columns") {
    throw new Error(
      `centerRectangleInColumns: node search found the target node '${pathToString(targetPath)}' but it was not a columns container, ${target.type} instead.`,
    );
  }

  return target;
}
