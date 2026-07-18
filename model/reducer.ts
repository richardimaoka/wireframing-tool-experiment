import type { Columns, Node, Path, Rectangle, Rows, ViewPort } from "./layout";

export type SplitOrientation = "rows" | "columns";

export type Action = {
  type: "split";
  path: Path;
  orientation: SplitOrientation;
};

export function isEquvalentPath(path1: Path, path2: Path): boolean {
  return (
    path1.length === path2.length &&
    path1.every((value, i) => value === path2[i])
  );
}

function isPartialMatchPath(path1: Path, path2: Path): boolean {
  // 1. Identify which Path is shorter and which is longer
  const [shorter, longer] =
    path1.length <= path2.length ? [path1, path2] : [path1, path2];

  // 2. Loop through the shorter array index-by-index
  for (let i = 0; i < shorter.length; i++) {
    const shortStr = shorter[i];
    const longStr = longer[i];

    // Check if they do NOT match each other
    if (shortStr !== longStr) {
      return false; // Break out and return false immediately on the first mismatch
    }
  }

  // If the loop finishes without hitting a mismatch, they all passed
  return true;
}

function getParentPath(path: Path): Path {
  if (path.length < 1) {
    throw new Error(`path '${pathToString(path)}' has no parent.`);
  }

  // omit the last element
  return path.slice(0, -1);
}

function pathToString(path: Path): string {
  return path.join("/");
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
  rectangle: Rectangle,
  orientation: SplitOrientation,
): Node {
  switch (orientation) {
    case "rows":
      return splitRectangleToRows(rectangle);
    case "columns":
      return splitRectangleToColumns(rectangle);
  }
}

function splitNode(
  node: Node,
  nodePath: Path,
  targetPath: Path,
  orientation: SplitOrientation,
): Node {
  console.log(
    `splitNode: nodePath='${pathToString(nodePath)}', targetPath='${pathToString(targetPath)}'`,
  );

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
      if (c.type !== "rectangle") {
        throw new Error(
          `splitNode: node search found the target node '${pathToString(targetPath)}' but it was not a rectangle, ${c.type} instead.`,
        );
      }

      return splitRectangle(c, orientation);
    } else if (isPartialMatchPath(childPath, targetPath)) {
      return splitNode(c, childPath, targetPath, orientation);
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
  console.log(
    `splitNodeFromViewPort: targetPath='${pathToString(targetPath)}', orientation='${orientation}'`,
  );
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
      return splitRectangle(viewPort.rootNode, orientation);
    }
  }

  // targetPath has depth > 1, so we need to search for the parent node of the target node

  return splitNode(
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
          action.path,
          action.orientation,
        ),
      };
  }
}
