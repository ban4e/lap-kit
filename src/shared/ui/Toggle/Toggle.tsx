import cn from 'classnames';
import React, { useId } from 'react';

import styles from './Toggle.module.css';

// TODO: problem with using type instead interface. See details https://github.com/jsx-eslint/eslint-plugin-react/issues/3284#issuecomment-1336610676
interface IToggleProps extends React.ComponentPropsWithRef<'input'> {
    type?: 'checkbox' | 'radio';
    children?: React.ReactNode;
}

const ToggleField = React.forwardRef<HTMLInputElement, IToggleProps>(function Toggle(
    { type = 'checkbox', children, className, ...props },
    ref
) {
    const uniqueId = useId();

    return (
        <span className={cn(styles.toggle, className)}>
            <span className={styles['toggle__input-container']}>
                <input
                    ref={ref}
                    className={styles.toggle__input}
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
        </span>
    );
});

export default ToggleField;
