import type { Node, Path, ViewPort } from "./layout";

export type SplitOrientation = "rows" | "columns";

export type Action = { type: "split"; path: Path; orientation: SplitOrientation };

function splitNode(node: Node, path: Path, orientation: SplitOrientation): Node {
  if (path.length === 0) {
    const children = [node, { ...node }];
    return orientation === "rows"
      ? { type: "rows", gridTemplateRows: ["1fr", "1fr"], children }
      : { type: "columns", gridTemplateColumns: ["1fr", "1fr"], children };
  }

  if (node.type === "rectangle") {
    throw new Error(`path continues past a leaf rectangle: [${path}]`);
  }

  const [index, ...rest] = path;
  const children = node.children.map((child, i) =>
    i === index ? splitNode(child, rest, orientation) : child,
  );
  return { ...node, children };
}

export function layoutReducer(viewport: ViewPort, action: Action): ViewPort {
  switch (action.type) {
    case "split":
      return { ...viewport, child: splitNode(viewport.child, action.path, action.orientation) };
  }
}
