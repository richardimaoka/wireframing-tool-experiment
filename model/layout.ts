export type Rectangle = {
  type: "rectangle";
  id: string;
  height?: number;
  width?: number;
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

export function initialRows(): Rows {
  return {
    type: "rows",
    id: "root",
    children: [
      {
        type: "rectangle",
        id: "1",
      },
    ],
    gridTemplateRows: ["1fr"],
  };
}

export function initialColumns(): Columns {
  return {
    type: "columns",
    id: "root",
    children: [
      {
        type: "rectangle",
        id: "1",
      },
    ],
    gridTemplateColumns: ["1fr"],
  };
}
export type ContainerNode = Rows | Columns;

export type ModelNode = ContainerNode | Rectangle;
