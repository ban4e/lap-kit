import React, { FC } from 'react';

import useDynamicSvgImport from './useDynamicSvgImport';

interface IIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
}

const Icon: FC<IIconProps> = ({ name, width, height, ...attrs }) => {
    const { error, loading, IconComponent, size } = useDynamicSvgImport(name);

    if (error || !IconComponent || !size || loading) {
        return null;
    }

    const iconSize = (() => {
        let resultWidth: number = size.width;
        let resultHeight: number = size.height;
        const propWidth = Number(width);
        const propHeight = Number(height);
        if (propWidth && !propHeight) {
            resultWidth = propWidth;
            resultHeight = (size.height * propWidth) / size.width;
        } else if (!propWidth && propHeight) {
            resultWidth = (size.width * propHeight) / size.height;
            resultHeight = propHeight;
        } else if (propWidth && propHeight) {
            resultWidth = propWidth;
            resultHeight = propHeight;
        }

        return { width: resultWidth, height: resultHeight };
    })();

    return <IconComponent height={iconSize.height} width={iconSize.width} {...attrs} />;
};

export default Icon;
