import type { ModelNode } from "./layout";
import { getParentPath, pathToString, type Path } from "./path";

export type Direction = "up" | "down" | "left" | "right";

function getNodeByPath(root: ModelNode, path: Path): ModelNode {
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

// Sibling-only navigation: moves to the adjacent child within the immediate
// parent container, only along the axis that container splits on (rows for
// up/down, columns for left/right). Returns null - a no-op - if the parent's
// orientation doesn't match the direction, or there's no sibling that way.
export function getSiblingPath(
  root: ModelNode,
  path: Path,
  direction: Direction,
): Path | null {
  if (path.length < 2) {
    return null;
  }

  const parentPath = getParentPath(path);
  const parent = getNodeByPath(root, parentPath);

  if (parent.type === "rectangle") {
    throw new Error(
      `getSiblingPath: parent '${pathToString(parentPath)}' of '${pathToString(path)}' is a rectangle leaf, not a container.`,
    );
  }

  const axisMatches =
    parent.type === "rows"
      ? direction === "up" || direction === "down"
      : direction === "left" || direction === "right";
  if (!axisMatches) {
    return null;
  }

  const currentId = path[path.length - 1];
  const currentIndex = parent.children.findIndex((c) => c.id === currentId);
  const delta = direction === "up" || direction === "left" ? -1 : 1;
  const newIndex = currentIndex + delta;

  if (newIndex < 0 || newIndex >= parent.children.length) {
    return null;
  }

  return [...parentPath, parent.children[newIndex].id];
}
