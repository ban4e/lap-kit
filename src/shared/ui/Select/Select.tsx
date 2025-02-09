// TODO: Improve displaying multiple select; Check multiselect change with null
import cn from 'classnames';
import { Ref, useCallback, useMemo, useRef, useState } from 'react';
import ReactSelect, {
    ActionMeta,
    ControlProps,
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
> = Omit<TFieldContainerProps, 'children'> & // ReactSelect is a children
    Omit<ReactSelectProps<Option, IsMulti, Group>, keyof TFieldContainerProps | 'value'> & {
        value?: IsMulti extends true ? TSelectReturnValue<Option>[] : TSelectReturnValue<Option>;
        ref?: React.RefObject<SelectInstance> | React.RefCallback<SelectInstance>;
        /** Specify to get the value from one of property in Option */
        valueKey?: string;
    };
type TSingleSelectProps = Omit<TSelectProps<OptionType, false>, 'onChange'> & {
    onChange?: (newValue: TSelectReturnValue<OptionType>, actionMeta: ActionMeta<OptionType>) => void;
};
type TMultiSelectProps = Omit<TSelectProps<OptionType, true>, 'onChange'> & {
    onChange?: (newValue: TSelectReturnValue<OptionType>[], actionMeta: ActionMeta<OptionType>) => void;
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
>(
    props: ValueContainerProps<Option, IsMulti, Group>
) => (
    <components.ValueContainer
        {...props}
        innerProps={{
            ...props.innerProps,
            'data-value-container': 'true' // NOTE: React.HTMLAttributes are extended with types/react.d.ts, cause data-* Attributes does not supported by default
        }}
    />
);
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

const SelectBase = <Option, IsMulti extends boolean>({
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
    onChange,
    ...props
}: TSelectProps<Option, IsMulti>) => {
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

    const handleChange: ReactSelectProps<Option>['onChange'] = (option, meta) => {
        option ? setFilled(true) : setFilled(false);

        typeof onChange === 'function' && onChange(option as OnChangeValue<Option, IsMulti>, meta);
    };

    // Calculate width for singleValue and inputs
    const [, setSelectRef] = useState<{ current: SelectInstance | null }>({ current: null });
    const [controlRef, controlRect] = useRect();
    const [indicatorsRef, indicatorsRect] = useRect();
    const [valueContainerRef, valueContainerRect] = useRect();

    const containerPaddingX = useRef<number>(0);
    const updateSelectRef = useCallback(
        (selectInst: SelectInstance | null) => {
            const valueContainerEl: HTMLElement | null =
                selectInst?.controlRef?.querySelector('[data-value-container]') || null;

            setSelectRef({ current: selectInst || null });
            controlRef(selectInst?.controlRef || null);
            indicatorsRef(selectInst?.controlRef?.querySelector('[data-indicators]') || null);
            valueContainerRef(valueContainerEl);

            containerPaddingX.current =
                (valueContainerEl &&
                    parseFloat(getComputedStyle(valueContainerEl, null).getPropertyValue('padding-left'))) ||
                0;
        },
        [controlRef, indicatorsRef, valueContainerRef]
    );
    const selectCombinedRef = useCombinedRefs(ref, updateSelectRef);

    const prefixIndentPx = controlRect.x - valueContainerRect.x - containerPaddingX.current;

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
                        ])
                }}
                components={{
                    Control: ControlComponent,
                    ValueContainer: ValueContainerComponent,
                    IndicatorsContainer: IndicatorsComponent
                }}
                isDisabled={disabled}
                // menuIsOpen={focused || menuIsOpen}
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
                value={selectValue}
                onBlur={() => setFocused(false)}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
            />
        </FieldContainer>
    );
};

const Select = ({ onChange, valueKey, ...props }: TSingleSelectProps) => {
    const handleChange: TSelectProps<OptionType, false>['onChange'] = (option, meta) => {
        if (typeof onChange !== 'function') {
            return;
        }

        onChange(valueKey ? option?.[valueKey as keyof OptionType] || null : option, meta);
    };

    return <SelectBase {...props} valueKey={valueKey} onChange={handleChange} />;
};

const MultiSelect = ({ onChange, valueKey, ...props }: TMultiSelectProps) => {
    const handleChange: TSelectProps<OptionType, true>['onChange'] = (option, meta) => {
        if (typeof onChange !== 'function') {
            return;
        }

        onChange(
            option.map((item: OptionType) => (valueKey ? item[valueKey as keyof OptionType] : item)),
            meta
        );
    };

    return <SelectBase {...props} valueKey={valueKey} onChange={handleChange} />;
};

export { Select, MultiSelect };
