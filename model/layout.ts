export type Rectangle = {
  type: "rectangle";
  id: string;
  height?: string;
  width?: string;
};

export type Rows = {
  type: "rows";
  id: string;
  children: ModelNode[];
  gridTemplateRows: string[];
};

export type Columns = {
  type: "columns";
  id: string;
  children: ModelNode[];
  gridTemplateColumns: string[];
};

export type ViewPort = {
  type: "viewport";
  id: "root";
  height: "100vh" | "100svh" | "100lvh" | "100dvh";
  rootNode: ModelNode;
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

export type ModelNode = Rows | Columns | Rectangle;
