import { DEFAULT_FORMAT } from './Datepicker.constants';

export type TDatePickerValue = string;
export type TRangeValue = TDatePickerValue[];
export type TSingleValue = TDatePickerValue;
export type TShadowValue = {
    dateInMs: number;
    timeInMs: number;
};

/** Async load dayjs for formatting */
export let dayjs: typeof import('dayjs');
export const loadDayjs = async (): Promise<typeof import('dayjs')> => {
    if (!dayjs) {
        const { default: dayjsImport } = await import('dayjs');
        const { default: customParseFormat } = await import('dayjs/plugin/customParseFormat'); // for correct parsing
        dayjs = dayjsImport;
        dayjs.extend(customParseFormat);
    }

    return dayjs;
};

/**
 * Sanitizes the value for calendar usage.
 * - For range mode (isRange=true): Ensures value is [string, string] (defaults to ['', ''] if invalid)
 * - For single mode (isRange=false): Ensures value is [string] (defaults to [''] if invalid)
 * @param {object} props
 * @prop {boolean} props.isRange - Whether the value should be interpreted as a range of dates or a single date.
 * @prop {TRangeValue | TSingleValue} [props.value] - The value to be sanitized.
 * @returns {TDatePickerValue[]} The sanitized value.
 */
export const sanitizeValue = ({
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
export const findNextFocusIndex = (currentIndex: number) => {
    return currentIndex === 0 ? 1 : 0;
};

/**
 * Normalize a range of dates by swapping them if the start date is later than the end date.
 * @param {TRangeValue | TShadowValue[]} values - The range of dates to be normalized.
 * @returns {TRangeValue | TShadowValue[]} The normalized range of dates.
 */
export const normalizeRangeDates = <T extends TRangeValue | TShadowValue[]>(values: T): T => {
    const [start, end] = values;
    const startTimestamp =
        typeof start === 'string' ? new Date(start).getTime() : new Date(start.dateInMs + start.timeInMs).getTime();
    const endTimestamp =
        typeof end === 'string' ? new Date(end).getTime() : new Date(end.dateInMs + end.timeInMs).getTime();

    if (startTimestamp > endTimestamp) {
        return [end, start] as T;
    }

    return [start, end] as T;
};

/**
 * Compares two arrays of dates and returns whether they are equal.
 * @param {TDatePickerValue[]} a - The first array of dates(date string or timestamp) to compare.
 * @param {TDatePickerValue[]} b - The second array of dates(date string or timestamp) to compare.
 * @returns {boolean} true if the dates are equal, false otherwise.
 */
export const compareDateValues = (a: TDatePickerValue[] | number[], b: TDatePickerValue[] | number[]) => {
    const isEqual = a.every((value, index) => {
        if (!value && !b[index]) {
            return true;
        }

        return new Date(value).getTime() === new Date(b[index]).getTime();
    });

    return isEqual;
};

/**
 * Converts time in HH:mm format to total milliseconds
 * @param timeString Time string in HH:mm format (e.g., "02:30")
 * @returns Total milliseconds (e.g., 9000 * 1000 for "02:30")
 */
export const convertTimeToMs = (timeString: string): number => {
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
        return 0;
    }
    const [hours, minutes] = timeString.split(':').map(Number);

    return (hours * 3600 + minutes * 60) * 1000;
};

/**
 * Converts milliseconds to HH:mm time format
 * @param ms Duration in milliseconds (e.g., 9000000 for "02:30")
 * @returns Time string in HH:mm format (e.g., "02:30")
 */
export const convertMsToTime = (ms: number): string => {
    if (ms <= 0) return '00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `0${hours}`.slice(-2) + ':' + `0${minutes}`.slice(-2);
};

export const separateDateAndTime = ({
    value,
    withTime = false
}: {
    value: TDatePickerValue;
    withTime?: boolean;
}): TShadowValue => {
    try {
        if (!withTime) {
            return { dateInMs: value ? new Date(value).getTime() : 0, timeInMs: 0 };
        }

        let date = dayjs(value);

        // Get time in milliseconds
        const hours = date.get('hour');
        const minutes = date.get('minute');
        const timeInMs = (hours * 3600 + minutes * 60) * 1000;

        // Get date with zero time in milliseconds
        date = date.hour(0).minute(0).second(0);
        const dateInMs = date.unix() * 1000;

        return { dateInMs, timeInMs };
    } catch (error) {
        return { dateInMs: 0, timeInMs: 0 };
    }
};

export const formatDates = ({
    value,
    format
}: {
    value: TShadowValue[] | TDatePickerValue[];
    format?: string;
}): TDatePickerValue[] => {
    const resultTimestamps = value.map((x) => {
        if (typeof x === 'string') {
            return new Date(x).getTime();
        }

        return x.dateInMs + x.timeInMs;
    });
    let resultValue = [];

    if (dayjs && format) {
        resultValue = resultTimestamps.map((timestamp) => (timestamp ? dayjs(timestamp).format(format) : ''));
    } else {
        resultValue = resultTimestamps.map((timestamp) =>
            timestamp ? new Date(timestamp).toISOString().slice(0, 10) : ''
        );
    }

    return resultValue;
};

/**
 * Validates whether a given date string is correct based on the provided format.
 * @param {object} params - The parameters object.
 * @param {string} params.value - The date string to validate.
 * @param {string} [params.format] - The format to validate against. Uses default format if not specified.
 * @returns {boolean} true if the date string is valid, false otherwise.
 */
export const checkDateIsCorrect = ({ value, format }: { value: string; format?: string }): boolean => {
    if (format && format !== DEFAULT_FORMAT) {
        try {
            return dayjs(value, format, true).isValid();
        } catch (error) {
            // TODO: handle error
            return false;
        }
    }

    return value?.length === 10 && !isNaN(new Date(value)?.getTime());
};
