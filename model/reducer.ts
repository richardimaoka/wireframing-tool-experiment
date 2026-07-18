import {
  type Columns,
  type Node,
  type Path,
  type Rectangle,
  type Rows,
  type ViewPort,
} from "./layout";
import {
  getParentPath,
  isEquvalentPath,
  isPartialMatchPath,
  pathToString,
} from "./path";

export type SplitOrientation = "rows" | "columns";

export type Action = {
  type: "split";
  targetPath: Path;
  orientation: SplitOrientation;
};

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

function splitRectangleToRows(rectangle: Rectangle): Rows {
  return {
    type: "rows",
    id: "1",
    children: [rectangle, { ...rectangle, id: "2" }],
    gridTemplateRows: ["1fr", "1fr"],
  };
}

function splitRectangleToColumns(rectangle: Rectangle): Columns {
  return {
    type: "columns",
    id: "1",
    children: [rectangle, { ...rectangle, id: "2" }],
    gridTemplateColumns: ["1fr", "1fr"],
  };
}

function splitRectangle(
  target: Node,
  targetPath: Path,
  orientation: SplitOrientation,
): Node {
  if (target.type !== "rectangle") {
    throw new Error(
      `splitNode: node search found the target node '${pathToString(targetPath)}' but it was not a rectangle, ${c.type} instead.`,
    );
  }

  switch (orientation) {
    case "rows":
      return splitRectangleToRows(target);
    case "columns":
      return splitRectangleToColumns(target);
  }
}

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

function splitNodeFromViewPort(
  viewPort: ViewPort,
  targetPath: Path,
  orientation: SplitOrientation,
): Node {
  if (targetPath.length < 1) {
    throw new Error(
      `splitNodeFromRoot: targetPath '${pathToString(targetPath)}' is invalid - it must have at least one element.`,
    );
  }

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

  // targetPath has depth > 1, so we need to search for the parent node of the target node

  return performAction(
    viewPort.rootNode,
    [viewPort.rootNode.id],
    targetPath,
    orientation,
  );
}

export function layoutReducer(viewport: ViewPort, action: Action): ViewPort {
  switch (action.type) {
    case "split":
      return {
        ...viewport,
        rootNode: splitNodeFromViewPort(
          viewport,
          action.targetPath,
          action.orientation,
        ),
      };
  }
}
