import { useRef, useState, useCallback, useEffect } from 'react';

interface AutoResizeIframeProps {
    src: string;
    title: string;
    /** Design width the HTML was authored for (default 1440) */
    designWidth?: number;
}

/**
 * Renders an iframe at the original design width, then scales it down
 * to fit the card so it looks exactly like it does on the real site.
 */
export function AutoResizeIframe({ src, title, designWidth = 1440 }: AutoResizeIframeProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(400);
    const [wrapperWidth, setWrapperWidth] = useState(700);

    // Track wrapper width on mount and resize
    useEffect(() => {
        const update = () => {
            if (wrapperRef.current) {
                setWrapperWidth(wrapperRef.current.offsetWidth);
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const handleLoad = useCallback(() => {
        const iframe = wrapperRef.current?.querySelector('iframe');
        if (!iframe) return;

        const measure = () => {
            try {
                const doc = iframe.contentDocument;
                if (doc?.body) {
                    const h = Math.max(
                        doc.body.scrollHeight,
                        doc.documentElement?.scrollHeight ?? 0
                    );
                    if (h > 0) setContentHeight(h);
                }
            } catch {
                // Cross-origin — keep fallback
            }
        };

        measure();
        setTimeout(measure, 300);
        setTimeout(measure, 1000);
    }, []);

    const scale = Math.min(1, wrapperWidth / designWidth);
    const scaledHeight = contentHeight * scale;

    return (
        <div
            ref={wrapperRef}
            className="card-html-wrapper"
            style={{
                width: '100%',
                height: `${scaledHeight}px`,
                overflow: 'hidden',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                position: 'relative',
            }}
        >
            <iframe
                src={src}
                title={title}
                onLoad={handleLoad}
                scrolling="no"
                style={{
                    width: `${designWidth}px`,
                    height: `${contentHeight}px`,
                    border: 'none',
                    transformOrigin: 'top left',
                    transform: `scale(${scale})`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            />
        </div>
    );
}
