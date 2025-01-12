import React, { useState, useMemo, useCallback, createRef } from 'react';

interface IPulseItem {
    id: number;
    x?: number;
    y?: number;
    style: {
        width: number;
        top: number;
        left: number;
    };
    nodeRef: React.RefObject<unknown>;
}

export default function usePulse(rect: DOMRectReadOnly) {
    const [pulseItems, setPulseItems] = useState<Array<IPulseItem>>([]);
    const pulseClick = useCallback(
        (e: React.MouseEvent | React.KeyboardEvent): void => {
            setPulseItems([
                ...pulseItems,
                {
                    id: new Date().getTime(),
                    x: 'clientX' in e ? e.clientX : undefined,
                    y: 'clientY' in e ? e.clientY : undefined,
                    style: { width: 0, top: 0, left: 0 },
                    nodeRef: createRef()
                }
            ]);
        },
        [pulseItems]
    );

    /* Pulse animation */
    const handlePulseEnter = useCallback(
        (index: number): void => {
            const pulseItem = [...pulseItems][index];
            const sideWidth = Math.min(rect.width, rect.height);
            const updatedPulseItems = [...pulseItems];
            updatedPulseItems.splice(index, 1, {
                ...pulseItem,
                style: {
                    width: sideWidth,
                    top: (pulseItems[index].y || rect.top + rect.height / 2) - rect.top - sideWidth / 2,
                    left: (pulseItems[index].x || rect.left + rect.width / 2) - rect.left - sideWidth / 2
                }
            });
            setPulseItems(updatedPulseItems);
        },
        [pulseItems, rect]
    );
    const handlePulseEntered = useCallback(
        (index: number): void => {
            const updatedPulseItems = [...pulseItems];
            updatedPulseItems.splice(index, 1);
            setPulseItems(updatedPulseItems);
        },
        [pulseItems]
    );
    /* Pulse animation end */

    return useMemo(
        () => ({
            pulseItems,
            pulseClick,
            handlePulseEnter,
            handlePulseEntered
        }),
        [pulseItems, pulseClick, handlePulseEnter, handlePulseEntered]
    );
}
