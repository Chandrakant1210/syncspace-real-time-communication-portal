import { useEffect, useRef, useState } from "react";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import socket from "../services/socket";

const CANVAS_HEIGHT = 500;

function Whiteboard({ roomId }) {
    const containerRef = useRef(null);
    const stageRef = useRef(null);

    const [canvasWidth, setCanvasWidth] = useState(900);

    const [tool, setTool] = useState("pencil");
    const [color, setColor] = useState("#111827");
    const [brushSize, setBrushSize] = useState(3);

    const [objects, setObjects] = useState(() => {
        try {
            if (!roomId) return [];

            const storageKey = `syncspace-whiteboard-${roomId}`;
            const saved = localStorage.getItem(storageKey);

            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isDrawing, setIsDrawing] = useState(false);

    const [cursor, setCursor] = useState({
        visible: false,
        x: 0,
        y: 0,
    });

    /* ---------------------------------------------------------- */
    /* Save whiteboard locally for this room                       */
    /* ---------------------------------------------------------- */

    useEffect(() => {
        if (!roomId) return;

        const storageKey = `syncspace-whiteboard-${roomId}`;

        localStorage.setItem(
            storageKey,
            JSON.stringify(objects)
        );
    }, [objects, roomId]);

    /* ---------------------------------------------------------- */
    /* Whiteboard Socket.IO                                        */
    /* ---------------------------------------------------------- */

    useEffect(() => {
        if (!roomId) return;

        const handleWhiteboardState = (data) => {
            if (!data?.roomId) return;

            if (String(data.roomId) !== String(roomId)) {
                return;
            }

            setObjects(
                Array.isArray(data.strokes)
                    ? data.strokes
                    : []
            );
        };

        const handleWhiteboardDraw = (data) => {
            if (!data?.roomId || !data?.stroke) {
                return;
            }

            if (String(data.roomId) !== String(roomId)) {
                return;
            }

            setObjects((currentObjects) => {
                const existingIndex = currentObjects.findIndex(
                    (object) =>
                        String(object.id) === String(data.stroke.id)
                );

                // Stroke already exists:
                // replace it with the latest version.
                if (existingIndex !== -1) {
                    const updatedObjects = [...currentObjects];

                    updatedObjects[existingIndex] = data.stroke;

                    return updatedObjects;
                }

                // New stroke.
                return [
                    ...currentObjects,
                    data.stroke,
                ];
            });
        };
        const handleWhiteboardErase = (data) => {
            if (!data?.roomId || !data?.strokeId) {
                return;
            }

            if (String(data.roomId) !== String(roomId)) {
                return;
            }

            setObjects((currentObjects) =>
                currentObjects.filter(
                    (object) =>
                        String(object.id) !== String(data.strokeId)
                )
            );
        };

        const handleWhiteboardClear = (data) => {
            if (!data?.roomId) return;

            if (String(data.roomId) !== String(roomId)) {
                return;
            }

            setObjects([]);
        };

        socket.on(
            "whiteboard:state",
            handleWhiteboardState
        );

        socket.on(
            "whiteboard:draw",
            handleWhiteboardDraw
        );

        socket.on(
            "whiteboard:clear",
            handleWhiteboardClear
        );
        socket.on(
            "whiteboard:erase",
            handleWhiteboardErase
        );


        // Ask backend for the current room whiteboard.
        socket.emit("whiteboard:join", {
            roomId,
        });

        return () => {
            socket.off(
                "whiteboard:state",
                handleWhiteboardState
            );

            socket.off(
                "whiteboard:draw",
                handleWhiteboardDraw
            );

            socket.off(
                "whiteboard:clear",
                handleWhiteboardClear
            );

            socket.off(
                "whiteboard:erase",
                handleWhiteboardErase
            );
        };
    }, [roomId]);

    /* ---------------------------------------------------------- */
    /* Responsive canvas width                                     */
    /* ---------------------------------------------------------- */

    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            const width =
                containerRef.current.clientWidth;

            if (width > 0) {
                setCanvasWidth(width);
            }
        };

        updateSize();

        const observer = new ResizeObserver(
            updateSize
        );

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    /* ---------------------------------------------------------- */
    /* Pointer position                                            */
    /* ---------------------------------------------------------- */

    const getPointerPosition = () => {
        const stage = stageRef.current;

        if (!stage) return null;

        return stage.getPointerPosition();
    };

    /* ---------------------------------------------------------- */
    /* Pointer enter                                               */
    /* ---------------------------------------------------------- */

    const handlePointerEnter = () => {
        setCursor((current) => ({
            ...current,
            visible: true,
        }));
    };

    /* ---------------------------------------------------------- */
    /* Pointer leave                                               */
    /* ---------------------------------------------------------- */

    const handlePointerLeave = () => {
        setCursor((current) => ({
            ...current,
            visible: false,
        }));

        if (isDrawing) {
            setIsDrawing(false);
        }
    };

    /* ---------------------------------------------------------- */
    /* Pointer move                                                */
    /* ---------------------------------------------------------- */

    const handlePointerMove = () => {
        const position = getPointerPosition();

        if (!position) return;

        setCursor({
            visible: true,
            x: position.x,
            y: position.y,
        });

        if (!isDrawing) return;

        setObjects((currentObjects) => {
            if (currentObjects.length === 0) {
                return currentObjects;
            }

            const lastObject =
                currentObjects[currentObjects.length - 1];

            let updatedObject = null;

            // Pencil / Eraser
            if (
                lastObject.type === "line" &&
                (lastObject.tool === "pencil" ||
                    lastObject.tool === "eraser")
            ) {
                updatedObject = {
                    ...lastObject,
                    points: [
                        ...lastObject.points,
                        position.x,
                        position.y,
                    ],
                };
            }

            // Rectangle
            else if (lastObject.type === "rect") {
                updatedObject = {
                    ...lastObject,
                    width: position.x - lastObject.x,
                    height: position.y - lastObject.y,
                };
            }

            // Circle
            else if (lastObject.type === "circle") {
                const radius = Math.sqrt(
                    Math.pow(
                        position.x - lastObject.x,
                        2
                    ) +
                    Math.pow(
                        position.y - lastObject.y,
                        2
                    )
                );

                updatedObject = {
                    ...lastObject,
                    radius,
                };
            }

            // Straight line
            else if (
                lastObject.type === "line-shape"
            ) {
                updatedObject = {
                    ...lastObject,
                    points: [
                        lastObject.points[0],
                        lastObject.points[1],
                        position.x,
                        position.y,
                    ],
                };
            }

            if (!updatedObject) {
                return currentObjects;
            }

            // Send the current drawing state to other users.
            if (roomId) {
                socket.emit("whiteboard:draw", {
                    roomId,
                    stroke: updatedObject,
                });
            }

            return [
                ...currentObjects.slice(0, -1),
                updatedObject,
            ];
        });
    };

    /* ---------------------------------------------------------- */
    /* Pointer down                                                */
    /* ---------------------------------------------------------- */

    const handlePointerDown = () => {
        const position = getPointerPosition();

        if (!position) return;

        setIsDrawing(true);

        /* ---------------- Pencil ---------------- */

        if (tool === "pencil") {
            setObjects((currentObjects) => [
                ...currentObjects,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: "line",
                    tool: "pencil",
                    points: [
                        position.x,
                        position.y,
                    ],
                    stroke: color,
                    strokeWidth: brushSize,
                },
            ]);

            return;
        }

        /* ---------------- Eraser ---------------- */

        if (tool === "eraser") {
            setObjects((currentObjects) => [
                ...currentObjects,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: "line",
                    tool: "eraser",
                    points: [
                        position.x,
                        position.y,
                    ],
                    strokeWidth: brushSize * 3,
                },
            ]);

            return;
        }

        /* ---------------- Rectangle ---------------- */

        if (tool === "rectangle") {
            setObjects((currentObjects) => [
                ...currentObjects,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: "rect",
                    x: position.x,
                    y: position.y,
                    width: 0,
                    height: 0,
                    stroke: color,
                    strokeWidth: brushSize,
                },
            ]);

            return;
        }

        /* ---------------- Circle ---------------- */

        if (tool === "circle") {
            setObjects((currentObjects) => [
                ...currentObjects,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: "circle",
                    x: position.x,
                    y: position.y,
                    radius: 0,
                    stroke: color,
                    strokeWidth: brushSize,
                },
            ]);

            return;
        }

        /* ---------------- Straight line ---------------- */

        if (tool === "line") {
            setObjects((currentObjects) => [
                ...currentObjects,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    type: "line-shape",
                    points: [
                        position.x,
                        position.y,
                        position.x,
                        position.y,
                    ],
                    stroke: color,
                    strokeWidth: brushSize,
                    lineCap: "round",
                },
            ]);
        }
    };

    /* ---------------------------------------------------------- */
    /* Pointer up                                                  */
    /* ---------------------------------------------------------- */

    const handlePointerUp = () => {
        setIsDrawing(false);

        if (!roomId || !stageRef.current) {
            return;
        }

        const stage = stageRef.current;
        const position = stage.getPointerPosition();

        if (!position) {
            return;
        }

        const currentObjects = objects;

        if (currentObjects.length === 0) {
            return;
        }

        const lastObject =
            currentObjects[currentObjects.length - 1];

        if (!lastObject) {
            return;
        }

        socket.emit("whiteboard:draw", {
            roomId,
            stroke: lastObject,
        });
    };

    /* ---------------------------------------------------------- */
    /* Undo                                                        */
    /* ---------------------------------------------------------- */

    const undo = () => {
        if (!roomId || objects.length === 0) {
            return;
        }

        const lastObject =
            objects[objects.length - 1];

        if (!lastObject?.id) {
            return;
        }

        socket.emit("whiteboard:erase", {
            roomId,
            strokeId: lastObject.id,
        });
    };

    /* ---------------------------------------------------------- */
    /* Clear                                                       */
    /* ---------------------------------------------------------- */

    const clearCanvas = () => {
        if (!roomId) return;

        socket.emit("whiteboard:clear", {
            roomId,
        });
    };

    /* ---------------------------------------------------------- */
    /* Render objects                                              */
    /* ---------------------------------------------------------- */

    const renderObject = (object) => {
        if (object.type === "line") {
            return (
                <Line
                    key={object.id}
                    points={object.points}
                    stroke={
                        object.tool === "eraser"
                            ? "#ffffff"
                            : object.stroke
                    }
                    strokeWidth={object.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.5}
                    globalCompositeOperation={
                        object.tool === "eraser"
                            ? "destination-out"
                            : "source-over"
                    }
                />
            );
        }

        if (object.type === "rect") {
            return (
                <Rect
                    key={object.id}
                    x={object.x}
                    y={object.y}
                    width={object.width}
                    height={object.height}
                    stroke={object.stroke}
                    strokeWidth={object.strokeWidth}
                />
            );
        }

        if (object.type === "circle") {
            return (
                <Circle
                    key={object.id}
                    x={object.x}
                    y={object.y}
                    radius={object.radius}
                    stroke={object.stroke}
                    strokeWidth={object.strokeWidth}
                />
            );
        }

        if (object.type === "line-shape") {
            return (
                <Line
                    key={object.id}
                    points={object.points}
                    stroke={object.stroke}
                    strokeWidth={object.strokeWidth}
                    lineCap="round"
                />
            );
        }

        return null;
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">

                {/* Tools */}
                <div className="flex flex-wrap items-center gap-2">

                    <button
                        type="button"
                        onClick={() => setTool("pencil")}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${tool === "pencil"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200"
                            }`}
                    >
                        ✏️ Pencil
                    </button>

                    <button
                        type="button"
                        onClick={() => setTool("eraser")}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${tool === "eraser"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200"
                            }`}
                    >
                        🧹 Eraser
                    </button>

                    <button
                        type="button"
                        onClick={() => setTool("line")}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${tool === "line"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200"
                            }`}
                    >
                        ╱ Line
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setTool("rectangle")
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${tool === "rectangle"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200"
                            }`}
                    >
                        ▭ Rectangle
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setTool("circle")
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${tool === "circle"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200"
                            }`}
                    >
                        ○ Circle
                    </button>
                </div>

                {/* Color */}
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    Color

                    <input
                        type="color"
                        value={color}
                        onChange={(event) =>
                            setColor(event.target.value)
                        }
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-1"
                    />
                </label>

                {/* Brush size */}
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    Size

                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={brushSize}
                        onChange={(event) =>
                            setBrushSize(
                                Number(event.target.value)
                            )
                        }
                    />

                    <span className="w-6 text-center">
                        {brushSize}
                    </span>
                </label>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2">

                    <button
                        type="button"
                        onClick={undo}
                        disabled={objects.length === 0}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        ↩ Undo
                    </button>

                    <button
                        type="button"
                        onClick={clearCanvas}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                        🗑 Clear
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden bg-white"
            >
                <Stage
                    ref={stageRef}
                    width={canvasWidth}
                    height={CANVAS_HEIGHT}
                    onPointerEnter={
                        handlePointerEnter
                    }
                    onPointerLeave={
                        handlePointerLeave
                    }
                    onPointerDown={
                        handlePointerDown
                    }
                    onPointerMove={
                        handlePointerMove
                    }
                    onPointerUp={
                        handlePointerUp
                    }
                >
                    <Layer>

                        {objects.map(renderObject)}

                        {/* Visible cursor */}
                        {cursor.visible && (
                            <Circle
                                x={cursor.x}
                                y={cursor.y}
                                radius={Math.max(
                                    4,
                                    brushSize / 2
                                )}
                                stroke="#000000"
                                strokeWidth={1.5}
                                fill="transparent"
                                listening={false}
                            />
                        )}

                    </Layer>
                </Stage>
            </div>
        </div>
    );
}

export default Whiteboard;