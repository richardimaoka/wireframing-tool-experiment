"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [split, setSplit] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "h") {
        setSplit((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!split) {
    return <div style={{ height: "100vh", backgroundColor: "#e0e0e0" }}></div>;
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "1fr 1fr",
        rowGap: "8px",
      }}
    >
      <div style={{ backgroundColor: "#e0e0e0" }}></div>
      <div style={{ backgroundColor: "#e0e0e0" }}></div>
    </div>
  );
}
