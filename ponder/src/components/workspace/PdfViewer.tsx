import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Plus } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
    file: string | File | null;
    onAddReference?: (text: string, page: number) => void;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    onPdfLoaded?: () => void; // No longer passes extracted text
    highlightData?: { page: number; text: string } | null;
}

const PdfViewer = ({ file, onAddReference, currentPage, onPageChange, onPdfLoaded, highlightData }: PdfViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [internalPageNumber, setInternalPageNumber] = useState(1);
    const [zoom, setZoom] = useState(100);

    // Sync internal page number with prop if provided
    useEffect(() => {
        if (currentPage && currentPage !== internalPageNumber) {
            setInternalPageNumber(currentPage);
        }
    }, [currentPage, internalPageNumber]);

    // Helper to update page number (both internal and external)
    const updatePageNumber = (newPage: number) => {
        setInternalPageNumber(newPage);
        if (onPageChange) {
            onPageChange(newPage);
        }
    };

    // Selection State
    const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    async function onDocumentLoadSuccess(pdf: any) {
        setNumPages(pdf.numPages);

        // Trigger mind map generation
        // Text extraction now happens on the backend
        if (onPdfLoaded) {
            onPdfLoaded();
        }
    }

    const handlePrev = () => updatePageNumber(Math.max(1, internalPageNumber - 1));
    const handleNext = () => updatePageNumber(Math.min(numPages || 1, internalPageNumber + 1));
    const handleZoomIn = () => setZoom((z) => Math.min(200, z + 10));
    const handleZoomOut = () => setZoom((z) => Math.max(50, z - 10));

    // Handle Text Selection
    useEffect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 0 && containerRef.current?.contains(sel.anchorNode)) {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();

                setSelection({
                    text: sel.toString().trim(),
                    x: rect.left - containerRect.left + (rect.width / 2),
                    y: rect.top - containerRect.top,
                });
            } else {
                setSelection(null);
            }
        };

        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, []);

    const handleAddReference = () => {
        if (selection && onAddReference) {
            onAddReference(selection.text, internalPageNumber);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    // Custom text renderer - Reverted to simple pass-through to avoid [object Object] error
    // Highlighting is now handled by the MutationObserver in useEffect
    const customTextRenderer = useCallback((textItem: any) => {
        return textItem.str;
    }, []);

    // Auto-scroll and Highlight with MutationObserver
    useEffect(() => {
        if (!highlightData || highlightData.page !== internalPageNumber) return;

        const applyHighlight = () => {
            // Performance: Check if we actually need to highlight
            if (!highlightData?.text) return;

            const textLayer = containerRef.current?.querySelector('.react-pdf__Page__textContent');
            if (!textLayer) return;

            // Performance: Limit the search to visible area or just optimize the loop
            // For now, we'll keep the logic but ensure it doesn't run too often
            const spans = Array.from(textLayer.querySelectorAll('span'));

            // Optimization: Pre-calculate quote normalization once
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
            const quote = normalize(highlightData.text);

            if (!quote) return;

            let firstMatch: HTMLElement | null = null;

            // Optimization: Use a simple loop for better performance than forEach
            for (let i = 0; i < spans.length; i++) {
                const span = spans[i];
                const text = normalize(span.textContent || '');

                if (text.length < 3) continue;

                if (quote.includes(text) || text.includes(quote)) {
                    const el = span as HTMLElement;
                    // Only apply style if not already applied (avoid layout thrashing)
                    if (el.dataset.highlighted !== 'true') {
                        el.style.backgroundColor = '#fef08a';
                        el.style.color = '#000000';
                        el.dataset.highlighted = 'true';
                    }

                    if (!firstMatch) firstMatch = el;
                }
            }

            if (firstMatch) {
                (firstMatch as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        // Debounce the observer callback
        let timeoutId: ReturnType<typeof setTimeout>;
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' &&
                    (mutation.target as HTMLElement).classList.contains('react-pdf__Page__textContent')) {
                    shouldUpdate = true;
                    break;
                }
            }

            if (shouldUpdate) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(applyHighlight, 100); // Wait 100ms for batch updates
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current, {
                childList: true,
                subtree: true,
            });
        }

        return () => observer.disconnect();
    }, [highlightData, internalPageNumber]);

    return (
        <div className="w-[40%] border-r border-gray-200 bg-gray-100 flex flex-col h-full relative" ref={containerRef}>
            {/* Header / Toolbar */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-10">
                <span className="text-sm font-medium text-gray-600 truncate max-w-[150px]">
                    {typeof file === 'string' ? file.split('/').pop() : file?.name || 'Document'}
                </span>

                <div className="flex items-center space-x-4">
                    {/* Page Controls */}
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                        <button
                            onClick={handlePrev}
                            disabled={internalPageNumber <= 1}
                            className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-medium text-gray-600 w-12 text-center">
                            {internalPageNumber} / {numPages || '-'}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={internalPageNumber >= (numPages || 1)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-1 text-gray-400">
                        <button onClick={handleZoomOut} className="p-1 hover:text-gray-600 transition-colors">
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-xs w-8 text-center">{zoom}%</span>
                        <button onClick={handleZoomIn} className="p-1 hover:text-gray-600 transition-colors">
                            <ZoomIn size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-gray-100 relative">
                <div className="shadow-lg relative">
                    <Document
                        file={file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center h-96 w-[600px] bg-white">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        }
                        error={
                            <div className="flex items-center justify-center h-96 w-[600px] bg-white text-red-500">
                                Failed to load PDF.
                            </div>
                        }
                    >
                        <Page
                            pageNumber={internalPageNumber}
                            scale={zoom / 100}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="bg-white"
                            width={600}
                            customTextRenderer={customTextRenderer}
                        />
                    </Document>
                </div>
            </div>

            {/* Floating Tooltip for Selection */}
            {selection && (
                <button
                    onClick={handleAddReference}
                    className="absolute z-50 bg-gray-900 text-white px-3 py-1.5 rounded-full shadow-xl flex items-center space-x-2 hover:bg-black transition-all transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in duration-200"
                    style={{
                        left: selection.x,
                        top: selection.y - 10 // Offset above selection
                    }}
                >
                    <Plus size={14} />
                    <span className="text-xs font-medium">Add to Canvas</span>
                </button>
            )}
        </div>
    );
};

export default memo(PdfViewer);
