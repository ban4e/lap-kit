import { UseFloatingOptions } from '@floating-ui/react';
import cn from 'classnames';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Calendar, type Options } from 'vanilla-calendar-pro';

import 'vanilla-calendar-pro/styles/index.css';
import { FieldContainer } from '@/shared/ui/FieldContainer';
import { Icon } from '@/shared/ui/Icon';
import { InputAtomic } from '@/shared/ui/Input';
import { Tooltip } from '@/shared/ui/Tooltip';

import { DEFAULT_FORMAT } from './Datepicker.constants';
import {
    type TRangeValue,
    type TSingleValue,
    type TDatePickerValue,
    sanitizeValue,
    TShadowValue,
    separateDateAndTime,
    formatDates,
    loadDayjs,
    findNextFocusIndex,
    compareDateValues,
    convertTimeToMs,
    normalizeRangeDates,
    checkDateIsCorrect,
    convertMsToTime
} from './Datepicker.utils';

type FieldContainerProps = React.ComponentPropsWithoutRef<typeof FieldContainer>;
type InputProps = React.ComponentPropsWithRef<'input'>;

type TProps<IsRange extends boolean = false> = Omit<FieldContainerProps, 'children'> &
    Omit<InputProps, keyof FieldContainerProps | 'type' | 'onChange' | 'value' | 'placeholder'> & {
        type?: 'date' | 'datetime' | 'year' | 'month' | 'time';
        isRange?: IsRange;
        value?: IsRange extends true ? TRangeValue : TSingleValue;
        onChange?: (newValue: IsRange extends true ? TRangeValue : TSingleValue) => void;
        placeholder?: IsRange extends true ? string | [string, string] : string;
        ref?: React.RefObject<Calendar> | React.RefCallback<Calendar>;
        /** Date format. See https://day.js.org/docs/en/display/format */
        format?: string;
        withTime?: boolean;
    };
type TOnChangeParams<IsRange extends boolean = false> = Parameters<Exclude<TProps<IsRange>['onChange'], undefined>>[0];

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
    withTime,
    onFocus,
    onBlur,
    onChange,
    ...props
}: TProps<IsRange>) => {
    // Calendar instance
    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarElRef = useRef<HTMLDivElement | null>(null);
    const calendarContainerRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false); // use additional ref because setCalendar is asynchronous and for strict mode executes twice in refCallback
    const isTimeChanged = useRef(false); // flag to check if time was changed using calendar controls for preventing invoke method "set" of the calendar

    // Values
    const [inputValue, setInputValue] = useState<TDatePickerValue[]>(sanitizeValue({ isRange, value }));
    // Store timestamps of last valid selected datetimes for comparison
    const shadowValue = useRef<TShadowValue[]>([]);
    if (!shadowValue.current.length) {
        shadowValue.current = inputValue.map((date) => separateDateAndTime({ value: date, withTime }));
    }

    const updateShadowValue = ({ index, date, time }: { index: number; date?: number; time?: number }) => {
        if (shadowValue.current[index]) {
            const updatedValue: Partial<TShadowValue> = { dateInMs: date || 0, timeInMs: time || 0 };

            date === undefined && delete updatedValue.dateInMs;
            time === undefined && delete updatedValue.timeInMs;

            shadowValue.current[index] = {
                ...shadowValue.current[index],
                ...updatedValue
            };
        }
    };

    const updateInputValue = () => {
        setInputValue(formatDates({ value: shadowValue.current, format }));
    };
    const clearValue = () => {
        const emptyShadowValue = separateDateAndTime({ value: '' });
        const emptyValue = isRange ? ['', ''] : [''];
        shadowValue.current = isRange ? [emptyShadowValue, emptyShadowValue] : [emptyShadowValue];
        setInputValue(emptyValue);
        calendar?.set({ selectedDates: [] });

        // Trigger onChange only if value is changed
        if (typeof onChange === 'function' && !compareDateValues(emptyValue, sanitizeValue({ isRange, value }))) {
            onChange((isRange ? emptyValue : emptyValue[0]) as TOnChangeParams<IsRange>);
        }
    };
    const handleClearPointerDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // stop focus on input
        clearValue();
    };

    /** Update dates in calendar on input change */
    useEffect(() => {
        const isCorrectDates = inputValue.every((date) => checkDateIsCorrect({ value: date, format }));

        if (isCorrectDates && !isTimeChanged.current) {
            calendar?.set(
                {
                    selectedDates: normalizeRangeDates(
                        formatDates({
                            value: inputValue,
                            format: DEFAULT_FORMAT
                        })
                    )
                },
                // update only dates in calendar
                {
                    year: false,
                    month: false,
                    dates: true,
                    time: false
                }
            );
        }

        isTimeChanged.current = false;
    }, [calendar, inputValue, format]);

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
        if (format && format !== DEFAULT_FORMAT) {
            // TODO: should inputValue be updated here?
            (async () => {
                await loadDayjs();
                shadowValue.current = inputValue.map((date) => separateDateAndTime({ value: date, withTime }));
            })();
        }
    }, [format, withTime]);

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

            // Trigger onChange only if value is changed
            if (typeof onChange === 'function' && !compareDateValues(emptyValue, sanitizeValue({ isRange, value }))) {
                onChange((isRange ? emptyValue : emptyValue[0]) as TOnChangeParams<IsRange>);
            }
        } else {
            // Case 2: All dates are properly selected - update state
            setFilled(true);

            // Only update input if dates don't match current input values
            shadowValue.current = normalizeRangeDates(shadowValue.current);
            const shadowValueConverted = shadowValue.current.map((x) => x.dateInMs + x.timeInMs);
            !compareDateValues(shadowValueConverted, inputValue) && updateInputValue();

            // Trigger onChange only if value is changed
            if (
                typeof onChange === 'function' &&
                !compareDateValues(shadowValueConverted, sanitizeValue({ isRange, value }))
            ) {
                const result = formatDates({ value: shadowValue.current, format });
                onChange((isRange ? result : result[0]) as TOnChangeParams<IsRange>);
            }
        }
    };

    // TODO: could be optimized?
    const calendarElRefCallback = useCallback(
        (node: HTMLDivElement | null) => {
            calendarElRef.current = node;

            // cleanup calendar instance
            if (!node && calendar) {
                calendar.destroy();
                setCalendar(null);
                initializedRef.current = false;

                return;
            }

            // nothing to do if it has already been initialized
            if (initializedRef.current && calendar) {
                return;
            }

            if (node && !calendar) {
                const calendarOptions: Options = {
                    type: isRange && !withTime ? 'multiple' : 'default',
                    displayMonthsCount: isRange && !withTime ? 2 : 1,
                    monthsToSwitch: 1,
                    selectedDates: formatDates({
                        value: inputValue
                    }),
                    selectionDatesMode: isRange ? 'multiple-ranged' : 'single',
                    enableDateToggle: false,
                    selectionTimeMode: withTime ? 24 : false,
                    // WARNING: This callback captures state values from the render scope (snapshot) when created
                    onClickDate(self) {
                        const { selectedDates } = self.context;
                        const inputIndex = focusedInputIdx.current || 0;

                        let result: string[] = isRange
                            ? [selectedDates[0] || '', selectedDates[1] || '']
                            : [selectedDates[0] || ''];

                        // special case for range when the second input is focused
                        if (isRange && inputIndex === 1 && selectedDates.length === 1) {
                            result = ['', selectedDates[0] || ''];
                        }

                        updateShadowValue({
                            index: inputIndex,
                            date: result[inputIndex]
                                ? separateDateAndTime({ value: result[inputIndex], withTime }).dateInMs
                                : 0
                        });
                        updateInputValue();

                        // Use manual controls for a range datetime picker
                        if (isRange && withTime) {
                            return;
                        }

                        if (result.every((x) => x)) {
                            // Close calendar if all dates are selected
                            handleCalendarClose({ calendarCtx: self.context });
                        } else {
                            // Focus next input
                            focusNextInput();
                        }
                    },
                    // WARNING: This callback captures state values from the render scope (snapshot) when created
                    onChangeTime(self) {
                        const { selectedTime } = self.context;
                        const inputIndex = focusedInputIdx.current || 0;
                        isTimeChanged.current = true;

                        updateShadowValue({
                            index: inputIndex,
                            time: convertTimeToMs(selectedTime)
                        });
                        updateInputValue();
                    }
                };

                const calendarInst = new Calendar(node, calendarOptions);
                setCalendar(calendarInst);
                calendarInst.init();
                initializedRef.current = true;
            }
        },
        [calendar]
    );

    // Focus / blur
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsCalendarOpen(true);
        setFocused(true);
        focusedInputIdx.current = Number(e.target.dataset.inputIndex);
        onFocus?.(e);

        // Set actual time in calendar
        if (withTime) {
            const focusedTime = shadowValue.current[focusedInputIdx.current]?.timeInMs || 0;

            calendar?.set(
                { selectedTime: convertMsToTime(focusedTime) },
                // update only time in calendar
                {
                    year: false,
                    month: false,
                    dates: false,
                    time: true
                }
            );
        }
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        // There is enough to check only one value is filled
        shadowValue.current.some((item) => item) ? setFilled(true) : setFilled(false);
        onBlur?.(e);

        // Check if focus moved to another elem inside the DatePicker
        calendar &&
            setTimeout(() => {
                const activeEl = document.activeElement;
                const isFocusStillInside =
                    inputContainerRef.current?.contains(activeEl) || calendarContainerRef.current?.contains(activeEl);

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

        if (checkDateIsCorrect({ value, format })) {
            const { dateInMs, timeInMs } = separateDateAndTime({ value, withTime });

            updateShadowValue({
                index: inputIndex,
                date: dateInMs,
                time: timeInMs
            });
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
                    className={cn(['group', className])}
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
                    <div className="flex h-full w-full items-center" data-input-container="true">
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
                            <>
                                <div className="mx-2 inline-flex items-center">
                                    <Icon className="fill-gray-300" name="arrow-right" width={16} />
                                </div>
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
                            </>
                        )}
                        <div className="relative z-[1] inline-flex w-4 flex-shrink-0 cursor-pointer items-center justify-center">
                            <Icon className="fill-gray-300 group-hover:hidden" name="calendar" width={16} />
                            <Icon
                                className="hidden fill-gray-300 hover:fill-gray-400 group-hover:block"
                                name="cross"
                                width={12}
                                onPointerDown={handleClearPointerDown}
                            />
                        </div>
                    </div>
                </FieldContainer>
            </Tooltip.Trigger>
            <Tooltip.Content ref={calendarContainerRef} className="rounded-md border p-0">
                <div ref={calendarElRefCallback} />
                {isCalendarOpen && isRange && withTime && (
                    <div className="relative -mt-2 flex justify-end px-4 pb-4">
                        <button
                            className="mr-2 rounded bg-primary px-2.5 py-1 text-white"
                            type="button"
                            onClick={focusNextInput}
                        >
                            Next
                        </button>
                        <button
                            className="rounded bg-primary px-2.5 py-1 text-white"
                            type="button"
                            onClick={() => {
                                calendar && handleCalendarClose({ calendarCtx: calendar.context });
                            }}
                        >
                            Done
                        </button>
                    </div>
                )}
            </Tooltip.Content>
        </Tooltip>
    );
};
