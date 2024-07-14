// TODO: Imporve displaying multiple select
import cn from 'classnames';
import React, { Ref, forwardRef, useCallback, useRef, useState } from 'react';
import ReactSelect, {
    ActionMeta,
    ControlProps,
    IndicatorsContainerProps,
    MultiValue,
    Props as ReactSelectProps,
    SelectInstance,
    SingleValue,
    ValueContainerProps,
    components
} from 'react-select';

import useCombinedRefs from '@/shared/lib/hooks/useCombinedRefs';
import useRect from '@/shared/lib/hooks/useRect';
import { FieldContainer, VIEWS_WITH_CLOSE_LABEL } from '@/shared/ui/FieldContainer';

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
const ValueContainerComponent = (props: ValueContainerProps<OptionType>) => (
    <components.ValueContainer
        {...props}
        innerProps={{
            ...props.innerProps,
            'data-value-container': 'true' // NOTE: React.HTMLAttrubutes are extended with types/react.d.ts, cause data-* attrubutes does not supported by default
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
    const [, setSelectRef] = useState<{ current: SelectInstance | null }>({ current: null });
    const controlRef = useRef<HTMLElement | null>(null);
    const indicatorsRef = useRef<HTMLElement | null>(null);
    const valueContainerRef = useRef<HTMLElement | null>(null);
    const containerPaddingX = useRef<number>(0);
    const updateSelectRef = useCallback((selectInst: SelectInstance | null) => {
        setSelectRef({ current: selectInst || null });
        controlRef.current = selectInst?.controlRef || null;
        valueContainerRef.current = selectInst?.controlRef?.querySelector('[data-value-container]') || null;
        indicatorsRef.current = selectInst?.controlRef?.querySelector('[data-indicators]') || null;
        containerPaddingX.current = // TODO: padding changes are not supported (apply to hook same as useRect)
            (valueContainerRef.current &&
                parseFloat(getComputedStyle(valueContainerRef.current, null).getPropertyValue('padding-left'))) ||
            0;
    }, []);
    const selectCombinedRef = useCombinedRefs(ref, updateSelectRef);
    const controlRect = useRect(controlRef); // TODO: do it in one hook
    const indicatorsRect = useRect(indicatorsRef);
    const valueContainerRect = useRect(valueContainerRef);

    const prefixIndentPx = controlRect.x - valueContainerRect.x - containerPaddingX.current;

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
                    control: () => cn(styles['select-control']),
                    valueContainer: () =>
                        cn(styles['select-value'], {
                            '!px-0': view === 'clear',
                            'pb-1 pt-3.5': view && VIEWS_WITH_CLOSE_LABEL.includes(view) // TODO: This is not ideal that select knows about view
                        }),
                    indicatorsContainer: () => styles['select-indicators-container'],
                    menu: () => styles['select-menu'],
                    input: () => styles['select-input-container'],
                    option: (state) =>
                        cn([
                            styles['select-option'],
                            {
                                [styles['select-option_selected']]: state.isSelected
                            }
                        ])
                }}
                components={{
                    Control: ControlComponent,
                    ValueContainer: ValueContainerComponent,
                    IndicatorsContainer: IndicatorsComponent
                }}
                isDisabled={disabled}
                placeholder=""
                styles={{
                    container: () => ({}),
                    control: () => ({}),
                    valueContainer: () => ({}),
                    singleValue: (baseStyles) => ({
                        ...baseStyles,
                        width: `${controlRect.width - indicatorsRect.width}px`,
                        transform: `translateX(${prefixIndentPx}px)`
                    }),
                    input: () => ({
                        width: `${controlRect.width - indicatorsRect.width}px`,
                        transform: `translateX(${prefixIndentPx}px)`
                    })
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
