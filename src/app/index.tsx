import { useState } from 'react';

import { Button } from '@/shared/ui/Button';
import { DatePicker } from '@/shared/ui/Datepicker';
import { Icon } from '@/shared/ui/Icon';
import { Input } from '@/shared/ui/Input';
import { RangeSlider } from '@/shared/ui/RangeSlider';
import { Select } from '@/shared/ui/Select';
import { Toggle } from '@/shared/ui/Toggle';
import { Tooltip } from '@/shared/ui/Tooltip';

const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
];

const range = { min: 1300, max: 3250 };
const pips = {
    mode: 'positions' as const,
    values: [0, 25, 50, 75, 100],
    density: 5,
    stepped: true
};
const tooltipsRangeSlider = [{ to: (val: number) => Number.parseInt(val.toString(), 10) }];

export const App = () => {
    const [count, setCount] = useState(0);
    const [isDatePickerShow, setIsDatePickerShow] = useState(true);
    const [dateVal, setDateVal] = useState(['2025-06-30 04:31:00', '2025-07-02']);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <h1>
                Vite + React <Icon name="check" />{' '}
            </h1>
            <div className="mt-4 flex flex-col items-stretch gap-4">
                <Input error="Error text" label="Your label here" prefix="kg" suffix="mass" />
                <Input label="Your label here" prefix="kg" suffix="mass" view="filled" />
                <Input label="Your label here" view="filled" />
                <Input label="Your title here" prefix="kg" view="clear" />
                <Select isClearable isSearchable label="Your label here" options={options} suffix="kg" />
                <Select label="Your label here" options={options} suffix="kg" view="filled" menuPortalTarget={null} />
                <Select isMulti={true} label="Your label here" options={options} view="filled" menuPortalTarget={null} />
                <RangeSlider
                    connect="lower"
                    pips={pips}
                    range={range}
                    start={1500}
                    step={20}
                    tooltips={tooltipsRangeSlider}
                />
                {isDatePickerShow && (
                    <DatePicker
                        format="YYYY-MM-DD HH:mm:ss"
                        isRange
                        label="Select dates"
                        placeholder={['Start date', 'End date']}
                        value={dateVal}
                        withTime
                        onChange={(date) => {
                            setDateVal(date);
                        }}
                    />
                )}
                <RangeSlider
                    className="h-36"
                    connect="lower"
                    direction="rtl"
                    orientation="vertical"
                    pips={pips}
                    range={range}
                    start={1500}
                    step={20}
                    tooltips={tooltipsRangeSlider}
                />
                <div>
                    <Tooltip placement="left">
                        <Tooltip.Trigger />
                        <Tooltip.Content>123</Tooltip.Content>
                    </Tooltip>
                </div>
                <div>
                    <Toggle checked={isDatePickerShow} onChange={() => setIsDatePickerShow((prev) => !prev)}>
                        Checkbox
                        <br /> 2 line
                    </Toggle>
                </div>
                <div>
                    <Toggle className="mr-4" name="group-1" type="radio">
                        Radio 1
                    </Toggle>
                    <Toggle name="group-1" type="radio">
                        Radio 2
                    </Toggle>
                </div>
                <Button href="/" tag="a">
                    Link
                </Button>
                <Button>Button</Button>
                <button onClick={() => setCount((cnt) => cnt + 1)}>count is {count}</button>
            </div>
        </div>
    );
};
