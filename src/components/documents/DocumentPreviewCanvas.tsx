import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Printer, 
  Edit3, 
  Smartphone, 
  Monitor,
  Maximize2,
  Hand,
  Move
} from 'lucide-react';

interface DocumentPreviewCanvasProps {
  children: React.ReactNode;
  lang?: 'en' | 'mr';
  documentTitle?: string;
  onPrint: () => void;
  onEdit: () => void;
}

export function DocumentPreviewCanvas({
  children,
  lang = 'mr',
  documentTitle = 'दस्तावेज (Certificate)',
  onPrint,
  onEdit
}: DocumentPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // Standard A4 document dimensions in pixels (210mm x 297mm at 96 DPI)
  const STANDARD_A4_WIDTH = 794;
  const STANDARD_A4_HEIGHT = 1123;

  // Layout measurements
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [contentHeight, setContentHeight] = useState<number>(STANDARD_A4_HEIGHT);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // View mode and scale/pan state
  const [viewMode, setViewMode] = useState<'fit' | 'actual' | 'custom'>('fit');
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  // Synchronous refs for smooth 60fps touch gesture handling
  const scaleRef = useRef<number>(scale);
  const panRef = useRef<{ x: number; y: number }>(pan);
  const fitScaleRef = useRef<number>(1);
  
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // Touch gesture state ref
  const gestureRef = useRef<{
    startDistance: number;
    startScale: number;
    startPan: { x: number; y: number };
    startMidpoint: { x: number; y: number };
    startTouch: { x: number; y: number };
    isPinching: boolean;
    isPanning: boolean;
    lastTapTime: number;
    lastTapPos: { x: number; y: number };
  }>({
    startDistance: 0,
    startScale: 1,
    startPan: { x: 0, y: 0 },
    startMidpoint: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
    isPinching: false,
    isPanning: false,
    lastTapTime: 0,
    lastTapPos: { x: 0, y: 0 }
  });

  // Measure container and content dimensions
  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
        setIsMobile(width < 768);
      }
      if (contentWrapperRef.current) {
        const height = contentWrapperRef.current.offsetHeight;
        if (height > 100) {
          setContentHeight(height);
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentWrapperRef.current) {
      resizeObserver.observe(contentWrapperRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Update content height when child document re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentWrapperRef.current) {
        const height = contentWrapperRef.current.offsetHeight;
        if (height > 100) {
          setContentHeight(height);
        }
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [children]);

  // Calculate fit scale: document scaled to fit nicely on current device
  const paddingOffset = isMobile ? 12 : 32;
  const availableWidth = Math.max(280, containerWidth - paddingOffset);
  const widthFitScale = availableWidth / STANDARD_A4_WIDTH;

  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const availableHeight = Math.max(380, viewportHeight - 250);
  const heightFitScale = availableHeight / (contentHeight || STANDARD_A4_HEIGHT);

  const fitScale = isMobile 
    ? Math.min(1, Math.max(0.32, Math.round(widthFitScale * 100) / 100))
    : Math.min(1, Math.max(0.42, Math.round(Math.min(widthFitScale, heightFitScale) * 100) / 100));

  fitScaleRef.current = fitScale;

  // Initialize or update scale when viewMode or fitScale changes
  useEffect(() => {
    if (viewMode === 'fit') {
      setScale(fitScale);
      setPan({ x: 0, y: 0 });
    } else if (viewMode === 'actual') {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [fitScale, viewMode]);

  // Helper to clamp pan boundaries so document doesn't drift completely out of view
  const clampPan = useCallback((targetScale: number, targetPan: { x: number; y: number }) => {
    const curFitScale = fitScaleRef.current;
    if (targetScale <= curFitScale * 1.05) {
      return { x: 0, y: 0 };
    }

    const scaledW = STANDARD_A4_WIDTH * targetScale;
    const scaledH = (contentHeight || STANDARD_A4_HEIGHT) * targetScale;
    const viewW = viewportRef.current?.clientWidth || containerWidth;
    const viewH = viewportRef.current?.clientHeight || 600;

    const maxPanX = Math.max(0, (scaledW - viewW) / 2 + 50);
    const maxPanY = Math.max(0, (scaledH - viewH) / 2 + 50);

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, targetPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, targetPan.y))
    };
  }, [containerWidth, contentHeight]);

  // Finalize gesture physics after pinch or pan ends
  const finalizeTransform = useCallback(() => {
    const curFit = fitScaleRef.current;
    let finalScale = scaleRef.current;
    let finalPan = { ...panRef.current };

    if (finalScale < curFit * 0.95 || Math.abs(finalScale - curFit) < 0.04) {
      // Snap back cleanly to fit
      finalScale = curFit;
      finalPan = { x: 0, y: 0 };
      setViewMode('fit');
    } else {
      finalPan = clampPan(finalScale, finalPan);
    }

    scaleRef.current = finalScale;
    panRef.current = finalPan;
    setScale(finalScale);
    setPan(finalPan);
  }, [clampPan]);

  // Handle double tap (Mobile finger gesture: zoom in to 1.7x or reset to fit)
  const handleDoubleTap = useCallback((clientX: number, clientY: number, containerRect: DOMRect) => {
    setIsInteracting(false);
    const curFit = fitScaleRef.current;
    
    if (scaleRef.current > curFit * 1.15) {
      // Already zoomed in -> Reset back to fit!
      setViewMode('fit');
      setScale(curFit);
      setPan({ x: 0, y: 0 });
      scaleRef.current = curFit;
      panRef.current = { x: 0, y: 0 };
    } else {
      // Double tapped -> Zoom in to ~1.7x centered on tap position
      const targetScale = Math.min(2.5, Math.max(1.6, Math.round(curFit * 2.2 * 10) / 10));
      const tapOffsetX = clientX - (containerRect.left + containerRect.width / 2);
      const tapOffsetY = clientY - (containerRect.top + containerRect.height / 2);

      const targetPan = clampPan(targetScale, {
        x: -tapOffsetX * 0.9,
        y: -tapOffsetY * 0.9
      });

      setViewMode('custom');
      setScale(targetScale);
      setPan(targetPan);
      scaleRef.current = targetScale;
      panRef.current = targetPan;
    }
  }, [clampPan]);

  // Touch Event Listeners on Viewport for Natural Mobile Finger Pinch-to-Zoom and Pan
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const onTouchStart = (e: TouchEvent) => {
      const rect = element.getBoundingClientRect();
      const now = Date.now();

      if (e.touches.length === 2) {
        // Multi-touch: 2 fingers -> Pinch to zoom start!
        e.preventDefault();
        setIsInteracting(true);
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const mid = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top
        };

        gestureRef.current.isPinching = true;
        gestureRef.current.isPanning = false;
        gestureRef.current.startDistance = dist;
        gestureRef.current.startMidpoint = mid;
        gestureRef.current.startScale = scaleRef.current;
        gestureRef.current.startPan = { ...panRef.current };
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        // Double tap detection
        const timeDiff = now - gestureRef.current.lastTapTime;
        const distDiff = Math.hypot(
          touchX - gestureRef.current.lastTapPos.x,
          touchY - gestureRef.current.lastTapPos.y
        );

        if (timeDiff < 320 && distDiff < 35) {
          // Double Tap Triggered!
          e.preventDefault();
          handleDoubleTap(touchX, touchY, rect);
          gestureRef.current.lastTapTime = 0;
          return;
        }

        gestureRef.current.lastTapTime = now;
        gestureRef.current.lastTapPos = { x: touchX, y: touchY };

        // If zoomed in (> fitScale + 0.05), enable single finger pan across certificate
        if (scaleRef.current > fitScaleRef.current * 1.05) {
          gestureRef.current.isPanning = true;
          gestureRef.current.isPinching = false;
          gestureRef.current.startTouch = { x: touchX, y: touchY };
          gestureRef.current.startPan = { ...panRef.current };
          setIsInteracting(true);
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const rect = element.getBoundingClientRect();

      if (e.touches.length === 2 && gestureRef.current.isPinching) {
        // Active Pinch Gesture with 2 fingers
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        if (gestureRef.current.startDistance > 0) {
          const scaleRatio = dist / gestureRef.current.startDistance;
          const curFit = fitScaleRef.current;
          const minScale = Math.min(curFit * 0.7, 0.3);
          const maxScale = 3.5;
          const targetScale = Math.min(maxScale, Math.max(minScale, gestureRef.current.startScale * scaleRatio));

          const curMid = {
            x: (t1.clientX + t2.clientX) / 2 - rect.left,
            y: (t1.clientY + t2.clientY) / 2 - rect.top
          };
          const dx = curMid.x - gestureRef.current.startMidpoint.x;
          const dy = curMid.y - gestureRef.current.startMidpoint.y;

          const targetPan = {
            x: gestureRef.current.startPan.x + dx,
            y: gestureRef.current.startPan.y + dy
          };

          scaleRef.current = targetScale;
          panRef.current = targetPan;
          setScale(targetScale);
          setPan(targetPan);
          setViewMode('custom');
        }
      } else if (e.touches.length === 1 && gestureRef.current.isPanning) {
        // Single finger pan when document is zoomed in
        if (scaleRef.current > fitScaleRef.current * 1.05) {
          e.preventDefault(); // Prevent full page vertical scrolling while panning zoomed certificate
          const touch = e.touches[0];
          const dx = touch.clientX - gestureRef.current.startTouch.x;
          const dy = touch.clientY - gestureRef.current.startTouch.y;

          const targetPan = {
            x: gestureRef.current.startPan.x + dx,
            y: gestureRef.current.startPan.y + dy
          };

          panRef.current = targetPan;
          setPan(targetPan);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (gestureRef.current.isPinching || gestureRef.current.isPanning) {
        setIsInteracting(false);
        gestureRef.current.isPinching = false;
        gestureRef.current.isPanning = false;
        finalizeTransform();
      }
    };

    const onTouchCancel = () => {
      setIsInteracting(false);
      gestureRef.current.isPinching = false;
      gestureRef.current.isPanning = false;
      finalizeTransform();
    };

    element.addEventListener('touchstart', onTouchStart, { passive: false });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchcancel', onTouchCancel);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [finalizeTransform, handleDoubleTap]);

  // Desktop Mouse Drag to Pan when Zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > fitScale * 1.05 && e.button === 0) {
      setIsInteracting(true);
      gestureRef.current.isPanning = true;
      gestureRef.current.startTouch = { x: e.clientX, y: e.clientY };
      gestureRef.current.startPan = { ...pan };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gestureRef.current.isPanning && scale > fitScale * 1.05) {
      const dx = e.clientX - gestureRef.current.startTouch.x;
      const dy = e.clientY - gestureRef.current.startTouch.y;
      const targetPan = {
        x: gestureRef.current.startPan.x + dx,
        y: gestureRef.current.startPan.y + dy
      };
      panRef.current = targetPan;
      setPan(targetPan);
    }
  };

  const handleMouseUp = () => {
    if (gestureRef.current.isPanning) {
      setIsInteracting(false);
      gestureRef.current.isPanning = false;
      finalizeTransform();
    }
  };

  // Button Zoom Handlers
  const handleZoomIn = () => {
    setViewMode('custom');
    const newScale = Math.min(3.5, Math.round((scale + 0.15) * 100) / 100);
    setScale(newScale);
    scaleRef.current = newScale;
  };

  const handleZoomOut = () => {
    setViewMode('custom');
    const curFit = fitScaleRef.current;
    const newScale = Math.max(Math.min(curFit * 0.8, 0.35), Math.round((scale - 0.15) * 100) / 100);
    if (newScale <= curFit * 1.02) {
      setScale(curFit);
      setPan({ x: 0, y: 0 });
      setViewMode('fit');
    } else {
      setScale(newScale);
      scaleRef.current = newScale;
      setPan(prev => clampPan(newScale, prev));
    }
  };

  const handleSetFit = () => {
    setViewMode('fit');
    setScale(fitScale);
    setPan({ x: 0, y: 0 });
    scaleRef.current = fitScale;
    panRef.current = { x: 0, y: 0 };
  };

  const handleSetActual = () => {
    setViewMode('actual');
    setScale(1);
    setPan({ x: 0, y: 0 });
    scaleRef.current = 1;
    panRef.current = { x: 0, y: 0 };
  };

  const isFitActive = viewMode === 'fit' || Math.abs(scale - fitScale) < 0.03;
  const isActualActive = viewMode === 'actual' || Math.abs(scale - 1) < 0.03;
  const isZoomed = scale > fitScale * 1.05;
  const currentPercent = Math.round(scale * 100);

  // Fitted container height
  const fittedVisualHeight = Math.ceil((contentHeight || STANDARD_A4_HEIGHT) * fitScale);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {/* 1. Mobile & Desktop Document Canvas Control Bar (Hidden in Print) */}
      <div className="w-full bg-slate-900 text-white rounded-xl p-2.5 sm:p-3 mb-3 shadow-md border border-slate-800 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Left: View Mode Toggle & Zoom Controls */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* View Mode Buttons */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                id="doc-view-fit-btn"
                onClick={handleSetFit}
                title={lang === 'mr' ? 'स्क्रीनवर पूर्ण दाखला बसवा (Fit to Screen)' : 'Fit Document to Screen'}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[36px] ${
                  isFitActive 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {isMobile ? <Smartphone className="w-3.5 h-3.5 shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{lang === 'mr' ? 'ऑटो फिट' : 'Fit'}</span>
              </button>

              <button
                type="button"
                id="doc-view-actual-btn"
                onClick={handleSetActual}
                title={lang === 'mr' ? 'मूळ १००% आकार (100% Actual Size)' : '100% Actual Size'}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[36px] ${
                  isActualActive
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'mr' ? '१००% मूळ' : '100%'}</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 px-1 py-0.5 rounded-lg border border-slate-700 gap-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.3}
                title={lang === 'mr' ? 'आकार कमी करा (-)' : 'Zoom Out'}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-mono font-bold px-1 text-slate-200 min-w-[38px] text-center">
                {currentPercent}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3.5}
                title={lang === 'mr' ? 'आकार वाढवा (+)' : 'Zoom In'}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {(!isFitActive || isZoomed) && (
                <button
                  type="button"
                  onClick={handleSetFit}
                  title={lang === 'mr' ? 'रीसेट करा' : 'Reset View'}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

          </div>

          {/* Right: Quick Action Buttons (Edit, Download 1-Page PDF, & Print) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'बदल करा' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              title={lang === 'mr' ? 'प्रिंटर किंवा Save as PDF (१ पेज)' : 'Print or Save as PDF (1 Page)'}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'प्रिंट / Print' : 'Print'}</span>
            </button>
          </div>

        </div>

        {/* View Mode Description & Helper Bar */}
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isFitActive ? 'bg-blue-400' : isActualActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>
              {isFitActive 
                ? (lang === 'mr' ? 'दाखला स्क्रीनवर पूर्ण बसवला आहे (ऑटो फिट)' : 'Certificate fitted to screen view')
                : isActualActive
                ? (lang === 'mr' ? 'मूळ १००% A4 आकार (प्रिंट साईज)' : '100% Original A4 Print Size')
                : (lang === 'mr' ? `कस्टम झूम: ${currentPercent}%` : `Custom Zoom: ${currentPercent}%`)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            A4 (210×297mm • {STANDARD_A4_WIDTH}px)
          </span>
        </div>
      </div>

      {/* Mobile Gesture Helper Banner (Shown on mobile devices) */}
      <div className="w-full sm:hidden flex items-center justify-between px-3 py-1.5 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl text-blue-900 text-xs shadow-2xs print:hidden">
        <div className="flex items-center gap-1.5 font-medium truncate">
          <span className="text-base shrink-0">👆</span>
          <span className="truncate">
            {lang === 'mr' 
              ? 'दोन बोटांनी पिंच झूम (Pinch) करा किंवा डबल टॅप करा' 
              : 'Pinch with 2 fingers to zoom or double-tap'}
          </span>
        </div>
        {isZoomed && (
          <button
            type="button"
            onClick={handleSetFit}
            className="shrink-0 ml-2 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{lang === 'mr' ? 'मूळ आकार' : 'Reset'}</span>
          </button>
        )}
      </div>

      {/* 2. Responsive Canvas Viewport with Touch Gesture (Pinch & Pan) Support */}
      <div 
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full bg-slate-200/70 p-1.5 sm:p-4 rounded-2xl border border-slate-300/80 shadow-inner flex justify-center items-start overflow-hidden relative select-none print:bg-transparent print:p-0 print:border-none print:shadow-none ${
          isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        style={{
          touchAction: isZoomed ? 'none' : 'pan-y',
          minHeight: isMobile ? '460px' : '560px',
          height: isMobile ? Math.min(Math.max(480, fittedVisualHeight + 24), 720) : 'auto'
        }}
      >
        {/* Floating Quick Reset Button on Mobile when zoomed */}
        {isZoomed && (
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 print:hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={handleSetFit}
              className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-950 text-white rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700/80 backdrop-blur-md active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'mr' ? `मूळ आकार (${currentPercent}%)` : `Reset (${currentPercent}%)`}</span>
            </button>
          </div>
        )}

        {/* Scaled & Panned Document Element */}
        <div 
          style={{
            width: `${STANDARD_A4_WIDTH}px`,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            transformOrigin: 'top center',
            transition: isInteracting ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
            position: 'relative'
          }}
        >
          {/* The Cloned Print Target Element: Preserves #certificate-print-area */}
          <div 
            id="certificate-print-area" 
            ref={contentWrapperRef}
            className="w-[794px] bg-white print:w-full print:m-0 print:p-0 shadow-lg"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
