import { useState } from 'react';

const App = () => {
    const [count, setCount] = useState(0);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1>Vite + React</h1>
            <div className="flex flex-col items-center mt-4">
                <button onClick={() => setCount((cnt) => cnt + 1)}>count is {count}</button>
            </div>
        </div>
    );
};

export default App;
