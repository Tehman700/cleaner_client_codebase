import { useEffect, useRef } from 'react';

/**
 * Animated cursor: a small solid dot that tracks the pointer exactly,
 * and a larger ring that follows with smooth easing (lerp). The ring
 * expands when hovering interactive elements.
 *
 * Disabled automatically on touch devices via CSS (@media hover: none).
 */
export default function CursorEffect() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch / no-hover devices
    if (window.matchMedia('(hover: none)').matches) return;

    const dot  = dotRef.current!;
    const ring = ringRef.current!;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX  = mouseX;
    let ringY  = mouseY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
    };

    const isInteractive = (el: Element | null) =>
      !!el?.closest('button, a, input, select, .task-item, .pin-btn, .day-pill, .role-tab, .tab-btn, .card, .plot-row, .upload-zone, .modal-close, [role="button"]');

    const onOver = (e: MouseEvent) => {
      ring.classList.toggle('expanded', isInteractive(e.target as Element));
    };

    const animate = () => {
      // Lerp the ring toward the cursor for a trailing effect
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX - 22}px, ${ringY - 22}px)`;
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div id="cursor-ring" ref={ringRef} />
      <div id="cursor-dot"  ref={dotRef} />
    </>
  );
}
