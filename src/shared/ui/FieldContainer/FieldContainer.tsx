import { cva } from 'class-variance-authority';
import React, { useCallback, useRef, useState } from 'react';

import { useRect } from '@/shared/lib/hooks/useRect';
import { ValueOf } from '@/shared/lib/types';
import { cn } from '@/shared/lib/utils';

import styles from './FieldContainer.module.css';

const FieldView = {
    OUTLINED: 'outlined',
    FILLED: 'filled',
    CLEAR: 'clear'
} as const;

export interface IFieldContainerProps {
    view?: ValueOf<typeof FieldView>;
    disabled?: boolean;
    label?: string;
    error?: string;
    isFocused?: boolean;
    isFilled?: boolean;
    className?: Parameters<typeof cn>[0];
    children: React.ReactNode;
    suffix?: React.ReactNode;
    prefix?: React.ReactNode;
    ref?: React.Ref<HTMLDivElement> | null;
    /** Cancels the default event when the container is clicked for focusing the input. */
    isPreventPointerDownEvent?: boolean;
    /** Container selector for label width calculations. Default: [data-input-container] or the 'input' itself. Useful for nested/hidden inputs. */
    inputContainerSelector?: string;
}

function isHTMLInputElement(target: EventTarget | null): target is HTMLInputElement {
    return target !== null && (target as HTMLElement).tagName === 'INPUT';
}

export const VIEWS_WITH_CLOSE_LABEL: ValueOf<typeof FieldView>[] = [FieldView.CLEAR, FieldView.FILLED];

const fieldVariants = cva(styles.field, {
    variants: {
        view: {
            [FieldView.FILLED]: styles.field_filled,
            [FieldView.OUTLINED]: styles.field_outlined,
            [FieldView.CLEAR]: styles.field_clear
        },
        isDisabled: {
            true: styles['is-disabled']
        },
        isError: {
            true: styles['is-error']
        },
        isFilled: {
            true: styles['is-filled']
        },
        isFocused: {
            true: styles['is-focused']
        }
    },
    defaultVariants: {
        view: FieldView.OUTLINED
    }
});

export const FieldContainer = ({
    view = FieldView.OUTLINED,
    label,
    error,
    disabled,
    isFocused,
    isFilled,
    className,
    children,
    suffix,
    prefix,
    ref,
    isPreventPointerDownEvent = true,
    inputContainerSelector = '[data-input-container]'
}: IFieldContainerProps) => {
    const inputsRef = useRef<HTMLInputElement[] | null>(null); // Container could contain multiple inputs (ex. datepicker)
    const [wrapperRefCallback, wrapperRect] = useRect(); // Rect of wrapper for input(s)
    const setRef = useCallback(
        (node: HTMLDivElement | null) => {
            const inputContainerNode: HTMLElement | null = node?.querySelector(inputContainerSelector) || null;
            const inputNodes = node?.querySelectorAll('input') || [];
            const wrapperNode = inputContainerNode || inputNodes[0] || null;
            wrapperRefCallback(wrapperNode);
            inputsRef.current = inputNodes.length ? [...inputNodes] : null;
        },
        [wrapperRefCallback, inputContainerSelector]
    );

    // To avoid jumps (focus/unfocus) when the field is focused and the user clicks inside the field, but outside the input
    const [isKeepFocus, setIsKeepFocus] = useState(false);
    const [delayedIsFocused, setDelayedIsFocused] = useState(false); // To avoid label overflows suffix element in moment of animation start, but it invokes additional render (CSS delay not working)

    const focusInput = ({ inputIndex }: { inputIndex: number } = { inputIndex: 0 }) => {
        inputsRef.current?.[inputIndex]?.addEventListener(
            'blur',
            () => {
                setIsKeepFocus(false);
                setTimeout(() => {
                    setDelayedIsFocused(false);
                }, 50);
            },
            { once: true }
        );
        inputsRef.current?.[inputIndex]?.focus();
        setIsKeepFocus(true);
        setTimeout(() => {
            setDelayedIsFocused(true);
        }, 100);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (disabled || !inputsRef.current) {
            return;
        }

        // To prevent lose focus from input clicking in area of container
        isPreventPointerDownEvent && !isHTMLInputElement(e.target) && e.preventDefault();

        // Focus input on click position detection (for multiple inputs inside wrapper)
        let inputIndex = 0;
        if (inputsRef.current.length > 1) {
            const maxClickPosition = wrapperRect.left + wrapperRect.width;
            const clickX = Math.min(Math.max(e.clientX, wrapperRect.left), maxClickPosition);
            const clickPosition = (clickX - wrapperRect.left) / wrapperRect.width;
            inputIndex = Math.min(Math.floor(clickPosition * inputsRef.current.length), inputsRef.current.length - 1);
        }

        focusInput({ inputIndex });
    };

    // Loose focus on prefix/suffix pointerDown event
    const handleSidePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        setIsKeepFocus(false);
        setTimeout(() => {
            setDelayedIsFocused(false);
        }, 50);
    }, []);

    /* Classes */
    const rootClass = fieldVariants({
        view,
        isDisabled: disabled,
        isError: !!error,
        isFilled: isFilled || !!prefix,
        isFocused: isFocused || isKeepFocus
    });

    return (
        <div ref={ref} className={cn(rootClass, className)}>
            <div
                ref={setRef}
                aria-hidden="true"
                className={cn(styles.field__container)}
                onPointerDown={handlePointerDown}
            >
                {view === FieldView.OUTLINED && (
                    <fieldset className={styles.field__fieldset}>
                        <legend className={styles.field__legend}>
                            {label && <span className={styles['field__legend-text']}>{label}</span>}
                        </legend>
                    </fieldset>
                )}
                {prefix && (
                    <span
                        aria-hidden="true"
                        className={cn(styles.field__side, styles.field__side_prefix, {
                            [styles.field__side_raised]:
                                VIEWS_WITH_CLOSE_LABEL.includes(view) && typeof prefix === 'string'
                        })}
                        onPointerDown={handleSidePointerDown}
                    >
                        {prefix}
                    </span>
                )}
                {children}
                {suffix && (
                    <span
                        aria-hidden="true"
                        className={cn(styles.field__side, styles.field__side_suffix, {
                            [styles.field__side_prefix_raised]:
                                VIEWS_WITH_CLOSE_LABEL.includes(view) && typeof suffix === 'string'
                        })}
                        onPointerDown={handleSidePointerDown}
                    >
                        {suffix}
                    </span>
                )}
                {label && (
                    <span
                        className={styles.field__label}
                        style={{ width: delayedIsFocused || isFilled || prefix ? 'auto' : `${wrapperRect.width}px` }}
                    >
                        {label}
                    </span>
                )}
            </div>
            {error && <div className={styles.field__error}>{error}</div>}
        </div>
    );
};
