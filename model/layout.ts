export type Rectangle = {
  type: "rectangle";
  height?: string;
  width?: string;
};

export type Rows = {
  type: "rows";
  children: Model[];
  gridTemplateRows: string[];
};

export type ViewPort = {
  type: "viewport";
  height: "100vh" | "100svh" | "100lvh" | "100dvh";
  children: Model;
};

export function initialViewPorrt(): ViewPort {
  return {
    type: "viewport",
    height: "100vh",
    children: {
      type: "rectangle",
    },
  };
}

type Model = Rows | Rectangle;
