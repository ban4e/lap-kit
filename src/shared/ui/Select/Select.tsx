// TODO: Add multiselect checkboxes to option; Remove focus after multiselect is cleared by clicking button
import cn from 'classnames';
import { Children, isValidElement, JSX, memo, Ref, useCallback, useMemo, useRef, useState } from 'react';
import ReactSelect, {
    ActionMeta,
    ControlProps,
    FormatOptionLabelMeta,
    GroupBase,
    IndicatorsContainerProps,
    MultiValue,
    PropsValue,
    Props as ReactSelectProps,
    SelectInstance,
    SingleValue,
    ValueContainerProps,
    components
} from 'react-select';

import { useCombinedRefs } from '@/shared/lib/hooks/useCombinedRefs';
import { useRect } from '@/shared/lib/hooks/useRect';
import { FieldContainer, VIEWS_WITH_CLOSE_LABEL } from '@/shared/ui/FieldContainer';

import styles from './Select.module.css';

type OptionType = { label: React.ReactNode; value: number | string };
type TSelectReturnValue<T> = T | number | string | null;
type TFieldContainerProps = React.ComponentProps<typeof FieldContainer>;

type TSelectProps<
    Option extends object = OptionType,
    IsMulti extends boolean = false,
    ValueKey extends string | undefined = 'value',
    Group extends GroupBase<Option> = GroupBase<Option>
> = Omit<TFieldContainerProps, 'children' | 'isFilled' | 'isFocused' | 'ref'> & // ReactSelect is a children
    Omit<
        ReactSelectProps<Option, IsMulti, Group>,
        keyof TFieldContainerProps | 'value' | 'placeholder' | 'onChange' | 'isMulti'
    > & {
        value?: IsMulti extends true ? TSelectReturnValue<Option>[] : TSelectReturnValue<Option>;
        ref?: React.RefObject<SelectInstance> | React.RefCallback<SelectInstance>;
        /** Specify to get the value from one of property in Option */
        valueKey?: ValueKey;
        isMulti?: IsMulti;
        onChange?: TSelectOnChange<Option, IsMulti, ValueKey>;
        /** Additional className for options. This can be useful when the portal is used and some styles are inherited from another parent element. */
        optionClassName?: cn.Argument;
    };
type TSelectOnChange<
    Option extends object = OptionType,
    IsMulti extends boolean = false,
    ValueKey extends string | undefined = undefined
> = (
    newValue: IsMulti extends true
        ? ValueKey extends string
        ? TSelectReturnValue<Option>[]
        : Option[]
        : ValueKey extends string
        ? TSelectReturnValue<Option>
        : Option | null,
    actionMeta: ActionMeta<Option>
) => void;

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
                className={styles['select-value-container']}
                data-input-container="true"
                data-value-container-inner="true"
            >
                {props.isMulti && (
                    <span className={styles['select-value-container__multi']}>
                        <span className={styles['select-value-container__multi-label']}>{selectedLabels}</span>
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

const checkOptionIsMulti = <Option = OptionType,>(
    option: MultiValue<Option> | SingleValue<Option>
): option is MultiValue<Option> => {
    return Array.isArray(option);
};

const findSelectedOption = <Option extends object = OptionType, IsMulti extends boolean = false>({
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

const Select = memo(function Select<
    Option extends OptionType,
    IsMulti extends boolean = false,
    ValueKey extends string | undefined = 'value'
>({
    ref,
    view,
    className,
    optionClassName,
    label,
    error,
    disabled,
    suffix,
    prefix,
    value,
    valueKey = 'value' as ValueKey,
    isSearchable = false,
    isMulti = false as IsMulti,
    onChange,
    onBlur,
    onFocus,
    ...props
}: TSelectProps<Option, IsMulti, ValueKey>) {
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

    // Calculate width for singleValue and inputs TODO: combine to single state due to first render optimization
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

    type TOnChangeNewValue = Parameters<TSelectOnChange<Option, IsMulti, ValueKey>>[0];
    const handleChange: ReactSelectProps<Option>['onChange'] = (option, meta) => {
        option ? setFilled(isMulti && Array.isArray(option) ? !!option.length : true) : setFilled(false);
        if (typeof onChange === 'function') {
            checkOptionIsMulti(option) && isMulti
                ? onChange(
                    option.map((item: Option) =>
                        valueKey && valueKey in item ? item[valueKey as keyof Option] : (item as Option)
                    ) as TOnChangeNewValue,
                    meta
                )
                : onChange(
                    (valueKey && option && valueKey in option
                        ? ((option as Option)?.[valueKey as keyof Option] ?? null)
                        : option) as TOnChangeNewValue,
                    meta
                );
        }
    };

    const handleBlur = useCallback<Exclude<ReactSelectProps<Option>['onBlur'], undefined>>(
        (e) => {
            setFocused(false);
            typeof onBlur === 'function' && onBlur(e);
        },
        [setFocused, onBlur]
    );

    const handleFocus = useCallback<Exclude<ReactSelectProps<Option>['onFocus'], undefined>>(
        (e) => {
            setFocused(true);
            typeof onFocus === 'function' && onFocus(e);
        },
        [setFocused, onFocus]
    );

    const inputWidth = controlRect.width - indicatorsRect.width;
    const containerPaddingLeftPx = containerPaddingLeft.current;
    const prefixIndentPx = controlRect.x - fieldContainerRect.x;

    return (
        <FieldContainer
            ref={fieldContainerRefCb}
            className={className}
            disabled={disabled}
            error={error}
            isFilled={filled}
            isFocused={focused}
            isPreventPointerDownEvent={false}
            label={label}
            prefix={prefix}
            suffix={suffix}
            view={view}
        >
            <ReactSelect
                {...props}
                ref={selectCombinedRef as Ref<SelectInstance<Option, IsMulti>>}
                classNames={{
                    container: () =>
                        cn(styles.select, {
                            [styles.select_clear]: view === 'clear'
                        }),
                    control: () => cn(styles['select-control']),
                    valueContainer: () =>
                        cn(styles['select-value'], {
                            [styles['select-value_clear']]: view === 'clear',
                            [styles['select-value_indent']]: view !== 'clear',
                            [styles['select-value_raised']]: view && VIEWS_WITH_CLOSE_LABEL.includes(view) && label // TODO: This is not ideal that select knows about view
                        }),
                    indicatorsContainer: () => styles['select-indicators-container'],
                    menu: () =>
                        cn(styles['select-menu'], {
                            [styles['select-menu_clear']]: view === 'clear'
                        }),
                    input: () => styles['select-input-container'],
                    option: (state) =>
                        cn([
                            styles['select-option'],
                            optionClassName,
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
                    dropdownIndicator: (baseStyles) => ({
                        ...baseStyles,
                        width: view === 'clear' ? 14 : undefined
                    }),
                    option: () => ({}),
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
                    }),
                    menuPortal: (baseStyles) => ({
                        ...baseStyles,
                        zIndex: 99
                    })
                }}
                unstyled
                value={selectValue}
                onBlur={handleBlur}
                onChange={handleChange}
                onFocus={handleFocus}
            />
        </FieldContainer>
    );
}) as <Option extends OptionType, IsMulti extends boolean = false, ValueKey extends string | undefined = 'value'>(
    props: TSelectProps<Option, IsMulti, ValueKey>
) => JSX.Element;
{
    /* Explicitly casting the memoized component preserves generic type information that would otherwise be erased by React.memo, ensuring proper type inference for props like `onChange` */
}

export { Select };
