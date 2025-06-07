import { UseFloatingOptions } from '@floating-ui/react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Calendar, FormatDateString, type Options } from 'vanilla-calendar-pro';
import 'vanilla-calendar-pro/styles/index.css';

import { FieldContainer } from '@/shared/ui/FieldContainer';
import { InputAtomic } from '@/shared/ui/Input';
import { Tooltip } from '@/shared/ui/Tooltip';

type FieldContainerProps = React.ComponentPropsWithoutRef<typeof FieldContainer>;
type InputProps = React.ComponentPropsWithRef<'input'>;

type TDatePickerValue = string;
type TRangeValue = TDatePickerValue[];
type TSingleValue = TDatePickerValue;

type TProps<IsRange extends boolean = false> = Omit<FieldContainerProps, 'children'> &
    Omit<InputProps, keyof FieldContainerProps | 'type' | 'onChange' | 'value' | 'placeholder'> & {
        type?: 'date' | 'datetime' | 'year' | 'month' | 'time';
        isRange?: IsRange;
        value?: IsRange extends true ? TRangeValue : TSingleValue;
        onChange?: (newValue: IsRange extends true ? TRangeValue : TSingleValue) => void;
        placeholder?: string | [string, string]; // TODO: replace with condition based on IsRange
        ref?: React.RefObject<Calendar> | React.RefCallback<Calendar>;
        /** Date format. See https://day.js.org/docs/en/display/format */
        format?: string;
    };
type TOnChangeParams<IsRange extends boolean = false> = Parameters<Exclude<TProps<IsRange>['onChange'], undefined>>[0];

/**
 * Sanitizes the value for calendar usage.
 * - For range mode (isRange=true): Ensures value is [string, string] (defaults to ['', ''] if invalid)
 * - For single mode (isRange=false): Ensures value is [string] (defaults to [''] if invalid)
 * @param {object} props
 * @prop {boolean} props.isRange - Whether the value should be interpreted as a range of dates or a single date.
 * @prop {TRangeValue | TSingleValue} [props.value] - The value to be sanitized.
 * @returns {TDatePickerValue[]} The sanitized value.
 */
const sanitizeValue = ({
    isRange,
    value
}: {
    isRange: boolean;
    value?: TRangeValue | TSingleValue;
}): TDatePickerValue[] => {
    let result = isRange ? ['', ''] : [''];
    if (value && isRange) {
        result = Array.isArray(value) ? [value?.[0] || '', value?.[1] || ''] : [value || '', ''];
    } else if (!isRange && typeof value === 'string') {
        result = [value || ''];
    }

    return result;
};

/**
 * Finds the index of the input to focus for a range datepicker.
 * @param {number} currentIndex The current index of the focused element.
 * @returns {number} The index of the other element to focus.
 */
const findNextFocusIndex = (currentIndex: number) => {
    return currentIndex === 0 ? 1 : 0;
};

/**
 * Normalize a range of dates by swapping them if the start date is later than the end date.
 * @param {TRangeValue} values - The range of dates to be normalized.
 * @returns {TRangeValue} The normalized range of dates.
 */
const normalizeRangeDates = (values: TRangeValue) => {
    const [start, end] = values;
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();

    if (startTimestamp > endTimestamp) {
        return [end || '', start || ''];
    }

    return [start || '', end || ''];
};

/**
 * Compares two arrays of dates and returns whether they are equal.
 * @param {TDatePickerValue[]} a - The first array of dates to compare.
 * @param {TDatePickerValue[]} b - The second array of dates to compare.
 * @returns {boolean} true if the dates are equal, false otherwise.
 */
const compareDateValues = (a: TDatePickerValue[], b: TDatePickerValue[]) => {
    const isEqual = a.every((value, index) => {
        if (!value && !b[index]) {
            return true;
        }

        return new Date(value).getTime() === new Date(b[index]).getTime();
    });

    return isEqual;
};

/** async load dayjs for formatting */
let dayjs: typeof import('dayjs');
const loadDayjs = async (): Promise<typeof import('dayjs')> => {
    if (!dayjs) {
        const { default: dayjsImport } = await import('dayjs');
        dayjs = dayjsImport;
    }

    return dayjs;
};

export const DatePicker = <IsRange extends boolean = false>({
    view,
    className,
    label,
    error,
    disabled,
    suffix,
    prefix,
    isRange = false as IsRange,
    placeholder,
    value,
    format,
    onFocus,
    onBlur,
    onChange,
    ...props
}: TProps<IsRange>) => {
    // Values
    const [inputValue, setInputValue] = useState<TDatePickerValue[]>(sanitizeValue({ isRange, value }));
    const updateInputValue = (value: TDatePickerValue[]) => {
        let resultValue = value;

        if (dayjs && format) {
            resultValue = resultValue.map((date) => (date ? dayjs(date).format(format) : ''));
        }

        setInputValue(resultValue);
    };

    // Calendar instance
    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarElRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false); // use additional ref because setCalendar is asynchronous and for strict mode executes twice in refCallback

    // Inputs
    const [focused, setFocused] = useState(false);
    const [filled, setFilled] = useState(Boolean(inputValue.some((x) => x)));
    const focusedInputIdx = useRef<number | null>(null);
    const inputContainerRef = useRef<HTMLDivElement | null>(null);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
        inputRefs.current[index] = el;
    };

    /** Async load date format lib if prop "format" is provided */
    useEffect(() => {
        if (format && format !== 'YYYY-MM-DD') {
            loadDayjs(); // TODO: should inputValue be updated here?
        }
    }, [format]);

    /** Focuses the next input in the input array */
    const focusNextInput = () => {
        if (!isRange) {
            return;
        }

        const nextFocusIdx = findNextFocusIndex(focusedInputIdx.current || 0);
        inputRefs.current[nextFocusIdx]?.focus();
    };

    /**
     * Handles calendar close, sync states and triggering onChange
     * @param {Object} payload
     * @param {Calendar['context']} payload.calendarCtx - Current calendar context containing selected dates
     */
    const handleCalendarClose = ({ calendarCtx }: { calendarCtx: Calendar['context'] }) => {
        setIsCalendarOpen(false);
        const calendarDates = calendarCtx.selectedDates || [];
        const isAllDatesSelected = calendarDates.length === inputValue.length && calendarDates.every((date) => date);

        if (!isAllDatesSelected) {
            // Case 1: Not all required dates are selected - reset everything
            const emptyValue = isRange ? ['', ''] : [''];
            setInputValue(emptyValue);
            setFilled(false);
            calendar?.set({ selectedDates: [] });

            // Trigger onChange TODO: check if values are really changes
            typeof onChange === 'function' &&
                onChange((isRange ? emptyValue : emptyValue[0]) as TOnChangeParams<IsRange>);
        } else {
            // Case 2: All dates are properly selected - update state
            setFilled(true);

            // Only update input if dates don't match current input values
            !compareDateValues(calendarDates, inputValue) && updateInputValue(calendarDates);

            // Trigger onChange
            typeof onChange === 'function' &&
                onChange((isRange ? calendarDates : calendarDates[0]) as TOnChangeParams<IsRange>);
        }
    };

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
                selectedDates: inputValue,
                selectionDatesMode: isRange ? 'multiple-ranged' : 'single',
                enableDateToggle: false,
                onClickDate(self) {
                    const { selectedDates } = self.context;
                    if (!selectedDates) {
                        return;
                    }

                    let result: string[] = isRange
                        ? [selectedDates[0] || '', selectedDates[1] || '']
                        : [selectedDates[0] || ''];

                    // special case for range when the second input is focused
                    if (isRange && focusedInputIdx.current === 1 && selectedDates.length === 1) {
                        result = ['', selectedDates[0] || ''];
                    }

                    updateInputValue(result);

                    if (result.every((x) => x)) {
                        // Close calendar if all dates are selected
                        handleCalendarClose({ calendarCtx: self.context });
                    } else {
                        // Focus next input
                        focusNextInput();
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
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsCalendarOpen(true);
        setFocused(true);
        focusedInputIdx.current = Number(e.target.dataset.inputIndex);
        onFocus?.(e);
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        calendar?.context.selectedDates.some((item) => item) ? setFilled(true) : setFilled(false); // TODO: maybe change condition to check inputs value. NOTE: there is enough to check only one value is filled
        onBlur?.(e);

        // Check if focus moved to another elem inside the DatePicker
        calendar &&
            setTimeout(() => {
                const activeEl = document.activeElement;
                const isFocusStillInside =
                    inputContainerRef.current?.contains(activeEl) || calendarElRef.current?.contains(activeEl);

                if (!isFocusStillInside) {
                    handleCalendarClose({ calendarCtx: calendar.context });
                }
            }, 0); // Needed because activeElement updates after onBlur
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!calendar) {
            return;
        }

        if (e.key === 'Enter') {
            const isFocusNext = isRange && focusedInputIdx.current === 0;
            isFocusNext ? focusNextInput() : handleCalendarClose({ calendarCtx: calendar.context });
        }
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
            calendar?.set({ selectedDates: normalizeRangeDates(calendarDates) });
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
            calendar?.context && handleCalendarClose({ calendarCtx: calendar.context });
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
                    rootRef={inputContainerRef}
                    suffix={suffix}
                    view={view}
                >
                    <div className="flex h-full w-full" data-input-container="true">
                        <InputAtomic
                            {...props}
                            ref={setInputRef(0)}
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
                            onKeyDown={handleKeyDown}
                        />
                        {isRange && (
                            <InputAtomic
                                {...props}
                                ref={setInputRef(1)}
                                data-input-index={1}
                                disabled={disabled}
                                placeholder={placeholder?.[1]}
                                value={inputValue[1]}
                                onBlur={handleBlur}
                                onChange={handleInputChange}
                                onFocus={handleFocus}
                                onKeyDown={handleKeyDown}
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
};
