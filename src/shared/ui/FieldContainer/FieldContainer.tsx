import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';

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

const VIEWS_WITH_CLOSE_LABEL: ValueOf<typeof FieldView>[] = [FieldView.OUTLINED, FieldView.FILLED];

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

    const focusInput = () => {
        if (!disabled && containerRef && !isFocused) {
            containerRef?.current?.querySelector('input')?.focus();
        }
    };

    // To avoid jumps (focus/unfocus) when the field is focused and the user clicks inside the field, but outside the input
    const [isKeepFocus, setIsKeepFocus] = useState(false);
    useEffect(() => {
        if (isFocused) {
            setIsKeepFocus(true);
            const handleClickOutside = (e: MouseEvent) => {
                if (!containerRef.current?.contains(e.target as Node)) {
                    setIsKeepFocus(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isFocused]);

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
            <div ref={containerRef} aria-hidden="true" className={cn(styles.field__container)} onClick={focusInput}>
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
                {label && <span className={styles.field__label}>{label}</span>}
            </div>
            {error && <div className={styles.field__error}>{error}</div>}
        </div>
    );
};

export default FieldContainer;
