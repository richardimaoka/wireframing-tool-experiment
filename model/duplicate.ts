import { Columns, Rows, type ModelNode } from "./layout";
import { pathToString, type Path } from "./path";

export type DuplicateAction = {
  type: "duplicate";
  targetPath: Path;
};

export function duplicateRectangleInRows(
  parent: ModelNode,
  targetPath: Path,
  // action: DuplicateAction,
): Rows {
  if (parent.type !== "rows") {
    throw new Error(
      `duplicateRectangleInRows: node search found the target node '${pathToString(targetPath)}' but it was not a rows container, ${parent.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `duplicateRectangleInRows: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const child = parent.children[childIndex];
  if (child.type !== "rectangle") {
    throw new Error(
      `duplicateRectangleInRows: matched child '${childId}' under '${pathToString(targetPath)}' is not a rectangle, ${child.type} instead.`,
    );
  }

  // children.length + 1 is guaranteed unused: existing ids never exceed the
  // current child count, since ids only ever grow via this same +1 scheme.
  const duplicate = { ...child, id: String(parent.children.length + 1) };

  // Copy instead of mutating parent.children directly, then splice the
  // duplicate in right after the original (childIndex + 1), pushing later
  // siblings back rather than overwriting anything.
  const children = [...parent.children];
  children.splice(childIndex + 1, 0, duplicate);

  // Give the duplicate row the same track sizing as the original (e.g.
  // "max-content" if the original had an explicit height, "1fr" otherwise)
  // so children and gridTemplateRows stay the same length and aligned by index.
  const gridTemplateRows = [...parent.gridTemplateRows];
  gridTemplateRows.splice(childIndex + 1, 0, gridTemplateRows[childIndex]);

  return { ...parent, children, gridTemplateRows };
}

export function duplicateRectangleInColumns(
  parent: ModelNode,
  targetPath: Path,
  // action: DuplicateAction,
): Columns {
  if (parent.type !== "columns") {
    throw new Error(
      `duplicateRectangleInColumns: node search found the target node '${pathToString(targetPath)}' but it was not a columns container, ${parent.type} instead.`,
    );
  }

  const childId = targetPath[targetPath.length - 1];
  const childIndex = parent.children.findIndex((c) => c.id === childId);
  if (childIndex === -1) {
    throw new Error(
      `duplicateRectangleInColumns: no child '${childId}' found under '${pathToString(targetPath)}'.`,
    );
  }

  const child = parent.children[childIndex];
  if (child.type !== "rectangle") {
    throw new Error(
      `duplicateRectangleInColumns: matched child '${childId}' under '${pathToString(targetPath)}' is not a rectangle, ${child.type} instead.`,
    );
  }

  // children.length + 1 is guaranteed unused: existing ids never exceed the
  // current child count, since ids only ever grow via this same +1 scheme.
  const duplicate = { ...child, id: String(parent.children.length + 1) };

  // Copy instead of mutating parent.children directly, then splice the
  // duplicate in right after the original (childIndex + 1), pushing later
  // siblings back rather than overwriting anything.
  const children = [...parent.children];
  children.splice(childIndex + 1, 0, duplicate);

  // Give the duplicate column the same track sizing as the original (e.g.
  // "max-content" if the original had an explicit width, "1fr" otherwise)
  // so children and gridTemplateColumns stay the same length and aligned by index.
  const gridTemplateColumns = [...parent.gridTemplateColumns];
  gridTemplateColumns.splice(
    childIndex + 1,
    0,
    gridTemplateColumns[childIndex],
  );

  return { ...parent, children, gridTemplateColumns };
}
