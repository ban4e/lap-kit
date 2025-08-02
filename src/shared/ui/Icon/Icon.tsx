import { FC, SVGProps } from 'react';

import { useDynamicSvgImport } from './useDynamicSvgImport';

interface IIconProps extends SVGProps<SVGSVGElement> {
    name: string;
}

export const Icon: FC<IIconProps> = ({ name, width, height, ...attrs }) => {
    const { error, iconInfo } = useDynamicSvgImport(name);

    if (error || !iconInfo) {
        return null;
    }

    const iconSize = (() => {
        let resultWidth: number = iconInfo.width;
        let resultHeight: number = iconInfo.height;
        const propWidth = Number(width);
        const propHeight = Number(height);
        if (propWidth && !propHeight) {
            resultWidth = propWidth;
            resultHeight = (iconInfo.height * propWidth) / iconInfo.width;
        } else if (!propWidth && propHeight) {
            resultWidth = (iconInfo.width * propHeight) / iconInfo.height;
            resultHeight = propHeight;
        } else if (propWidth && propHeight) {
            resultWidth = propWidth;
            resultHeight = propHeight;
        }

        return { width: resultWidth, height: resultHeight };
    })();

    const IconComponent = iconInfo.component;

    return <IconComponent height={iconSize.height} width={iconSize.width} {...attrs} />;
};
