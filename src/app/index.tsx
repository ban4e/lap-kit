import { useState } from 'react';

import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Input } from '@/shared/ui/Input';

const App = () => {
    const [count, setCount] = useState(0);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <h1>
                Vite + React <Icon name="check" />{' '}
            </h1>
            <div className="mt-4 flex flex-col items-stretch gap-4">
                <Input error="Error text" label="Your label here" />
                <Input error="Error text" label="Your label here" view="filled" />
                <Input label="Your title here" view="clear" />
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
