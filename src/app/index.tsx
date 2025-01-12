import { useState } from 'react';

import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Toggle } from '@/shared/ui/Toggle';

const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
];

const App = () => {
    const [count, setCount] = useState(0);

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
                <Select isClearable label="Your label here" options={options} suffix="kg" />
                <Select label="Your label here" options={options} suffix="kg" view="filled" />
                <div>
                    <Toggle>
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

export default App;
