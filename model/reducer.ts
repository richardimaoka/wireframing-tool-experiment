import { type Node, type Path, type ViewPort } from "./layout";
import {
  getParentPath,
  isEquvalentPath,
  isPartialMatchPath,
  pathToString,
} from "./path";
import { SplitAction, SplitOrientation, splitRectangle } from "./split";

function performAction(
  node: Node,
  nodePath: Path,
  targetPath: Path,
  orientation: SplitOrientation,
): Node {
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
      // Exact match found, so we can split this child node
      // Also, this node (i.e.) the parent of the target node should be altered
      return splitRectangle(c, targetPath, orientation);
    } else if (isPartialMatchPath(childPath, targetPath)) {
      return performAction(c, childPath, targetPath, orientation);
    } else {
      return c;
    }
  });

  return { ...node, children };
}

function performActionFromViewPort(
  viewPort: ViewPort,
  targetPath: Path,
  orientation: SplitOrientation,
): Node {
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
      if (viewPort.rootNode.type !== "rectangle") {
        throw new Error(
          `splitNodeFromRoot: targetPath '${pathToString(targetPath)}' matches the root node, but it is not a rectangle, ${viewPort.rootNode.type} instead.`,
        );
      }
      return splitRectangle(viewPort.rootNode, targetPath, orientation);
    }
  }

  // targetPath has depth > 1, so we need to search for the target node
  return performAction(
    viewPort.rootNode,
    [viewPort.rootNode.id],
    targetPath,
    orientation,
  );
}

export function layoutReducer(
  viewport: ViewPort,
  action: SplitAction,
): ViewPort {
  switch (action.type) {
    case "split":
      return {
        ...viewport,
        rootNode: performActionFromViewPort(
          viewport,
          action.targetPath,
          action.orientation,
        ),
      };
  }
}
