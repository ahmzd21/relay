'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, Participant, DataPacket_Kind } from 'livekit-client';

type Point = { x: number; y: number };

type ElementType = 'path' | 'text' | 'shape';
export type ToolType = 'select' | 'pen' | 'marker' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'diamond' | 'triangle' | 'line';

interface BaseElement {
  id: string;
  type: ElementType;
  color: string;
}

interface PathElement extends BaseElement {
  type: 'path';
  tool: 'pen' | 'marker' | 'eraser';
  points: Point[];
}

interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'diamond' | 'triangle' | 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

type BoardElement = PathElement | TextElement | ShapeElement;

const COLORS = [
  '#ffffff', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}

function ActionButton({ onClick, title, icon, active, disabled }: ActionButtonProps) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-2 rounded-md transition-colors flex items-center justify-center
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}
        ${active ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300'}
      `}
    >
      {icon}
    </button>
  );
}

export function Whiteboard({ onClose }: { onClose: () => void }) {
  const room = useRoomContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#ef4444'); 
  const [elements, setElements] = useState<BoardElement[]>([]);
  
  // Text Tool State
  const [activeText, setActiveText] = useState<{ x: number; y: number; val: string } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  
  const currentElementRef = useRef<BoardElement | null>(null);
  const dragInfoRef = useRef<{ elementId: string, startPt: Point, initialEl: BoardElement } | null>(null);
  
  const elementsRef = useRef<BoardElement[]>([]);
  const undoStackRef = useRef<BoardElement[][]>([]);
  const redoStackRef = useRef<BoardElement[][]>([]);

  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveHistory = useCallback(() => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(elementsRef.current)));
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    elementsRef.current.forEach((el) => {
      ctx.globalCompositeOperation = 'source-over';
      
      if (el.type === 'path') {
        if (el.points.length === 0) return;
        ctx.beginPath();
        
        if (el.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = 30;
          ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else if (el.tool === 'marker') {
          ctx.lineWidth = 16;
          ctx.strokeStyle = el.color + '80'; // 50% opacity for marker
        } else {
          ctx.lineWidth = 4;
          ctx.strokeStyle = el.color;
        }
        
        const first = el.points[0];
        ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
        for (let i = 1; i < el.points.length; i++) {
          const p = el.points[i];
          ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
        }
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.font = `${el.fontSize}px sans-serif`;
        ctx.fillStyle = el.color;
        ctx.textBaseline = 'top';
        ctx.fillText(el.text, el.x * canvas.width, el.y * canvas.height);
      } else if (el.type === 'shape') {
        ctx.beginPath();
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 4;
        const px = el.startX * canvas.width;
        const py = el.startY * canvas.height;
        const ex = el.endX * canvas.width;
        const ey = el.endY * canvas.height;
        
        if (el.shapeType === 'rectangle') {
          ctx.rect(px, py, ex - px, ey - py);
        } else if (el.shapeType === 'circle') {
          const radius = Math.sqrt(Math.pow(ex - px, 2) + Math.pow(ey - py, 2));
          ctx.arc(px, py, radius, 0, Math.PI * 2);
        } else if (el.shapeType === 'line') {
          ctx.moveTo(px, py);
          ctx.lineTo(ex, ey);
        } else if (el.shapeType === 'triangle') {
          ctx.moveTo(px + (ex - px) / 2, py);
          ctx.lineTo(ex, ey);
          ctx.lineTo(px, ey);
          ctx.closePath();
        } else if (el.shapeType === 'diamond') {
          ctx.moveTo(px + (ex - px) / 2, py);
          ctx.lineTo(ex, py + (ey - py) / 2);
          ctx.lineTo(px + (ex - px) / 2, ey);
          ctx.lineTo(px, py + (ey - py) / 2);
          ctx.closePath();
        }
        ctx.stroke();
      }
    });
  }, []);

  const sendData = useCallback((data: Record<string, unknown>) => {
    try {
      const payload = new TextEncoder().encode(JSON.stringify(data));
      room.localParticipant.publishData(payload, { reliable: true, topic: 'whiteboard' });
    } catch (e) {
      console.warn('Failed to send whiteboard data', e);
    }
  }, [room]);

  useEffect(() => {
    elementsRef.current = elements;
    redraw();
  }, [elements, redraw]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, _participant?: Participant, _kind?: DataPacket_Kind, topic?: string) => {
      if (topic !== 'whiteboard') return;
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'add_element') {
          setElements((prev) => [...prev, data.element]);
        } else if (data.type === 'add_points') {
          setElements((prev) => {
            const newElems = [...prev];
            const idx = newElems.findIndex((e) => e.id === data.elementId && e.type === 'path');
            if (idx >= 0) {
              const el = newElems[idx] as PathElement;
              newElems[idx] = { ...el, points: [...el.points, ...data.points] };
            }
            return newElems;
          });
        } else if (data.type === 'update_element') {
          setElements((prev) => {
            const newElems = [...prev];
            const idx = newElems.findIndex((e) => e.id === data.element.id);
            if (idx >= 0) {
              newElems[idx] = data.element;
            }
            return newElems;
          });
        } else if (data.type === 'clear') {
          setElements([]);
        } else if (data.type === 'request_state') {
          if (elementsRef.current.length > 0) {
            setTimeout(() => {
              sendData({ type: 'full_state', elements: elementsRef.current });
            }, Math.random() * 200);
          }
        } else if (data.type === 'full_state') {
          setElements(data.elements);
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    sendData({ type: 'request_state' });
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, sendData]);

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current && containerRef.current) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) tempCtx.drawImage(canvasRef.current, 0, 0);

        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        redraw();
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [redraw]);

  // Focus input automatically
  useEffect(() => {
    if (activeText && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [activeText]);

  const getPoint = (e: React.PointerEvent | React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const commitText = () => {
    if (activeText && activeText.val.trim().length > 0) {
      saveHistory();
      const newText: TextElement = {
        id: Math.random().toString(36).substring(2),
        type: 'text',
        color,
        text: activeText.val,
        x: activeText.x,
        y: activeText.y,
        fontSize: 24,
      };
      setElements((prev) => [...prev, newText]);
      sendData({ type: 'add_element', element: newText });
    }
    setActiveText(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeText) {
      commitText();
    }

    const pt = getPoint(e);
    
    if (tool === 'text') {
      setActiveText({ x: pt.x, y: pt.y, val: '' });
      return;
    }
    
    if (tool === 'select') {
      let hitElement: BoardElement | null = null;
      for (let i = elementsRef.current.length - 1; i >= 0; i--) {
        const el = elementsRef.current[i];
        if (el.type === 'shape') {
           const pad = 15 / canvasRef.current!.width;
           const minX = Math.min(el.startX, el.endX) - pad;
           const maxX = Math.max(el.startX, el.endX) + pad;
           const minY = Math.min(el.startY, el.endY) - pad;
           const maxY = Math.max(el.startY, el.endY) + pad;
           if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) {
              hitElement = el;
              break;
           }
        } else if (el.type === 'text') {
           const canvas = canvasRef.current;
           if (canvas) {
             const charW = 14 / canvas.width;
             const charH = 28 / canvas.height;
             const textW = el.text.length * charW;
             const pad = 10 / canvas.width;
             if (pt.x >= el.x - pad && pt.x <= el.x + textW + pad && pt.y >= el.y - pad && pt.y <= el.y + charH + pad) {
                hitElement = el;
                break;
             }
           }
        }
      }
      if (hitElement) {
        saveHistory();
        dragInfoRef.current = { elementId: hitElement.id, startPt: pt, initialEl: JSON.parse(JSON.stringify(hitElement)) };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    saveHistory();
    const id = Math.random().toString(36).substring(2);

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      const newPath: PathElement = { id, type: 'path', color, tool, points: [pt] };
      currentElementRef.current = newPath;
      setElements((prev) => [...prev, newPath]);
      sendData({ type: 'add_element', element: newPath });
    } else {
      const newShape: ShapeElement = {
        id, type: 'shape', shapeType: tool as ShapeElement['shapeType'], color,
        startX: pt.x, startY: pt.y, endX: pt.x, endY: pt.y,
      };
      currentElementRef.current = newShape;
      setElements((prev) => [...prev, newShape]);
      sendData({ type: 'add_element', element: newShape });
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = getPoint(e);
    
    if (tool === 'select' && dragInfoRef.current) {
       const dx = pt.x - dragInfoRef.current.startPt.x;
       const dy = pt.y - dragInfoRef.current.startPt.y;
       const el = elementsRef.current.find(el => el.id === dragInfoRef.current!.elementId);
       if (!el) return;
       
       if (el.type === 'shape') {
          const orig = dragInfoRef.current.initialEl as ShapeElement;
          el.startX = orig.startX + dx;
          el.startY = orig.startY + dy;
          el.endX = orig.endX + dx;
          el.endY = orig.endY + dy;
       } else if (el.type === 'text') {
          const orig = dragInfoRef.current.initialEl as TextElement;
          el.x = orig.x + dx;
          el.y = orig.y + dy;
       }
       redraw();
       sendData({ type: 'update_element', element: el });
       return;
    }
    
    if (!currentElementRef.current) return;
    
    if (currentElementRef.current.type === 'path') {
      currentElementRef.current.points.push(pt);
      redraw();
      sendData({ type: 'add_points', elementId: currentElementRef.current.id, points: [pt] });
    } else if (currentElementRef.current.type === 'shape') {
      currentElementRef.current.endX = pt.x;
      currentElementRef.current.endY = pt.y;
      redraw();
      sendData({ type: 'update_element', element: currentElementRef.current });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragInfoRef.current) {
      setElements([...elementsRef.current]);
      dragInfoRef.current = null;
    }
    if (currentElementRef.current) {
      setElements([...elementsRef.current]);
      currentElementRef.current = null;
    }
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const clearBoard = () => {
    saveHistory();
    setElements([]);
    sendData({ type: 'clear' });
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) return;
    redoStackRef.current.push(JSON.parse(JSON.stringify(elementsRef.current)));
    const prev = undoStackRef.current.pop()!;
    setElements(prev);
    sendData({ type: 'full_state', elements: prev });
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    undoStackRef.current.push(JSON.parse(JSON.stringify(elementsRef.current)));
    const next = redoStackRef.current.pop()!;
    setElements(next);
    sendData({ type: 'full_state', elements: next });
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  };

  const exportToPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas to draw with a white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `whiteboard-${new Date().toISOString()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
      <div className="w-full h-full max-w-7xl bg-white rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center p-3 bg-[#111116] border-b border-white/10 gap-2 flex-wrap select-none">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">R</div>
            <span className="font-semibold text-white hidden sm:block">Whiteboard</span>
          </div>
          
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            <ActionButton
              title="Pointer (Drag)"
              active={tool === 'select'}
              onClick={() => setTool('select')}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M14 10.5V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M18 11a6 6 0 0 1-6 6 6 6 0 0 1-6-6v-5.5a2.5 2.5 0 0 1 5 0V11" />
                </svg>
              )}
            />
            <ActionButton
              title="Pen"
              active={tool === 'pen'}
              onClick={() => setTool('pen')}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              )}
            />
            <ActionButton
              title="Marker"
              active={tool === 'marker'}
              onClick={() => setTool('marker')}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 11-6 6v3h9l3-3" />
                  <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
                </svg>
              )}
            />
            <ActionButton
              title="Eraser"
              active={tool === 'eraser'}
              onClick={() => setTool('eraser')}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                  <path d="M22 21H7" />
                  <path d="m5 11 9 9" />
                </svg>
              )}
            />
            <ActionButton
              title="Text"
              active={tool === 'text'}
              onClick={() => setTool('text')}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" x2="15" y1="20" y2="20" />
                  <line x1="12" x2="12" y1="4" y2="20" />
                </svg>
              )}
            />
            
            <div className="relative">
              <button 
                title="Shapes" 
                className={`p-2 rounded-md transition-colors flex items-center justify-center gap-1
                  hover:bg-white/10
                  ${['rectangle', 'circle', 'diamond', 'triangle', 'line'].includes(tool) ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300'}
                `}
                onClick={() => setShowShapeMenu(!showShapeMenu)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="10" height="10" rx="1" />
                  <circle cx="15" cy="15" r="6" />
                </svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              
              {showShapeMenu && (
                <div className="absolute top-full left-0 mt-2 bg-[#1c1c24] border border-white/10 rounded-lg p-2 flex flex-col gap-1 z-50 shadow-xl min-w-[120px]">
                  {['rectangle', 'circle', 'diamond', 'triangle', 'line'].map(shape => (
                    <button
                      key={shape}
                      className={`px-3 py-2 text-left rounded-md text-sm capitalize transition-colors
                        ${tool === shape ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300 hover:bg-white/5'}
                      `}
                      onClick={() => {
                        setTool(shape as ToolType);
                        setShowShapeMenu(false);
                      }}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block" />

          {/* Color Palette */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser' || tool === 'select') setTool('pen');
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            <ActionButton
              title="Undo"
              disabled={!canUndo}
              onClick={handleUndo}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              )}
            />
            <ActionButton
              title="Redo"
              disabled={!canRedo}
              onClick={handleRedo}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>
              )}
            />
          </div>
          
          <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              title="Export to PNG"
              onClick={exportToPng}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button
              title="Clear Board"
              onClick={clearBoard}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
            
            <button
              title="Close"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors ml-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 relative bg-white overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            className="block w-full h-full touch-none"
            style={{
              cursor: tool === 'select' ? 'default' : tool === 'eraser' ? 'crosshair' : tool === 'text' ? 'text' : 'crosshair',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          
          {activeText && (
            <textarea
              ref={textInputRef}
              value={activeText.val}
              onChange={(e) => setActiveText({ ...activeText, val: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitText();
                } else if (e.key === 'Escape') {
                  setActiveText(null);
                }
              }}
              placeholder="Type here..."
              style={{
                position: 'absolute',
                left: `${activeText.x * 100}%`,
                top: `${activeText.y * 100}%`,
                color: color,
                fontSize: '24px',
                fontFamily: 'sans-serif',
                background: 'rgba(255,255,255,0.9)',
                border: '2px dashed #6366f1',
                outline: 'none',
                padding: '8px',
                margin: 0,
                minWidth: 'min(200px, 80vw)',
                minHeight: '40px',
                resize: 'both',
                overflow: 'hidden',
                zIndex: 50,
                pointerEvents: 'auto',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
