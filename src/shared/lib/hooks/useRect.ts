// source: https://gist.github.com/morajabi/523d7a642d8c0a2f71fcfa0d8b3d2846
import { useLayoutEffect, useCallback, useState, useRef, RefCallback } from 'react';

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
        toJSON: (): string => rect.toJSON()
    };

    if (element) {
        rect = element.getBoundingClientRect();
    }

    return rect;
}

export function useRect<T extends HTMLElement>(): [RefCallback<T>, DOMRectReadOnly] {
    const [rect, setRect] = useState<DOMRectReadOnly>(getRect());
    const observerRef = useRef<ResizeObserver | null>(null);
    const elementRef = useRef<T | null>(null);

    const refCallback = useCallback((node: T | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        if (node) {
            // Initialize ResizeObserver
            elementRef.current = node;
            observerRef.current = new ResizeObserver(() => setRect(getRect(node)));
            observerRef.current.observe(node);

            // Perform initial measurement
            setRect(getRect(node));
        } else {
            elementRef.current = null;
        }
    }, []);

    // Measure immediately after the DOM changes (before paint)
    useLayoutEffect(() => {
        if (elementRef.current) {
            setRect(getRect(elementRef.current));
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return [refCallback, rect];
}
