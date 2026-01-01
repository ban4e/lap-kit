import { cva } from 'class-variance-authority';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { usePulse } from '@/shared/lib/hooks/usePulse';
import { useRect } from '@/shared/lib/hooks/useRect';
import { ValueOf } from '@/shared/lib/types/valueOf';
import { cn } from '@/shared/lib/utils/classes';

import styles from './Button.module.css';

export const THEMES = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    ACCENT: 'accent',
    SUCCESS: 'success',
    DANGER: 'danger'
} as const;
type ButtonTheme = ValueOf<typeof THEMES>;

export const FILLS = {
    SOLID: 'solid',
    OUTLINE: 'outline',
    TEXT: 'text'
} as const;
type ButtonFill = ValueOf<typeof FILLS>;

interface IBaseProps {
    children: React.ReactNode;
    withPulse?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
    theme?: ButtonTheme;
    fill?: ButtonFill;
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

// NOTE: Using CSS modules here provides benefits like minification and hashing, but adds complexity and make impossible to use `twMerge`. Alternatively, using Tailwind classes directly would add flexibility for variant management and enable twMerge, but sacrifice CSS modules benefits.
const buttonVariants = cva(styles.button, {
    variants: {
        theme: {
            [THEMES.PRIMARY]: styles.button_theme_primary,
            [THEMES.SECONDARY]: styles.button_theme_secondary,
            [THEMES.ACCENT]: styles.button_theme_accent,
            [THEMES.SUCCESS]: styles.button_theme_success,
            [THEMES.DANGER]: styles.button_theme_danger
        },
        fill: {
            [FILLS.SOLID]: styles.button_solid,
            [FILLS.OUTLINE]: styles.button_outline,
            [FILLS.TEXT]: styles.button_text
        },
        isDisabled: {
            true: styles['is-disabled']
        }
    },
    defaultVariants: {
        theme: THEMES.PRIMARY,
        fill: FILLS.SOLID
    }
});

// NOTE: there is no props destruction because of union type narrowing. See details: https://github.com/microsoft/TypeScript/issues/46680
export const Button: IButtonOverload = (props: IButtonProps | IAnchorProps) => {
    // Getting props to set default value
    const withPulse: typeof props.withPulse = 'withPulse' in props ? props.withPulse : true;

    const [buttonRefCallback, buttonRect] = useRect();
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
    const rootClass = buttonVariants({
        theme: props.theme || THEMES.PRIMARY,
        fill: props.fill || FILLS.SOLID,
        isDisabled: props.disabled
    });

    const content = (
        <>
            {/* TODO: loading indicator */}
            {props.isLoading && <span>Loading</span>}
            <span className={styles.button__content}>{props.children}</span>
            {withPulse && (
                <TransitionGroup component={null}>
                    {pulseItems.map((pulseItem, i) => (
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
                    ))}
                </TransitionGroup>
            )}
        </>
    );

    if (isAnchor(props)) {
        const { className, children, theme, fill, isLoading, tag, ...attrs } = props; // NOTE: typings works correctly only if destruction are made inside branch

        return (
            <a
                ref={buttonRefCallback}
                {...attrs}
                className={cn(rootClass, className)}
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
    const { className, children, theme, fill, isLoading, tag, ...attrs } = props;

    return (
        <button ref={buttonRefCallback} {...attrs} className={cn(rootClass, className)} onClick={handleClick}>
            {content}
        </button>
    );
};
