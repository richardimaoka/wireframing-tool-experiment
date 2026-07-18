export type Rectangle = {
  type: "rectangle";
  id: string;
  height?: string;
  width?: string;
};

export type Rows = {
  type: "rows";
  id: string;
  children: Node[];
  gridTemplateRows: string[];
};

export type Columns = {
  type: "columns";
  id: string;
  children: Node[];
  gridTemplateColumns: string[];
};

export type Node = Rows | Columns | Rectangle;

export type ViewPort = {
  type: "viewport";
  id: "root";
  height: "100vh" | "100svh" | "100lvh" | "100dvh";
  rootNode: Node;
};

export function initialViewPort(): ViewPort {
  return {
    type: "viewport",
    id: "root",
    height: "100vh",
    rootNode: {
      type: "rectangle",
      id: "1",
    },
  };
}

// A path is a chain of child indices from the viewport's root child down to
// a specific node, e.g. [0, 1] means "child 1 of child 0". [] refers to the
// root child itself. Paths are only valid for the tree shape they were
// computed against - see project memory on the layout tree architecture.
export type Path = string[];
