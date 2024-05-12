import cn from 'classnames';

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
    containerRef?: React.Ref<HTMLDivElement> | null;
}

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
    containerRef
}: IFieldContainerProps) => {
    return (
        <div
            ref={containerRef}
            className={cn(styles.field, className, {
                [styles['is-focused']]: isFocused,
                [styles['is-filled']]: isFilled || prefix,
                [styles['is-error']]: !!error,
                [styles['is-disabled']]: disabled,
                [styles.field_filled]: view === FieldView.FILLED,
                [styles.field_outlined]: view === FieldView.OUTLINED,
                [styles.field_clear]: view === FieldView.CLEAR
            })}
        >
            <div className={cn(styles.field__container)}>
                {view === FieldView.OUTLINED && (
                    <fieldset className={styles.field__fieldset}>
                        <legend className={styles.field__legend}>
                            {label && <span className={styles['field__legend-text']}>{label}</span>}
                        </legend>
                    </fieldset>
                )}
                {prefix && (
                    <span className={cn(styles['field-side'], styles.field__side, styles.field__side_prefix)}>
                        {prefix}
                    </span>
                )}
                {suffix && (
                    <span className={cn(styles['field-side'], styles.field__side, styles.field__side_suffix)}>
                        {suffix}
                    </span>
                )}
                {children}
                {label && <span className={styles.field__label}>{label}</span>}
            </div>
            {error && <div className={styles.field__error}>{error}</div>}
        </div>
    );
};

export default FieldContainer;
