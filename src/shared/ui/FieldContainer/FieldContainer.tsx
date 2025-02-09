import cn from 'classnames';
import React, { useCallback, useRef, useState } from 'react';

import useRect from '@/shared/lib/hooks/useRect';
import { ValueOf } from '@/shared/lib/types';

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
    className?: cn.Argument;
    children: React.ReactNode;
    suffix?: React.ReactNode;
    prefix?: React.ReactNode;
    rootRef?: React.Ref<HTMLDivElement> | null;
    /** Cancels the default event when the container is clicked for focusing the input. */
    isPreventPointerDownEvent?: boolean;
}

export const VIEWS_WITH_CLOSE_LABEL: ValueOf<typeof FieldView>[] = [FieldView.CLEAR, FieldView.FILLED];

const FieldContainer = ({
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
    rootRef,
    isPreventPointerDownEvent = true
}: IFieldContainerProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [inputRefCallback, inputRect] = useRect();
    const setRef = useCallback(
        (node: HTMLDivElement | null) => {
            const inputNode = node?.querySelector('input') || null;
            inputRefCallback(inputNode);
            inputRef.current = inputNode;
        },
        [inputRefCallback]
    );

    // To avoid jumps (focus/unfocus) when the field is focused and the user clicks inside the field, but outside the input
    const [isKeepFocus, setIsKeepFocus] = useState(false);
    const [delayedIsFocused, setDelayedIsFocused] = useState(false); // To avoid label overflows suffix element in moment of animation start, but it invokes additional render (CSS delay not working)
    const focusInput = () => {
        inputRef.current?.addEventListener(
            'blur',
            () => {
                setIsKeepFocus(false);
                setTimeout(() => {
                    setDelayedIsFocused(false);
                }, 50);
            },
            { once: true }
        );
        inputRef.current?.focus();
        setIsKeepFocus(true);
        setTimeout(() => {
            setDelayedIsFocused(true);
        }, 100);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (disabled || !inputRef.current) {
            return;
        }

        // To prevent lose focus from input clicking in area of container
        isPreventPointerDownEvent && e.target !== inputRef.current && e.preventDefault();
        focusInput();
    };

    // Loose focus on prefix/suffix pointerDown event
    const handleSidePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        setIsKeepFocus(false);
        setTimeout(() => {
            setDelayedIsFocused(false);
        }, 50);
    }, []);

    return (
        <div
            ref={rootRef}
            className={cn(styles.field, className, {
                [styles['is-focused']]: isFocused || isKeepFocus,
                [styles['is-filled']]: isFilled || prefix,
                [styles['is-error']]: !!error,
                [styles['is-disabled']]: disabled,
                [styles.field_filled]: view === FieldView.FILLED,
                [styles.field_outlined]: view === FieldView.OUTLINED,
                [styles.field_clear]: view === FieldView.CLEAR
            })}
        >
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
                            'translate-y-[5px]': VIEWS_WITH_CLOSE_LABEL.includes(view) && typeof prefix === 'string'
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
                            'translate-y-[5px]': VIEWS_WITH_CLOSE_LABEL.includes(view) && typeof suffix === 'string'
                        })}
                        onPointerDown={handleSidePointerDown}
                    >
                        {suffix}
                    </span>
                )}
                {label && (
                    <span
                        className={styles.field__label}
                        style={{ width: delayedIsFocused || isFilled || prefix ? 'auto' : `${inputRect.width}px` }}
                    >
                        {label}
                    </span>
                )}
            </div>
            {error && <div className={styles.field__error}>{error}</div>}
        </div>
    );
};

export default FieldContainer;
