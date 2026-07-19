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
  parent: ModelNode,
  targetPath: Path,
  _action: CenterAction,
): Rows {
  if (parent.type !== "rows") {
    throw new Error(
      `centerRectangleInRows: node search found the target node '${pathToString(targetPath)}' but it was not a rows container, ${parent.type} instead.`,
    );
  }

  return parent;
}

// Placeholder: centering is not implemented yet, so the container is
// returned unchanged.
export function centerRectangleInColumns(
  parent: ModelNode,
  targetPath: Path,
  _action: CenterAction,
): Columns {
  if (parent.type !== "columns") {
    throw new Error(
      `centerRectangleInColumns: node search found the target node '${pathToString(targetPath)}' but it was not a columns container, ${parent.type} instead.`,
    );
  }

  return parent;
}
