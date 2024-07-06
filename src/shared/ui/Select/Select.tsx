// TODO: Imporve displaying multiple select
// TODO: Clean up
import cn from 'classnames';
import React, { Ref, forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import ReactSelect, {
    ActionMeta,
    ControlProps,
    IndicatorsContainerProps,
    MultiValue,
    Props as ReactSelectProps,
    SelectInstance,
    SingleValue,
    components
} from 'react-select';

import useCombinedRefs from '@/shared/lib/hooks/useCombinedRefs';
import { getRect } from '@/shared/lib/hooks/useRect';
import { FieldContainer } from '@/shared/ui/FieldContainer';

import styles from './Select.module.css';

interface FieldContainerProps extends React.ComponentPropsWithoutRef<typeof FieldContainer> {}
interface SelectProps<Option = unknown>
    extends Omit<FieldContainerProps, 'children'>, // ReactSelect is a children
        Omit<ReactSelectProps<Option>, keyof FieldContainerProps> {}

type OptionType = { label: string; value: number | string };
type OnChange = (
    value: SingleValue<OptionType> | MultiValue<OptionType> | null,
    actionMeta: ActionMeta<OptionType>
) => void;

/** *** CUSTOM COMPONENTS **** */
const ControlComponent = (props: ControlProps<OptionType>) => (
    <components.Control
        {...props}
        innerProps={{
            ...props.innerProps,
            'data-control': 'true' // NOTE: React.HTMLAttrubutes are extended with types/react.d.ts, cause data-* attrubutes does not supported by default
        }}
    />
);
const IndicatorsComponent = (props: IndicatorsContainerProps<OptionType>) => (
    <components.IndicatorsContainer
        {...props}
        innerProps={{
            ...props.innerProps,
            'data-indicators': 'true' // NOTE: React.HTMLAttrubutes are extended with types/react.d.ts, cause data-* attrubutes does not supported by default
        }}
    />
);

const Select = forwardRef<SelectInstance, SelectProps<OptionType>>(function SelectField(
    { view, className, label, error, disabled, suffix, prefix, ...props },
    ref
) {
    const [focused, setFocused] = useState(false);
    const [filled, setFilled] = useState(Boolean(props.value));

    const handleChange: OnChange = (option, meta) => {
        option ? setFilled(true) : setFilled(false);
        props.onChange && props.onChange(option, meta);
    };

    // Calculate width for singleValue and inputs
    const selectRef = useRef<SelectInstance | null>(null);
    const selectCombinedRef = useCombinedRefs(ref, selectRef);
    const [controlRect, setControlRect] = useState<DOMRectReadOnly>(getRect());
    const [indicatorsRect, setIndicatorsRect] = useState<DOMRectReadOnly>(getRect());
    const handleResize = useCallback(() => {
        const controlRef = selectRef.current?.controlRef;
        if (!controlRef) {
            return;
        }
        const indicatorsEl: HTMLElement | null = controlRef.querySelector('[data-indicators]');
        setControlRect(getRect(controlRef));
        indicatorsEl && setIndicatorsRect(getRect(indicatorsEl));
    }, []);

    // TODO: custom hook useRect isn't working here, because of custom hooks fires before react hooks inside component. That's in custom hook selectRef.current is empty
    useLayoutEffect(() => {
        const element = selectRef.current?.controlRef;
        if (!element) {
            return;
        }

        handleResize();

        if (typeof ResizeObserver === 'function') {
            let resizeObserver: ResizeObserver | null = new ResizeObserver(() => handleResize());
            resizeObserver.observe(element);

            return () => {
                if (!resizeObserver) {
                    return;
                }
                resizeObserver.disconnect();
                resizeObserver = null;
            };
        }
        window.addEventListener('resize', handleResize); // Browser support, remove freely

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <FieldContainer
            className={className}
            disabled={disabled}
            error={error}
            isFilled={filled}
            isFocused={focused}
            label={label}
            prefix={prefix}
            suffix={suffix}
            view={view}
        >
            <ReactSelect
                {...props}
                ref={selectCombinedRef as Ref<SelectInstance<OptionType>>}
                classNames={{
                    container: () => styles.select,
                    control: () =>
                        cn(styles['select-control'], {
                            'pb-1 pt-3.5': view === 'filled' // TODO: This is not ideal that select knows about view
                        }),
                    valueContainer: () =>
                        cn(styles['select-value'], {
                            'pb-1 pt-3.5': view === 'filled' // TODO: This is not ideal that select knows about view
                        }),
                    indicatorsContainer: () => styles['select-indicators-container'],
                    menu: () => styles['select-menu'],
                    option: (state) =>
                        cn([
                            styles['select-option'],
                            {
                                [styles['select-option_selected']]: state.isSelected
                            }
                        ])
                }}
                components={{ Control: ControlComponent, IndicatorsContainer: IndicatorsComponent }}
                placeholder=""
                styles={{
                    container: () => ({}),
                    control: () => ({}),
                    valueContainer: () => ({}),
                    singleValue: (baseStyles) => ({
                        ...baseStyles,
                        width: `${controlRect.width - indicatorsRect.width}px`
                    }),
                    input: () => ({ width: `${controlRect.width - indicatorsRect.width}px` })
                }}
                unstyled
                onBlur={() => setFocused(false)}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
            />
        </FieldContainer>
    );
});

export default Select;
