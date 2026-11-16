// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Adapted from Lynx Website's BorderBeam with scoped styles and reduced motion.
// https://github.com/lynx-family/lynx-website/tree/013080ccf7344a46ffc6b28ec931504230e1e1b2/src/components/home-comps/border-beam

import { useEffect, useRef } from 'react';
import styles from './platform-tabs.module.less';

export function BorderBeam() {
  const size = 2;
  const duration = 3;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);

    function updateCanvasSize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    }

    updateCanvasSize();

    let animationFrameId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = (elapsed % duration) / duration;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Hidden containers have no drawable perimeter. Keep scheduling frames
      // so the beam resumes after ResizeObserver reports a visible size.
      if (canvas.width > 0 && canvas.height > 0) {
        drawBeam(progress);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const drawBeam = (progress: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const perimeter = 2 * (width + height);
      const beamLength = perimeter * 0.05;

      // Calculate start and end positions
      const positionStart = progress * perimeter;
      const positionEnd = (positionStart + beamLength) % perimeter;

      // Create gradient for the beam
      const gradient = createBeamGradient(positionStart, positionEnd);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = size;

      // Draw the beam along the border
      ctx.beginPath();
      drawPath(positionStart, positionEnd);
      ctx.stroke();
    };

    const createBeamGradient = (start: number, end: number) => {
      // Get coordinates for gradient
      const startCoord = getCoordinatesFromDistance(start);
      const endCoord = getCoordinatesFromDistance(end);

      const gradient = ctx.createLinearGradient(
        startCoord.x,
        startCoord.y,
        endCoord.x,
        endCoord.y,
      );

      // Updated gradient with teal head and red body that fades to transparent at the tail
      gradient.addColorStop(0, 'transparent'); // Tail starts transparent
      gradient.addColorStop(0.2, 'rgba(255, 53, 26, 0.3)'); // Red body starts faded
      gradient.addColorStop(0.5, '#ff351a'); // Full red in middle of body
      gradient.addColorStop(0.8, '#ff351a'); // Red continues
      gradient.addColorStop(0.9, '#12e5e5'); // Teal head starts (slightly longer)
      gradient.addColorStop(1, 'transparent'); // Fade to transparent at the leading edge

      return gradient;
    };

    const getCoordinatesFromDistance = (distance: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const perimeter = 2 * (width + height);

      // Normalize distance
      distance = distance % perimeter;

      // Top edge
      if (distance < width) {
        return { x: distance, y: 0 };
      } // Right edge
      else if (distance < width + height) {
        return { x: width, y: distance - width };
      } // Bottom edge
      else if (distance < 2 * width + height) {
        return { x: width - (distance - (width + height)), y: height };
      } // Left edge
      else {
        return { x: 0, y: height - (distance - (2 * width + height)) };
      }
    };

    const drawPath = (start: number, end: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const perimeter = 2 * (width + height);

      if (end < start) {
        drawPathSegment(start, perimeter);
        drawPathSegment(0, end);
      } else {
        drawPathSegment(start, end);
      }
    };

    const drawPathSegment = (start: number, end: number) => {
      let current = start;
      const currentPoint = getCoordinatesFromDistance(current);
      ctx.moveTo(currentPoint.x, currentPoint.y);

      // Draw the segment by moving at small intervals
      const step = 1;
      while (current < end) {
        current += step;
        const point = getCoordinatesFromDistance(current);
        ctx.lineTo(point.x, point.y);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [size, duration]);

  return (
    <span aria-hidden='true' ref={containerRef} className={styles.beam}>
      <canvas ref={canvasRef} />
    </span>
  );
}
