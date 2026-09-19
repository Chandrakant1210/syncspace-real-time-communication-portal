import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Two-pane layout with a draggable divider between `left` and `right`.
 *
 * Stacks vertically (normal spacing, no divider) below the `xl` breakpoint,
 * since a drag handle only makes sense once there's real horizontal room —
 * matches the breakpoint the rest of the room workspace already switches on.
 *
 * Widths are kept as a percentage in state so both panes resize together;
 * neither pane is allowed to shrink past `minPercent` so one side can't be
 * dragged down to nothing.
 */
function ResizableSplit({ left, right, minPercent = 25, defaultPercent = 50 }) {
  const containerRef = useRef(null);
  const [leftPercent, setLeftPercent] = useState(defaultPercent);
  const [isWide, setIsWide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track the xl breakpoint in JS too, so the drag handle only renders (and
  // only listens for mouse events) when the side-by-side layout is active.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const handlePointerMove = useCallback(
    (event) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const rawPercent = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(
        100 - minPercent,
        Math.max(minPercent, rawPercent)
      );

      setLeftPercent(clamped);
    },
    [minPercent]
  );

  const stopDragging = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isDragging) return undefined;

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", stopDragging);
    // Prevents text/canvas selection while dragging across the page.
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", stopDragging);
      document.body.style.userSelect = "";
    };
  }, [isDragging, handlePointerMove, stopDragging]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-5 xl:flex-row xl:items-stretch xl:gap-0"
    >
      <div
        style={isWide ? { flexBasis: `${leftPercent}%` } : undefined}
        className="min-w-0 xl:shrink-0"
      >
        {left}
      </div>

      {/* Divider — only interactive at the xl breakpoint where panes sit side by side. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize whiteboard and code editor"
        onMouseDown={() => isWide && setIsDragging(true)}
        className={`hidden shrink-0 xl:mx-2.5 xl:block xl:w-1.5 xl:cursor-col-resize xl:rounded-full xl:transition-colors ${
          isDragging ? "xl:bg-indigo-300" : "xl:bg-slate-200 xl:hover:bg-indigo-200"
        }`}
      />

      <div
        style={isWide ? { flexBasis: `${100 - leftPercent}%` } : undefined}
        className="min-w-0 xl:shrink-0"
      >
        {right}
      </div>
    </div>
  );
}

export default ResizableSplit;