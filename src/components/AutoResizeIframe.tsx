import { useRef, useCallback } from 'react';

interface AutoResizeIframeProps {
    src: string;
    title: string;
}

/**
 * An iframe that auto-resizes its height to match the loaded content,
 * so design mockups render at their full natural size.
 */
export function AutoResizeIframe({ src, title }: AutoResizeIframeProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleLoad = useCallback(() => {
        const iframe = wrapperRef.current?.querySelector('iframe');
        if (!iframe) return;

        const resize = () => {
            try {
                const doc = iframe.contentDocument;
                if (doc?.body) {
                    const h = Math.max(
                        doc.body.scrollHeight,
                        doc.documentElement?.scrollHeight ?? 0
                    );
                    if (h > 0 && wrapperRef.current) {
                        wrapperRef.current.style.height = `${h}px`;
                    }
                }
            } catch {
                // Cross-origin — keep the fallback min-height
            }
        };

        // Resize immediately, then again after images / fonts settle
        resize();
        setTimeout(resize, 300);
        setTimeout(resize, 1000);
    }, []);

    return (
        <div
            ref={wrapperRef}
            className="card-html-wrapper"
            style={{
                width: '100%',
                minHeight: '200px',
                overflow: 'hidden',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
        >
            <iframe
                src={src}
                title={title}
                onLoad={handleLoad}
                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                scrolling="no"
            />
        </div>
    );
}
