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
    rootRef
}: IFieldContainerProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [inputRef, setInputRef] = useState<{ current: HTMLDivElement | null }>({ current: null });
    const setRef = useCallback((newNode: HTMLDivElement | null) => {
        containerRef.current = newNode;
        setInputRef({ current: newNode?.querySelector('input') || null });
    }, []);
    const inputRect = useRect(inputRef);

    // To avoid jumps (focus/unfocus) when the field is focused and the user clicks inside the field, but outside the input
    const [isKeepFocus, setIsKeepFocus] = useState(false);
    const focusInput = () => {
        inputRef.current?.addEventListener(
            'blur',
            () => {
                setIsKeepFocus(false);
            },
            { once: true }
        );
        inputRef.current?.focus();
        setIsKeepFocus(true);
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled || !inputRef.current) {
            return;
        }

        e.preventDefault();
        focusInput();
    };

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
            <div ref={setRef} aria-hidden="true" className={cn(styles.field__container)} onMouseDown={handleMouseDown}>
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
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsKeepFocus(false);
                        }}
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
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsKeepFocus(false);
                        }}
                    >
                        {suffix}
                    </span>
                )}
                {label && (
                    <span
                        className={styles.field__label}
                        style={{ width: isKeepFocus || isFilled || prefix ? 'auto' : `${inputRect.width}px` }}
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
