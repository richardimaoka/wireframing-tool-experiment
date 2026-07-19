import { ContainerNode, type ModelNode, type ViewPort } from "./layout";
import {
  getParentPath,
  isEquvalentPath,
  isPartialMatchPath,
  pathToString,
  type Path,
} from "./path";
import {
  ResizeAction,
  resizeRectangle,
  resizeRectangleInColumns,
  resizeRectangleInRows,
} from "./resize";
import {
  SplitAction,
  splitRectangle,
  splitRectangleInColumns,
  splitRectangleInRows,
} from "./split";

type Action = SplitAction | ResizeAction;

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
): ModelNode {
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

  switch (action.type) {
    case "split": {
      if (hasMatchedChild(node, nodePath, targetPath)) {
        switch (node.type) {
          case "rows":
            return splitRectangleInRows(node, targetPath, action);
          case "columns":
            return splitRectangleInColumns(node, targetPath, action);
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

    case "resize": {
      // Resizing a rectangle also updates its slot in the parent's grid
      // template, so the parent (this node) - not just the matched child -
      // must be replaced.
      if (hasMatchedChild(node, nodePath, targetPath)) {
        switch (node.type) {
          case "rows":
            return resizeRectangleInRows(node, targetPath, action);
          case "columns":
            return resizeRectangleInColumns(node, targetPath, action);
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
  }
}

function performActionFromViewPort(
  viewPort: ViewPort,
  targetPath: Path,
  action: Action,
): ModelNode {
  if (targetPath.length < 1) {
    throw new Error(
      `splitNodeFromRoot: targetPath '${pathToString(targetPath)}' is invalid - it must have at least one element.`,
    );
  }

  // targetPath has depth = 1, so we need to check if it matches the root node
  if (targetPath.length === 1) {
    if (viewPort.rootNode.id !== targetPath[0]) {
      throw new Error(
        `splitNodeFromRoot: targetPath '${pathToString(targetPath)}' has depth 1 only, but does not match the root node.`,
      );
    } else {
      // targetPath matches the root node, so we can act on it directly
      switch (action.type) {
        case "split":
          return splitRectangle(
            viewPort.rootNode,
            targetPath,
            action.orientation,
          );
        case "resize":
          return resizeRectangle(viewPort.rootNode, targetPath, action);
      }
    }
  }

  // targetPath has depth > 1, so we need to search for the target node
  return performAction(
    viewPort.rootNode,
    [viewPort.rootNode.id],
    targetPath,
    action,
  );
}

export function layoutReducer(viewport: ViewPort, action: Action): ViewPort {
  return {
    ...viewport,
    rootNode: performActionFromViewPort(viewport, action.targetPath, action),
  };
}
