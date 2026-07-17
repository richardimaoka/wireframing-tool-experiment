export type Rectangle = {
  type: "rectangle";
  height?: string;
  width?: string;
};

export type Rows = {
  type: "rows";
  children: Rectangle[];
  //gridTemplateRows: string[]
};

export type ViewPort = {
  type: "viewport";
  height: "100vh" | "100svh" | "100lvh" | "100dvh";
  children: Rectangle[];
};

export function initialViewPorrt(): ViewPort {
  return {
    type: "viewport",
    height: "100vh",
    children: [
      {
        type: "rectangle",
      },
    ],
  };
}
