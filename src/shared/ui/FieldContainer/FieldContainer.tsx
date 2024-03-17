import classNames from 'classnames';

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
    className?: classNames.Argument;
    children: React.ReactNode;
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
    containerRef
}: IFieldContainerProps) => {
    return (
        <div
            ref={containerRef}
            className={classNames(styles.field, className, {
                [styles['is-focused']]: isFocused,
                [styles['is-filled']]: isFilled,
                [styles['is-error']]: !!error,
                [styles['is-disabled']]: disabled,
                [styles.field_filled]: view === FieldView.FILLED,
                [styles.field_outlined]: view === FieldView.OUTLINED,
                [styles.field_clear]: view === FieldView.CLEAR
            })}
        >
            <div className={classNames(styles.field__container)}>
                {view === FieldView.OUTLINED && label && (
                    <fieldset className={styles.field__fieldset}>
                        <legend className={styles.field__legend}>
                            <span className={styles['field__legend-text']}>{label}</span>
                        </legend>
                    </fieldset>
                )}
                {children}
                {label && <span className={styles.field__label}>{label}</span>}
            </div>
            {error && <div className={styles.field__error}>{error}</div>}
        </div>
    );
};

export default FieldContainer;
