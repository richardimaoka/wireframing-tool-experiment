import { type ModelNode, type ViewPort } from "./layout";
import {
  getParentPath,
  isEquvalentPath,
  isPartialMatchPath,
  pathToString,
  type Path,
} from "./path";
import { ResizeAction } from "./resize";
import { SplitAction, splitRectangle } from "./split";

type Action = SplitAction | ResizeAction;

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

  const children = node.children.map((c) => {
    const childPath = [...nodePath, c.id];

    if (isEquvalentPath(childPath, targetPath)) {
      // Exact match found, so we can peroform the action on this child node
      // Also, this node (i.e.) the parent of the target node should be altered
      switch (action.type) {
        case "split":
          return splitRectangle(c, targetPath, action.orientation);
        default:
          throw new Error(
            `performAction: unexpected action type '${action.type}' encountered.`,
          );
      }
    } else if (isPartialMatchPath(childPath, targetPath)) {
      // Partial match found, so we need to recurse into this child node
      return performAction(c, childPath, targetPath, action);
    } else {
      // No match found, so we can return this child node as-is
      return c;
    }
  });

  // Return a new node with the updated children array
  // children needs to be recursively updated,
  // so we need to return a new node with the updated children array
  return { ...node, children };
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
      // targetPath matches the root node, so we can split it directly
      switch (action.type) {
        case "split":
          return splitRectangle(
            viewPort.rootNode,
            targetPath,
            action.orientation,
          );
        default:
          throw new Error(
            `performAction: unexpected action type '${action.type}' encountered.`,
          );
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
