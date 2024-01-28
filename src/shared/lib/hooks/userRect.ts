// source: https://gist.github.com/morajabi/523d7a642d8c0a2f71fcfa0d8b3d2846
import React, { useLayoutEffect, useCallback, useState } from 'react';

function getRect<T extends HTMLElement>(element?: T): DOMRectReadOnly {
    let rect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: (): string => {
            return rect.toJSON();
        }
    };

    if (element) {
        rect = element.getBoundingClientRect();
    }

    return rect;
}

export default function useRect<T extends HTMLElement>(ref: React.RefObject<T>): DOMRectReadOnly {
    const [rect, setRect] = useState<DOMRectReadOnly>(ref && ref.current ? getRect(ref.current) : getRect());

    const handleResize = useCallback(() => {
        if (!ref.current) {
            return;
        }
        setRect(getRect(ref.current)); // Update client rect
    }, [ref]);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        handleResize();

        if (typeof ResizeObserver === 'function') {
            let resizeObserver: ResizeObserver | null = new ResizeObserver(() => handleResize());
            resizeObserver.observe(element);

            return () => {
                if (!resizeObserver) {
                    return;
                }
                resizeObserver.disconnect();
                resizeObserver = null;
            };
        }
        window.addEventListener('resize', handleResize); // Browser support, remove freely

        return () => window.removeEventListener('resize', handleResize);
    }, [ref, handleResize]);

    return rect;
}
