import React, { createElement } from 'react';

// NOTE: Mock implementation for SVG imports because vitest can't resolve dynamic SVG imports in file `useDynamicSvgImport.ts`
const createSvgElementObject = (props: React.SVGProps<SVGSVGElement>) => {
    return createElement('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'data-testid': 'mock-svg',
        ...props
    });
};
const svgMock = (props: React.SVGProps<SVGSVGElement>) => createSvgElementObject(props);

export default svgMock;
