import { render, fireEvent } from '@testing-library/react';

import { DatePicker } from './Datepicker';
describe('Datepicker component', () => {
    test('Opens calendar popup on focus', async () => {
        // Arrange
        const { container, findByTestId } = render(<DatePicker />);
        const input = container.querySelector('[data-input-index="0"]') as HTMLInputElement;

        // Act
        fireEvent.click(input);
        const popup = await findByTestId('datepicker-popup');

        // Assert
        expect(popup).toBeVisible();
    });

    test('Updates input value on date selection', async () => {
        // Arrange
        const today = new Date().toISOString().split('T')[0];
        const { findByTestId, container } = render(<DatePicker />);
        const input = container.querySelector('[data-input-index="0"]') as HTMLInputElement;

        // Act
        fireEvent.click(input);
        const popup = await findByTestId('datepicker-popup');
        const currentDateBtn = popup.querySelector('[data-vc-date-today] button');
        fireEvent.click(currentDateBtn!);

        // Assert
        expect(input.value).toBe(today);
    });

    test('Focuses next input by pressing enter for range DatePicker', () => {
        // Arrange
        const { container } = render(<DatePicker isRange />);
        const inputFirst = container.querySelector('[data-input-index="0"]') as HTMLInputElement;
        const inputSecond = container.querySelector('[data-input-index="1"]') as HTMLInputElement;

        // Act
        fireEvent.focus(inputFirst);
        fireEvent.keyDown(inputFirst, { key: 'Enter', code: 'Enter', charCode: 13 });

        // Assert
        expect(inputSecond).toHaveFocus();
    });

    test('DatePicker clears value by clicking clear button', () => {
        // Arrange
        const onChange = vi.fn();
        const { container, getByLabelText } = render(
            <DatePicker isRange value={['2025-01-01', '2025-01-02']} onChange={onChange} />
        );
        const inputFirst = container.querySelector('[data-input-index="0"]') as HTMLInputElement;
        const clearBtn = getByLabelText('clear');

        // Act
        fireEvent.focus(inputFirst);
        fireEvent.click(clearBtn);

        // Assert
        expect(inputFirst).toHaveValue('');
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
