import type { Path } from "./layout";

export function pathToString(path: Path): string {
  return path.join("/");
}

export function getParentPath(path: Path): Path {
  if (path.length < 1) {
    throw new Error(`path '${pathToString(path)}' has no parent.`);
  }

  // omit the last element
  return path.slice(0, -1);
}

export function isPartialMatchPath(path1: Path, path2: Path): boolean {
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

export function isEquvalentPath(path1: Path, path2: Path): boolean {
  return (
    path1.length === path2.length &&
    path1.every((value, i) => value === path2[i])
  );
}
