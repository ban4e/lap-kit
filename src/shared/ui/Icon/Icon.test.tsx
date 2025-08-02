import { render, renderHook, waitFor } from '@testing-library/react';

import { Icon } from './Icon';
import { useDynamicSvgImport } from './useDynamicSvgImport';

describe('Icon component', () => {
    test('Dynamic SVG import correctly resolves dependencies', async () => {
        const { result } = renderHook(() => useDynamicSvgImport('calendar'));
        await waitFor(() => {
            expect(result.current.iconInfo).not.toBeNull();
        });

        expect(result.current.iconInfo?.component).toBeDefined();
        expect(result.current.iconInfo?.width).toBeDefined();
        expect(result.current.iconInfo?.height).toBeDefined();
    });

    test('Icon component renders SVG in DOM', async () => {
        // Arrange
        const { findByTestId } = render(<Icon name="calendar" />);
        const icon = await findByTestId('mock-svg'); // component uses dynamic SVG import, so it takes time to resolve it

        // Assert
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('viewBox');
    });
});
