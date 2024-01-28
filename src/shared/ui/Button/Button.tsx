import classNames from 'classnames';
import React, { useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import usePulse from '@/shared/lib/hooks/usePulse';
import useRect from '@/shared/lib/hooks/userRect';
import { ValueOf } from '@/shared/lib/types';

import styles from './Button.module.css';

export const THEMES = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SUCCESS: 'success',
    DANGER: 'danger'
} as const;

type ButtonTheme = ValueOf<typeof THEMES>;

interface IBaseProps {
    children: React.ReactNode;
    withPulse?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
    theme?: ButtonTheme;
    onClick?: (e: React.MouseEvent) => void;
}

interface IButtonProps extends IBaseProps, Omit<React.ComponentProps<'button'>, keyof IBaseProps> {
    tag?: 'button';
}

interface IAnchorProps extends IBaseProps, Omit<React.ComponentProps<'a'>, keyof IBaseProps> {
    tag?: 'a';
}

type IButtonOverload = {
    (props: IButtonProps): React.JSX.Element;
    (props: IAnchorProps): React.JSX.Element;
};

const isAnchor = (props: IButtonProps | IAnchorProps): props is IAnchorProps => props.tag === 'a';

// NOTE: there is no props destruction because of union type narrowing. See details: https://github.com/microsoft/TypeScript/issues/46680
const Button: IButtonOverload = (props: IButtonProps | IAnchorProps) => {
    // Getting props to set default value
    const withPulse: typeof props.withPulse = 'withPulse' in props ? props.withPulse : true;

    const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
    const buttonRect = useRect(buttonRef);
    const { pulseItems, pulseClick, handlePulseEnter, handlePulseEntered } = usePulse(buttonRect);

    const handleClick = (
        e:
            | React.MouseEvent<HTMLButtonElement>
            | React.MouseEvent<HTMLAnchorElement>
            | React.KeyboardEvent<HTMLAnchorElement>
    ): void => {
        if (isAnchor(props)) {
            props?.onClick?.(e as React.MouseEvent<HTMLAnchorElement>);
            withPulse && (e.type === 'click' || (e.type === 'keydown' && 'key' in e && e.key === ' ')) && pulseClick(e);

            return;
        }

        props?.onClick?.(e as React.MouseEvent<HTMLButtonElement>);
        withPulse && pulseClick(e);
    };

    /* Classes */
    const themeClass = styles[`button_theme_${props.theme || THEMES.PRIMARY}`];
    const rootClass = classNames(styles.button, themeClass, {
        'is-loading': props.isLoading,
        'is-disabled': props.disabled
    });
    const content = (
        <>
            {/* TODO: loading indicator */}
            {props.isLoading && <span>Loading</span>}
            <span className={styles.button__content}>{props.children}</span>
            {withPulse && (
                <TransitionGroup component={null}>
                    {pulseItems.map((pulseItem, i) => {
                        return (
                            <CSSTransition
                                key={pulseItem.id}
                                appear
                                className={styles.buttonPulse}
                                classNames={{
                                    enter: styles.buttonPulseEnter,
                                    enterActive: styles.buttonPulseEnterActive
                                }}
                                exit={false}
                                nodeRef={pulseItem.nodeRef as React.RefObject<HTMLSpanElement>}
                                timeout={700}
                                unmountOnExit
                                onEnter={() => {
                                    handlePulseEnter(i);
                                }}
                                onEntered={() => {
                                    handlePulseEntered(i);
                                }}
                            >
                                <span ref={pulseItem.nodeRef as React.RefObject<HTMLSpanElement>}>
                                    <span className={styles['button-pulse__effect']} style={pulseItem.style} />
                                </span>
                            </CSSTransition>
                        );
                    })}
                </TransitionGroup>
            )}
        </>
    );

    if (isAnchor(props)) {
        const { className, children, theme, isLoading, ...attrs } = props; // NOTE: typings works correctly only if destuction are made inside branch

        return (
            <a
                ref={(node) => {
                    buttonRef.current = node;
                }}
                {...attrs}
                className={classNames(rootClass, className)}
                role="button"
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={handleClick}
            >
                {content}
            </a>
        );
    }

    // button render
    const { className, children, theme, isLoading, ...attrs } = props;

    return (
        <button
            ref={(node) => {
                buttonRef.current = node;
            }}
            {...attrs}
            className={classNames(rootClass, className)}
            onClick={handleClick}
        >
            {content}
        </button>
    );
};

export default Button;
