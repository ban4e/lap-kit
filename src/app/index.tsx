import { useState } from 'react';

import { Icon } from '@/shared/ui/Icon';

const App = () => {
    const [count, setCount] = useState(0);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <h1>
                Vite + React <Icon name="check" />{' '}
            </h1>
            <div className="mt-4 flex flex-col items-center">
                <button onClick={() => setCount((cnt) => cnt + 1)}>count is {count}</button>
            </div>
        </div>
    );
};

export default App;
