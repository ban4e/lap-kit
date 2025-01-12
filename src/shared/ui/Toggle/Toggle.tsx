import cn from 'classnames';
import React, { useId, ComponentPropsWithRef, forwardRef } from 'react';

import styles from './Toggle.module.css';

// TODO: problem with using type instead interface. See details https://github.com/jsx-eslint/eslint-plugin-react/issues/3284#issuecomment-1336610676
interface IToggleProps extends ComponentPropsWithRef<'input'> {
    type?: 'checkbox' | 'radio';
    error?: string;
    children?: React.ReactNode;
}

const ToggleField = forwardRef<HTMLInputElement, IToggleProps>(function Toggle(
    { type = 'checkbox', children, error, disabled, className, ...props },
    ref
) {
    const uniqueId = useId();

    return (
        <span
            className={cn(styles.toggle, className, {
                [styles['is-error']]: !!error,
                [styles['is-disabled']]: disabled
            })}
        >
            <span className={styles['toggle__input-container']}>
                <input
                    ref={ref}
                    className={styles.toggle__input}
                    disabled={disabled}
                    type={type}
                    {...props}
                    id={uniqueId}
                    onMouseDown={(e) => e.preventDefault()}
                />
                <span className={styles.toggle__mark}>
                    <span className={styles['toggle__mark-icon']} />
                </span>
            </span>
            {children && (
                <label className={styles.toggle__label} htmlFor={uniqueId}>
                    {children}
                </label>
            )}
            {error && <span className={styles.toggle__error}>{error}</span>}
        </span>
    );
});

export default ToggleField;
