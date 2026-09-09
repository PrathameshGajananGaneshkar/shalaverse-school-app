import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Printer, 
  Edit3, 
  Smartphone, 
  Monitor,
  Maximize2
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
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // Available container width
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [contentHeight, setContentHeight] = useState<number>(1123);
  
  // View mode: 'fit' (scale to fit mobile screen) | 'actual' (100% desktop scale with scroll) | 'custom'
  const [viewMode, setViewMode] = useState<'fit' | 'actual' | 'custom'>('fit');
  const [customZoom, setCustomZoom] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

  // Update content height after children render or tab change
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

  // Standard A4 document width in pixels (210mm at standard display DPI)
  const STANDARD_A4_WIDTH = 794;

  // Calculate fit scale: Available width & height divided by standard A4 dimensions
  const paddingOffset = isMobile ? 12 : 32;
  const availableWidth = Math.max(280, containerWidth - paddingOffset);
  const widthFitScale = availableWidth / STANDARD_A4_WIDTH;

  // Available viewport height for preview
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const availableHeight = Math.max(380, viewportHeight - 250);
  const heightFitScale = availableHeight / (contentHeight || 1123);

  // In Fit mode:
  // - On mobile (<768px): Fit to screen width so the document fits within phone screen horizontally
  // - On desktop/tablet: Fit the full certificate in view (both width and height fit so user sees the complete document)
  const fitScale = isMobile 
    ? Math.min(1, Math.max(0.32, Math.round(widthFitScale * 100) / 100))
    : Math.min(1, Math.max(0.42, Math.round(Math.min(widthFitScale, heightFitScale) * 100) / 100));

  // Current effective scale factor
  const effectiveScale = viewMode === 'fit' 
    ? fitScale
    : viewMode === 'actual' 
    ? 1 
    : customZoom;

  const isFitActive = viewMode === 'fit';
  const isActualActive = viewMode === 'actual';
  const isScaled = effectiveScale !== 1;

  const handleZoomIn = () => {
    setViewMode('custom');
    setCustomZoom(prev => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setViewMode('custom');
    setCustomZoom(prev => Math.max(0.35, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleSetFit = () => {
    setViewMode('fit');
    setCustomZoom(fitScale);
  };

  const handleSetActual = () => {
    setViewMode('actual');
    setCustomZoom(1);
  };

  const currentPercent = Math.round(effectiveScale * 100);

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
                disabled={effectiveScale <= 0.35}
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
                disabled={effectiveScale >= 1.5}
                title={lang === 'mr' ? 'आकार वाढवा (+)' : 'Zoom In'}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {(viewMode === 'custom' || (!isFitActive && !isActualActive)) && (
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
          <span className="text-[10px] text-slate-400 font-mono">
            A4 (210×297mm • {STANDARD_A4_WIDTH}px)
          </span>
        </div>
      </div>

      {/* 2. Responsive Canvas Viewport */}
      <div 
        className={`w-full bg-slate-200/70 p-1.5 sm:p-4 rounded-2xl border border-slate-300/80 shadow-inner flex justify-center print:bg-transparent print:p-0 print:border-none print:shadow-none ${
          !isScaled ? 'overflow-x-auto overflow-y-visible max-w-full pb-3' : 'overflow-x-auto overflow-y-visible max-w-full'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: isScaled && effectiveScale < 1 ? 'pan-y' : 'pan-x pan-y'
        }}
      >
        {/* Scaled Height Container */}
        <div 
          className="relative transition-all duration-150 flex justify-center"
          style={{
            width: isScaled ? `${Math.ceil(STANDARD_A4_WIDTH * effectiveScale)}px` : `${STANDARD_A4_WIDTH}px`,
            height: isScaled ? `${Math.ceil(contentHeight * effectiveScale)}px` : 'auto',
            minWidth: isScaled ? `${Math.ceil(STANDARD_A4_WIDTH * effectiveScale)}px` : `${STANDARD_A4_WIDTH}px`
          }}
        >
          {/* Scaled Transform Wrapper */}
          <div 
            style={{
              width: `${STANDARD_A4_WIDTH}px`,
              transform: effectiveScale === 1 ? 'none' : `scale(${effectiveScale})`,
              transformOrigin: 'top left',
              position: isScaled ? 'absolute' : 'relative',
              top: 0,
              left: 0
            }}
          >
            {/* The Cloned Print Target Element: Preserves #certificate-print-area */}
            <div 
              id="certificate-print-area" 
              ref={contentWrapperRef}
              className="w-[794px] bg-white print:w-full print:m-0 print:p-0"
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
