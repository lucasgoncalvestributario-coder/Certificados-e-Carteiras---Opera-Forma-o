import React, { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Move, Check } from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onClose: () => void;
}

export default function ImageCropperModal({
  imageSrc,
  onCrop,
  onClose,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset states when source changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageSrc]);

  // Mouse / Touch Dragging Handlers
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = {
      x: clientX - pan.x,
      y: clientY - pan.y,
    };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPan({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Perform Crop on Canvas
  const handleConfirm = () => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const canvas = document.createElement("canvas");
    canvas.width = 480; // High quality 3x4 aspect ratio width
    canvas.height = 640; // High quality 3x4 aspect ratio height
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill white background just in case
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const W = container.clientWidth;
    const H = container.clientHeight;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let bw = 480;
    let bh = 640;

    if (imgAspect > 0.75) {
      // Wider than 3:4
      bh = 640;
      bw = 640 * imgAspect;
    } else {
      // Taller than 3:4
      bw = 480;
      bh = 480 / imgAspect;
    }

    const dw = bw * zoom;
    const dh = bh * zoom;

    const dx = (480 - dw) / 2 + pan.x * (480 / W);
    const dy = (640 - dh) / 2 + pan.y * (640 / H);

    ctx.drawImage(img, dx, dy, dw, dh);
    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCrop(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-primary px-6 py-4 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-accent/20 rounded-lg text-brand-accent">
              <Move className="w-4 h-4" />
            </span>
            <h3 className="text-white font-black text-sm uppercase tracking-wide">
              Ajustar e Recortar Foto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-300 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace */}
        <div className="p-6 bg-zinc-50 flex flex-col items-center justify-center flex-1 overflow-y-auto">
          <p className="text-xs text-zinc-500 mb-4 font-semibold text-center uppercase tracking-wide">
            Arraste para mover e use o controle deslizante para dar zoom
          </p>

          {/* Crop Bounding Box Container */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
            className="w-[240px] h-[320px] aspect-[3/4] bg-zinc-950 rounded-xl border-4 border-brand-accent relative overflow-hidden shadow-xl select-none cursor-grab active:cursor-grabbing"
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="To Crop"
              draggable="false"
              className="absolute pointer-events-none select-none max-w-none origin-center"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center",
              }}
            />
            {/* Soft grid lines to help centering */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div></div>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full mt-6 space-y-4">
            <div className="flex items-center gap-4 bg-zinc-100 p-3 rounded-xl border border-zinc-200">
              <button
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors"
                title="Menos zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="1"
                max="4"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-brand-accent h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() => setZoom(Math.min(4, zoom + 0.1))}
                className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors"
                title="Mais zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-zinc-500 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="hover:text-brand-accent font-bold uppercase tracking-wider transition-colors"
              >
                Redefinir Ajustes
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-100 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-zinc-700 hover:bg-zinc-50 rounded-xl border border-zinc-200 text-sm font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-brand-accent text-white hover:bg-brand-accent-hover rounded-xl text-sm font-black transition-all flex items-center gap-1.5 shadow-md shadow-brand-accent/20"
          >
            <Check className="w-4 h-4" /> Confirmar Recorte
          </button>
        </div>
      </div>
    </div>
  );
}
