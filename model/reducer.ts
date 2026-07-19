import { ContainerNode, type ModelNode } from "./layout";
import {
  getParentPath,
  isEquvalentPath,
  isPartialMatchPath,
  pathToString,
  type Path,
} from "./path";
import {
  ResizeAction,
  resizeRectangleInColumns,
  resizeRectangleInRows,
} from "./resize";
import {
  SplitAction,
  splitRectangleInColumns,
  splitRectangleInRows,
} from "./split";

type Action = SplitAction | ResizeAction;

function assertNever(x: never): never {
  throw new Error(`assertNever: unexpected value '${JSON.stringify(x)}'.`);
}

function hasMatchedChild(
  node: ContainerNode,
  nodePath: Path,
  targetPath: Path,
): boolean {
  return node.children.some((c) =>
    isEquvalentPath([...nodePath, c.id], targetPath),
  );
}

function performAction(
  node: ModelNode,
  nodePath: Path,
  targetPath: Path,
  action: Action,
): ContainerNode {
  if (isEquvalentPath(nodePath, targetPath)) {
    const parentPath = getParentPath(targetPath);
    throw new Error(
      `splitNode: unexpected function call - recursive node search should have stopped at the parent level, '${pathToString(parentPath)}', but it hit the exact target level, '${pathToString(targetPath)}.`,
    );
  }

  if (node.type === "rectangle") {
    throw new Error(
      `splitNode: unexpected function call - recursive node search should have stopped at the container of a rectangle, but hit the rectangle leaf node at '${pathToString(nodePath)}'.`,
    );
  }

  if (hasMatchedChild(node, nodePath, targetPath)) {
    // The target is a direct child, so the parent (this node) must be
    // replaced rather than just the matched child - resizing also updates
    // the parent's grid template slot for that child.
    switch (action.type) {
      case "split":
        switch (node.type) {
          case "rows":
            return splitRectangleInRows(node, targetPath, action);
          case "columns":
            return splitRectangleInColumns(node, targetPath, action);
          default:
            return assertNever(node);
        }
      case "resize":
        switch (node.type) {
          case "rows":
            return resizeRectangleInRows(node, targetPath, action);
          case "columns":
            return resizeRectangleInColumns(node, targetPath, action);
          default:
            return assertNever(node);
        }
      default:
        return assertNever(action);
    }
  }

  // No match at this level, so we need to recurse into whichever child
  // partially matches the target path.
  const children = node.children.map((c) => {
    const childPath = [...nodePath, c.id];
    return isPartialMatchPath(childPath, targetPath)
      ? performAction(c, childPath, targetPath, action)
      : c;
  });

  return { ...node, children };
}

export function layoutReducerNew(
  rootContainer: ContainerNode,
  action: Action,
): ContainerNode {
  return performAction(
    rootContainer,
    [rootContainer.id],
    action.targetPath,
    action,
  );
}
