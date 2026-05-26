"use client";

import { useEffect } from "react";

export default function ImagePreloader() {
  useEffect(() => {
    const img = new Image();
    img.src = "/images/login-bg.png";
  }, []);

  return <img src="/images/penguin.png" alt="" style={{ display: "none" }} />;
}
