import {
    autoUpdate,
    FloatingArrow,
    useFloating,
    Placement,
    useHover,
    offset,
    flip,
    hide,
    Boundary,
    useInteractions,
    useMergeRefs,
    FloatingPortal,
    useClick,
    useDismiss,
    useFocus,
    useRole,
    arrow,
    FlipOptions,
    HideOptions,
    DetectOverflowOptions,
    UseFloatingOptions
} from '@floating-ui/react';
import { cloneElement, createContext, isValidElement, use, useMemo, useRef, useState } from 'react';

import { ValueOf } from '@/shared/lib/types';
import { cn } from '@/shared/lib/utils';

import styles from './Tooltip.module.css';

export const THEMES = {
    PRIMARY: 'primary',
    PRIMARY_INVERT: 'primary-invert'
} as const;
type TooltipTheme = ValueOf<typeof THEMES>;

const OPEN_TRIGGER = {
    HOVER: 'hover',
    CLICK: 'click',
    FOCUS: 'focus'
} as const;
type TriggerUnion = ValueOf<typeof OPEN_TRIGGER>;

type TooltipOptions = {
    autoOpen?: boolean;
    isOpen?: boolean;
    onOpenChange?: UseFloatingOptions['onOpenChange'];
    /** Determines whether the floating element should be unmounted after hiding. If the value is false, the component will be hidden using CSS. */
    isUnmountOnHide?: boolean;
    boundary?: Boundary;
    /** in ms */
    delay?: number;
    offset?: number;
    flipOptions?: FlipOptions & DetectOverflowOptions;
    hideOptions?: HideOptions & DetectOverflowOptions;
    placement?: Placement;
    theme?: TooltipTheme;
    trigger?: TriggerUnion | { [key in TriggerUnion]?: boolean };
    withArrow?: boolean;
};
type TriggerOptions = React.HTMLProps<HTMLElement> & {
    children?: React.ReactNode | never;
    ref?: React.Ref<HTMLElement | null>;
    asChild?: boolean;
};

function useTooltip({
    autoOpen,
    isOpen: isOpenControlled,
    onOpenChange: setIsOpenControlled,
    isUnmountOnHide = true,
    boundary = 'clippingAncestors',
    delay = 0,
    offset: mainAxisOffset = 5,
    flipOptions = {},
    hideOptions = {},
    placement = 'bottom',
    theme = THEMES.PRIMARY,
    trigger = { hover: true, focus: true },
    withArrow = true
}: TooltipOptions = {}) {
    const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(autoOpen);
    const arrowRef = useRef(null);

    const isOpen = isOpenControlled ?? isOpenUncontrolled;
    const setIsOpen = isOpenControlled ? setIsOpenControlled : setIsOpenUncontrolled;

    const floatingData = useFloating({
        placement,
        open: isOpen,
        onOpenChange: setIsOpen, // A function that is called when the open state should change
        middleware: [
            offset({
                mainAxis: mainAxisOffset
            }),
            flip({
                boundary,
                mainAxis: true,
                crossAxis: true,
                fallbackPlacements: ['top', 'right', 'bottom', 'left'],
                // fallbackAxisSideDirection: 'start', // See details https://floating-ui.com/docs/flip#combining-with-shift
                ...flipOptions
            }),
            // Hide should generally be placed at the end of your middleware array.
            hide({
                boundary,
                strategy: 'referenceHidden',
                ...hideOptions
            }),
            arrow({
                element: arrowRef
            })
        ],
        whileElementsMounted: isOpen ? autoUpdate : undefined // automatically handles calling and cleaning up autoUpdate based on the presence of the reference and floating element.
    });

    const hover = useHover(floatingData.context, {
        delay,
        enabled:
            typeof trigger === 'string'
                ? trigger === OPEN_TRIGGER.HOVER
                : trigger && typeof trigger === 'object' && trigger[OPEN_TRIGGER.HOVER]
    });
    const click = useClick(floatingData.context, {
        enabled:
            typeof trigger === 'string'
                ? trigger === OPEN_TRIGGER.CLICK
                : trigger && typeof trigger === 'object' && trigger[OPEN_TRIGGER.CLICK]
    });
    const focus = useFocus(floatingData.context, {
        enabled:
            typeof trigger === 'string'
                ? trigger === OPEN_TRIGGER.FOCUS
                : trigger && typeof trigger === 'object' && trigger[OPEN_TRIGGER.FOCUS]
    });
    const dismiss = useDismiss(floatingData.context);
    const role = useRole(floatingData.context, { role: 'tooltip' });

    const interactions = useInteractions([hover, click, focus, dismiss, role]);

    return useMemo(
        () => ({
            isOpen,
            setIsOpen,
            theme,
            arrowRef,
            withArrow,
            isUnmountOnHide,
            ...interactions,
            ...floatingData
        }),
        [isOpen, setIsOpen, theme, withArrow, isUnmountOnHide, interactions, floatingData]
    );
}
const TooltipContext = createContext<ReturnType<typeof useTooltip> | null>(null);
const useTooltipContext = () => {
    const context = use(TooltipContext);

    if (context === null) {
        throw new Error('Tooltip components must be wrapped in <Tooltip />');
    }

    return context;
};

const Tooltip = ({ children, ...options }: { children: React.ReactNode } & TooltipOptions) => {
    // This can accept any props as options, e.g. `placement`,
    // or other positioning options.
    const tooltip = useTooltip(options);

    return <TooltipContext value={tooltip}>{children}</TooltipContext>;
};

const TooltipTrigger = ({ children, ref: propRef, asChild = false, ...props }: TriggerOptions) => {
    const context = useTooltipContext();
    const ref = useMergeRefs([context.refs.setReference, propRef]);

    if (asChild && isValidElement(children)) {
        return cloneElement(
            children,
            context.getReferenceProps({
                ref,
                ...props,
                'data-state': context.isOpen ? 'open' : 'closed',
                ...(children.props || {}),
                ...context.getReferenceProps(props)
            })
        );
    }

    // Use a wrapper element to ensure the ref is correctly applied
    else if (children && isValidElement(children)) {
        return (
            <div
                ref={ref}
                className={styles['tooltip-trigger']}
                data-state={context.isOpen ? 'open' : 'closed'}
                {...context.getReferenceProps(props)}
            >
                {children}
            </div>
        );
    }

    return (
        <button
            ref={ref}
            // The user can style the trigger based on the state
            data-state={context.isOpen ? 'open' : 'closed'}
            {...context.getReferenceProps(props)}
            className={styles['tooltip-btn']}
            type="button"
        >
            {'?'}
        </button>
    );
};

const TooltipContent = ({
    style,
    ref: propRef,
    children,
    className,
    isPlain = false,
    ...props
}: React.HTMLProps<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
    /** Render just basic class styles and without arrow */
    isPlain?: boolean;
}) => {
    const context = useTooltipContext();
    const ref = useMergeRefs([context.refs.setFloating, propRef]);
    const rootClass = cn([
        styles.tooltip,
        {
            [styles['tooltip_main']]: !isPlain,
            [styles['tooltip_primary']]: context.theme === THEMES.PRIMARY,
            [styles['tooltip_primary-invert']]: context.theme === THEMES.PRIMARY_INVERT,
            [styles['tooltip_hidden']]: context.middlewareData.hide?.referenceHidden,
            [styles['tooltip_closed']]: !context.isUnmountOnHide && !context.isOpen
        },
        className
    ]);

    if (isPlain) {
        return (
            <FloatingPortal>
                <div
                    ref={ref}
                    aria-hidden={!context.isOpen}
                    {...context.getFloatingProps(props)}
                    className={rootClass}
                    style={{
                        ...context.floatingStyles,
                        ...style
                    }}
                >
                    {children}
                </div>
            </FloatingPortal>
        );
    }

    const { arrowRef, withArrow } = context;

    if (!context.isOpen && context.isUnmountOnHide) return null;

    return (
        <FloatingPortal>
            <div
                ref={ref}
                aria-hidden={!context.isOpen}
                className={rootClass}
                style={{
                    ...context.floatingStyles,
                    ...style
                }}
                {...context.getFloatingProps(props)}
            >
                {withArrow && (
                    <FloatingArrow
                        ref={arrowRef}
                        className={styles['tooltip__arrow']}
                        context={context.context}
                        height={4}
                        tipRadius={2}
                        width={8}
                    />
                )}
                <div className={cn([styles['tooltip__content'], className])}>{children}</div>
            </div>
        </FloatingPortal>
    );
};

Tooltip.Trigger = TooltipTrigger;
Tooltip.Content = TooltipContent;

export { Tooltip };
