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
    DetectOverflowOptions
} from '@floating-ui/react';
import cn from 'classnames';
import { cloneElement, createContext, isValidElement, use, useMemo, useRef, useState } from 'react';

import { ValueOf } from '@/shared/lib/types';

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
    ref?: React.RefObject<HTMLElement | null> | ((node: HTMLElement) => void);
};

function useTooltip({
    autoOpen,
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
    const [isOpen, setIsOpen] = useState(autoOpen);
    const arrowRef = useRef(null);

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
        whileElementsMounted: autoUpdate // automatically handles calling and cleaning up autoUpdate based on the presence of the reference and floating element.
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
            ...interactions,
            ...floatingData
        }),
        [isOpen, theme, withArrow, interactions, floatingData]
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

const TooltipTrigger = ({ children, ref: propRef, ...props }: TriggerOptions) => {
    const context = useTooltipContext();
    // const children = asChild && 'children' in props && props.children;
    // children && delete props.children;
    const ref = useMergeRefs([context.refs.setReference, propRef]);

    // `asChild` allows the user to pass any element as the anchor
    if (children && isValidElement(children)) {
        const childrenProps = children.props || {};

        return cloneElement(
            children,
            context.getReferenceProps({
                ref,
                ...props,
                ...childrenProps,
                'data-state': context.isOpen ? 'open' : 'closed'
            })
        );
    }

    return (
        <button
            ref={ref}
            // The user can style the trigger based on the state
            data-state={context.isOpen ? 'open' : 'closed'}
            {...context.getReferenceProps(props)}
            className="dark:bg-n-400 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-white transition hover:bg-primary/70 dark:hover:bg-primary/70"
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
    ...props
}: React.HTMLProps<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement> }) => {
    const context = useTooltipContext();
    const ref = useMergeRefs([context.refs.setFloating, propRef]);
    const { arrowRef, withArrow } = context;

    if (!context.isOpen) return null;

    return (
        <FloatingPortal>
            <div
                ref={ref}
                className={cn([
                    styles.tooltip,
                    {
                        [styles['tooltip_primary']]: context.theme === THEMES.PRIMARY,
                        [styles['tooltip_primary-invert']]: context.theme === THEMES.PRIMARY_INVERT,
                        hidden: context.middlewareData.hide?.referenceHidden
                    }
                ])}
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
                <div className={styles['tooltip__content']}>{children}</div>
            </div>
        </FloatingPortal>
    );
};

Tooltip.Trigger = TooltipTrigger;
Tooltip.Content = TooltipContent;

export { Tooltip };
