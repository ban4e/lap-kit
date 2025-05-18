import { UseFloatingOptions } from '@floating-ui/react';
import { forwardRef, useRef, useState, useCallback } from 'react';
import { Calendar, FormatDateString, type Options } from 'vanilla-calendar-pro';
import 'vanilla-calendar-pro/styles/index.css';

import { FieldContainer } from '@/shared/ui/FieldContainer';
import { InputAtomic } from '@/shared/ui/Input';
import { Tooltip } from '@/shared/ui/Tooltip';

type FieldContainerProps = React.ComponentPropsWithoutRef<typeof FieldContainer>;
type InputProps = React.ComponentPropsWithRef<'input'>;

type TDatePickerValue = string;
type TRangeValue = [TDatePickerValue, TDatePickerValue];
type TSingleValue = TDatePickerValue;

type TProps<IsRange extends boolean = false> = Omit<FieldContainerProps, 'children'> &
    Omit<InputProps, keyof FieldContainerProps | 'type'> & {
        type?: 'date' | 'datetime' | 'year' | 'month' | 'time';
        isRange?: boolean;
        value?: IsRange extends true ? TRangeValue : TSingleValue;
        onChange?: (newValue: IsRange extends true ? TRangeValue : TSingleValue) => void;
        placeholder?: string | [string, string]; // TODO: replace with condition based on IsRange
    };

export const DatePicker = forwardRef<HTMLInputElement, TProps>(function DatePicker<IsRange extends boolean = false>(
    {
        view,
        className,
        label,
        error,
        disabled,
        suffix,
        prefix,
        isRange = false as IsRange,
        placeholder,
        onFocus,
        onBlur,
        onChange,
        ...props
    }: TProps<IsRange>,
    ref: React.Ref<HTMLDivElement>
) {
    // Values
    const [inputValue, setInputValue] = useState<TDatePickerValue[]>(isRange ? ['', ''] : ['']);

    // Calendar instance
    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const calendarElRef = useRef<HTMLDivElement | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const initializedRef = useRef(false); // use additional ref because setCalendar is asynchronous and for strict mode executes twice in refCallback

    // TODO: optimize
    const calendarElRefCallback = useCallback((node: HTMLDivElement | null) => {
        calendarElRef.current = node;

        // cleanup calendar instance
        if (!node && calendar) {
            calendar.destroy();
            setCalendar(null);
            initializedRef.current = false;

            return;
        }

        // nothing to do if it has already been initialized
        if (initializedRef.current) {
            return;
        }

        if (node && !calendar) {
            const calendarOptions: Options = {
                type: isRange ? 'multiple' : 'default',
                displayMonthsCount: isRange ? 2 : 1,
                monthsToSwitch: 1,
                selectionDatesMode: isRange ? 'multiple-ranged' : 'single',
                onClickDate(self) {
                    const { selectedDates } = self.context;

                    if (selectedDates) {
                        const result = isRange
                            ? [selectedDates[0] || '', selectedDates[1] || '']
                            : [selectedDates[0] || ''];
                        setInputValue(() => result);
                    }
                }
            };
            const calendarInst = new Calendar(node, calendarOptions);
            setCalendar(calendarInst);
            calendarInst.init();
            initializedRef.current = true;
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Focus / blur
    const [focused, setFocused] = useState(false);
    const [filled, setFilled] = useState(Boolean(props.value));
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsCalendarOpen(true);
        setFocused(true);
        onFocus?.(e);
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        calendar?.context.selectedDates.some((item) => item) ? setFilled(true) : setFilled(false); // TODO: maybe change condition to check inputs value. NOTE: there is enough to check only one value is filled
        onBlur?.(e);
    };
    /** Input value change */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputIndex = Number(e.target.dataset.inputIndex);
        if (!(inputIndex >= 0)) {
            return;
        }

        const { value } = e.target;
        const isCorrectDate = value?.length === 10 && !isNaN(new Date(value)?.getTime()); // TODO: replace condition with format option and date time library support
        if (isCorrectDate) {
            const calendarDates = [...(calendar?.context.selectedDates || [])];
            calendarDates[inputIndex] = value as FormatDateString;
            calendar?.set({ selectedDates: calendarDates });
        }

        setInputValue((prev) => {
            const newValue = [...prev];
            newValue[inputIndex] = value;

            return newValue;
        });
    };

    /** Tooltip open state change handle */
    const handleTooltipOpenChange: UseFloatingOptions['onOpenChange'] = (open, _, reason) => {
        if (!open && reason === 'outside-press') {
            setIsCalendarOpen(false);

            // Set values to empty if only a single date selected for a range
            const calendarDates = calendar?.context.selectedDates || [];
            if (calendarDates.length < inputValue.length || !calendarDates.every((item) => item)) {
                isRange ? setInputValue(['', '']) : setInputValue(['']);
                setFilled(false);
                calendar?.set({ selectedDates: [] });
            } else {
                !filled && setFilled(true);
                !calendarDates.every((value, index) => value === inputValue[index]) && setInputValue(calendarDates);
            }
        }
    };

    return (
        <Tooltip
            autoOpen
            flipOptions={{ fallbackPlacements: ['top-start'] }}
            isOpen={isCalendarOpen}
            isUnmountOnHide={false}
            placement="bottom-start"
            theme="primary-invert"
            trigger={'click'}
            withArrow={false}
            onOpenChange={handleTooltipOpenChange}
        >
            <Tooltip.Trigger>
                <FieldContainer
                    className={className}
                    disabled={disabled}
                    error={error}
                    inputContainerSelector="[data-input-container]"
                    isFilled={filled}
                    isFocused={focused || isCalendarOpen}
                    label={label}
                    prefix={prefix}
                    rootRef={ref}
                    suffix={suffix}
                    view={view}
                >
                    <div className="flex h-full w-full" data-input-container="true">
                        <InputAtomic
                            {...props}
                            // ref={ref}
                            data-input-index={0}
                            disabled={disabled}
                            placeholder={
                                focused || filled
                                    ? typeof placeholder === 'string'
                                        ? placeholder
                                        : placeholder?.[0]
                                    : undefined
                            }
                            value={inputValue[0]}
                            onBlur={handleBlur}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                        />
                        {isRange && (
                            <InputAtomic
                                {...props}
                                // ref={ref}
                                data-input-index={1}
                                disabled={disabled}
                                placeholder={placeholder?.[1]}
                                value={inputValue[1]}
                                onBlur={handleBlur}
                                onChange={handleInputChange}
                                onFocus={handleFocus}
                            />
                        )}
                    </div>
                </FieldContainer>
            </Tooltip.Trigger>
            <Tooltip.Content className="rounded-md border p-0">
                <div ref={calendarElRefCallback} />
            </Tooltip.Content>
        </Tooltip>
    );
}) as <IsRange extends boolean = false>(p: TProps<IsRange> & { ref?: React.Ref<HTMLDivElement> }) => React.ReactElement;
