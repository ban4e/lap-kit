import { render, fireEvent } from '@testing-library/react';

import Button from './Button';

describe('Button component', () => {
    const btnText = 'Button text';
    const defaultProps: React.ComponentProps<typeof Button> = {
        children: btnText,
        onClick: jest.fn()
    };

    afterEach(() => {
        jest.clearAllMocks(); // clear onClick mock
    });

    test('Renders button with provided text', () => {
        const { getByText } = render(<Button {...defaultProps} />);
        expect(getByText(btnText)).toBeInTheDocument();
    });

    test('Calls onClick prop when clicked', () => {
        const { getByRole } = render(<Button {...defaultProps} />);
        fireEvent.click(getByRole('button'));
        expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });
});
