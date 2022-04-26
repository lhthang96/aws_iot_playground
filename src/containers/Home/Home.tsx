import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { iif, of, retry, switchMapTo, throwError, timer } from "rxjs";
import { Scene, PerspectiveCamera, WebGLRenderer } from "three";
import { StyledHome } from "./Home.styles";

export const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useMemo(() => new Scene(), []);
  const camera = useMemo(
    () => new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000),
    []
  );
  const renderer = useMemo(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new WebGLRenderer({});
    renderer.setSize(width, height);
    console.log({ width, height });

    return renderer;
  }, []);

  useEffect(() => {
    if (!renderer) return;

    of(undefined)
      .pipe(
        switchMapTo(
          timer(500).pipe(
            switchMapTo(iif(() => !!canvas.current, of(true), throwError("Canvas is not ready"))),
            retry()
          )
        )
      )
      .subscribe({
        next: () => {
          if (canvas.current) {
            renderer.domElement = canvas.current;
          }
          setLoading(false);
        },
      });
  }, [renderer]);

  return (
    <StyledHome>
      {loading && <span>Loading...</span>}
      <canvas ref={canvas} className="three-canvas" />
    </StyledHome>
  );
};
