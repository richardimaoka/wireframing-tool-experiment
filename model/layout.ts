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

export type Node = Rows | Columns | Rectangle;
