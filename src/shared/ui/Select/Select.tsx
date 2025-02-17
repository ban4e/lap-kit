// TODO: Add multiselect checkboxes to option; Remove focus after multiselect is cleared by clicking button
import cn from 'classnames';
import { Children, isValidElement, memo, Ref, useCallback, useMemo, useRef, useState } from 'react';
import ReactSelect, {
    ControlProps,
    FormatOptionLabelMeta,
    GroupBase,
    IndicatorsContainerProps,
    OnChangeValue,
    PropsValue,
    Props as ReactSelectProps,
    SelectInstance,
    ValueContainerProps,
    components
} from 'react-select';

import useCombinedRefs from '@/shared/lib/hooks/useCombinedRefs';
import useRect from '@/shared/lib/hooks/useRect';
import { FieldContainer, VIEWS_WITH_CLOSE_LABEL } from '@/shared/ui/FieldContainer';

import styles from './Select.module.css';

type OptionType = { label: string; value: number | string };
type TSelectReturnValue<T> = T | number | string | null;
type TFieldContainerProps = React.ComponentProps<typeof FieldContainer>;

type TSelectProps<
    Option = unknown,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>
> = Omit<TFieldContainerProps, 'children' | 'isFilled' | 'isFocused'> & // ReactSelect is a children
    Omit<ReactSelectProps<Option, IsMulti, Group>, keyof TFieldContainerProps | 'value' | 'placeholder'> & {
        value?: IsMulti extends true ? TSelectReturnValue<Option>[] : TSelectReturnValue<Option>;
        ref?: React.RefObject<SelectInstance> | React.RefCallback<SelectInstance>;
        /** Specify to get the value from one of property in Option */
        valueKey?: string;
    };

/** *** CUSTOM COMPONENTS **** */
const ControlComponent = <
    Option = OptionType,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>
>(
    props: ControlProps<Option, IsMulti, Group>
) => (
    <components.Control
        {...props}
        innerProps={{
            ...props.innerProps,
            'data-control': 'true' // NOTE: React.HTMLAttributes are extended with types/react.d.ts, cause data-* Attributes does not supported by default
        }}
    />
);
const ValueContainerComponent = <
    Option = OptionType,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>
>({
    children,
    ...props
}: ValueContainerProps<Option, IsMulti, Group>) => {
    const getText = props.selectProps.getOptionValue;
    const { getOptionLabel, formatOptionLabel } = props.selectProps;
    const selectedValues = props.getValue();
    const selectedLabels =
        props.isMulti &&
        selectedValues
            .map((option) => {
                if (formatOptionLabel) {
                    // Create the `FormatOptionLabelMeta` object
                    const meta: FormatOptionLabelMeta<Option> = {
                        context: 'value',
                        inputValue: '', // Provide the current input value (if available)
                        selectValue: selectedValues // Provide the current selected values
                    };

                    return formatOptionLabel(option, meta);
                }

                // Fall back to `getOptionLabel` or the default label
                return getOptionLabel ? getOptionLabel(option) : getText(option);
            })
            .join(', ');

    return (
        <components.ValueContainer
            {...props}
            innerProps={{
                ...props.innerProps,
                'data-value-container': 'true' // NOTE: React.HTMLAttributes are extended with types/react.d.ts, cause data-* Attributes does not supported by default
            }}
        >
            {/* data-input-container is used by FieldContainer to detect width */}
            <div
                className="relative grid h-full w-full grid-flow-col overflow-hidden"
                data-input-container="true"
                data-value-container-inner="true"
            >
                {props.isMulti && (
                    <span className="absolute inset-0 flex items-center">
                        <span className="truncate">{selectedLabels}</span>
                    </span>
                )}
                {Children.map(children, (child) => {
                    // Render input and single value
                    if (isValidElement(child) && child.key !== 'placeholder') {
                        return child;
                    }

                    return null;
                })}
            </div>
        </components.ValueContainer>
    );
};

const IndicatorsComponent = <
    Option = OptionType,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>
>(
    props: IndicatorsContainerProps<Option, IsMulti, Group>
) => (
    <components.IndicatorsContainer
        {...props}
        innerProps={{
            ...props.innerProps,
            'data-indicators': 'true' // NOTE: React.HTMLAttributes are extended with types/react.d.ts, cause data-* Attributes does not supported by default
        }}
    />
);

const checkOptionIsGroup = <Option = OptionType,>(option: Option | GroupBase<Option>): option is GroupBase<Option> => {
    return option && typeof option === 'object' && 'options' in option;
};

const findSelectedOption = <Option = OptionType, IsMulti extends boolean = false>({
    value,
    valueKey,
    options
}: {
    value: TSelectProps<Option, IsMulti>['value'];
    valueKey: keyof Option;
    options: TSelectProps<Option, IsMulti>['options'];
}): Option | Option[] | undefined => {
    if (Array.isArray(value)) {
        return options?.filter((item) => {
            return checkOptionIsGroup(item)
                ? item.options.filter((gropedOption) => gropedOption[valueKey]).flat() // TODO: check this branch is correct
                : value.includes(item[valueKey] as TSelectReturnValue<Option>);
        }) as Option[];
    }

    return options?.find((item) => {
        return checkOptionIsGroup(item)
            ? item.options.find((gropedOption) => gropedOption[valueKey] === value)
            : item[valueKey] === value;
    }) as Option;
};

const selectComponents = {
    Control: ControlComponent,
    ValueContainer: ValueContainerComponent,
    IndicatorsContainer: IndicatorsComponent,
    MultiValue: () => null
};

const Select = memo(function Select<Option, IsMulti extends boolean>({
    ref,
    view,
    className,
    label,
    error,
    disabled,
    suffix,
    prefix,
    value,
    valueKey = 'value',
    isSearchable = false,
    menuIsOpen = false,
    isMulti = false as IsMulti,
    onChange,
    ...props
}: TSelectProps<Option, IsMulti>) {
    const [focused, setFocused] = useState(false);
    const [filled, setFilled] = useState(Boolean(value));

    // Transform value (string | number) to Option type, because of react-select accept only Option type
    const selectValue: PropsValue<Option> | undefined = useMemo(() => {
        return (
            (valueKey &&
                findSelectedOption({
                    value,
                    valueKey: valueKey as keyof Option,
                    options: props.options
                })) ||
            (value as PropsValue<Option>)
        );
    }, [value, valueKey, props.options]);

    // Calculate width for singleValue and inputs
    const [controlRefCb, controlRect] = useRect();
    const [indicatorsRefCb, indicatorsRect] = useRect();
    const [fieldContainerRefCb, fieldContainerRect] = useRect();

    const containerPaddingLeft = useRef<number>(0);
    const selectRef = useRef<SelectInstance | null>(null);
    const updateSelectRef = useCallback(
        (selectInst: SelectInstance | null) => {
            selectRef.current = selectInst;
            const valueContainerEl: HTMLElement | null =
                selectInst?.controlRef?.querySelector('[data-value-container]') || null;
            controlRefCb(selectInst?.controlRef || null);
            indicatorsRefCb(selectInst?.controlRef?.querySelector('[data-indicators]') || null);

            containerPaddingLeft.current =
                (valueContainerEl &&
                    parseFloat(getComputedStyle(valueContainerEl, null).getPropertyValue('padding-left'))) ||
                0;
        },
        [controlRefCb, indicatorsRefCb]
    );
    const selectCombinedRef = useCombinedRefs(ref, updateSelectRef);

    const handleChange: ReactSelectProps<Option>['onChange'] = (option, meta) => {
        option ? setFilled(isMulti && Array.isArray(option) ? !!option.length : true) : setFilled(false);

        typeof onChange === 'function' && onChange(option as OnChangeValue<Option, IsMulti>, meta);
    };

    const inputWidth = controlRect.width - indicatorsRect.width;
    const containerPaddingLeftPx = containerPaddingLeft.current;
    const prefixIndentPx = controlRect.x - fieldContainerRect.x;

    return (
        <FieldContainer
            className={className}
            disabled={disabled}
            error={error}
            isFilled={filled}
            isFocused={focused}
            isPreventPointerDownEvent={false}
            label={label}
            prefix={prefix}
            rootRef={fieldContainerRefCb}
            suffix={suffix}
            view={view}
        >
            <ReactSelect
                {...props}
                ref={selectCombinedRef as Ref<SelectInstance<Option, IsMulti>>}
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
                                [styles['select-option_selected']]: state.isSelected,
                                [styles['select-option_focused']]: state.isFocused
                            }
                        ]),
                    singleValue: () => styles['select-single-value']
                }}
                components={selectComponents}
                isDisabled={disabled}
                isMulti={isMulti}
                isSearchable={isSearchable}
                placeholder=""
                styles={{
                    clearIndicator: (baseStyles) => ({
                        ...baseStyles,
                        cursor: 'default'
                    }),
                    container: () => ({}),
                    control: () => ({}),
                    valueContainer: () => ({
                        // See details https://github.com/JedWatson/react-select/issues/3995
                        'input[aria-readonly="true"]': {
                            position: 'absolute',
                            left: 0,
                            transform: 'none',
                            width: '2px'
                        },
                        input: {
                            maxWidth: `${inputWidth}px`,
                            padding: 0
                        },
                        '[data-value-container-inner]': {
                            width: `${inputWidth}px`,
                            transform: `translateX(${prefixIndentPx - containerPaddingLeftPx}px)`
                        }
                    }),
                    singleValue: (baseStyles) => ({
                        ...baseStyles
                    })
                }}
                unstyled
                value={selectValue}
                onBlur={() => setFocused(false)}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
            />
        </FieldContainer>
    );
});

export { Select };
