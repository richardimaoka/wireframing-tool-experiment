import type { Node } from "./layout";
import { getParentPath, pathToString, type Path } from "./path";

export type Direction = "up" | "down" | "left" | "right";

function getNodeByPath(root: Node, path: Path): Node {
  if (path.length < 1 || path[0] !== root.id) {
    throw new Error(
      `getNodeByPath: path '${pathToString(path)}' does not start at the root node '${root.id}'.`,
    );
  }

  let node = root;
  for (let i = 1; i < path.length; i++) {
    if (node.type === "rectangle") {
      throw new Error(
        `getNodeByPath: path '${pathToString(path)}' descends into a rectangle leaf at '${pathToString(path.slice(0, i))}'.`,
      );
    }

    const child = node.children.find((c) => c.id === path[i]);
    if (!child) {
      throw new Error(
        `getNodeByPath: no child '${path[i]}' found under '${pathToString(path.slice(0, i))}'.`,
      );
    }
    node = child;
  }

  return node;
}

// Descends from `path` via each node's first child until it reaches a
// rectangle leaf, e.g. landing in a freshly-entered sibling subtree.
function getFirstLeafPath(root: Node, path: Path): Path {
  let node = getNodeByPath(root, path);
  let result = path;

  while (node.type !== "rectangle") {
    const firstChild = node.children[0];
    result = [...result, firstChild.id];
    node = firstChild;
  }

  return result;
}

// Tree-bubbling (i3-style) navigation: tries to move to the adjacent child
// within the immediate parent container, along the axis that container
// splits on (rows for up/down, columns for left/right). If the parent's
// orientation doesn't match, or there's no sibling that way, bubbles up to
// the grandparent and retries there. Once a sibling is found, descends into
// its first leaf rectangle. Returns null - a no-op - if bubbling reaches the
// root without finding a matching sibling.
export function getDirectionalTarget(
  root: Node,
  path: Path,
  direction: Direction,
): Path | null {
  let current = path;

  while (current.length >= 2) {
    const parentPath = getParentPath(current);
    const parent = getNodeByPath(root, parentPath);

    if (parent.type === "rectangle") {
      throw new Error(
        `getDirectionalTarget: parent '${pathToString(parentPath)}' of '${pathToString(current)}' is a rectangle leaf, not a container.`,
      );
    }

    const axisMatches =
      parent.type === "rows"
        ? direction === "up" || direction === "down"
        : direction === "left" || direction === "right";

    if (axisMatches) {
      const currentId = current[current.length - 1];
      const currentIndex = parent.children.findIndex(
        (c) => c.id === currentId,
      );
      const delta = direction === "up" || direction === "left" ? -1 : 1;
      const newIndex = currentIndex + delta;

      if (newIndex >= 0 && newIndex < parent.children.length) {
        const landingPath = [...parentPath, parent.children[newIndex].id];
        return getFirstLeafPath(root, landingPath);
      }
    }

    current = parentPath;
  }

  return null;
}
