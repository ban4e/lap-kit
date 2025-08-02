import React, { ReactElement, useEffect, useState } from 'react';

export async function importIcon(name: string): Promise<React.FC<React.SVGProps<SVGElement>>> {
    return (await import(`@assets/icons/${name}.svg`)).default;
}

export function useDynamicSvgImport(iconName: string) {
    const [iconInfo, setIconInfo] = useState<{
        component: React.FC<React.SVGProps<SVGElement>>;
        width: number;
        height: number;
    } | null>(null);
    const [error, setError] = useState<unknown>();

    useEffect(() => {
        // Dynamically import the mentioned svg icon name in props
        const importSvgIcon = async (): Promise<void> => {
            // Please make sure all your svg icons are placed in the same directory
            // If we want that part to be configurable then instead of iconName we will send iconPath as prop
            try {
                // NOTE: Template string causes error in IntelliJ IDEA
                const svgComponent = await importIcon(iconName); // SVGR provides ReactComponent for given svg path
                const componentData = svgComponent?.({}) as ReactElement<React.SVGProps<SVGElement>>;
                const width = componentData?.props?.width;
                const height = componentData?.props?.height;
                if (svgComponent && typeof width === 'number' && typeof height === 'number') {
                    setIconInfo({ component: svgComponent, width, height });
                }
            } catch (err) {
                console.error(err);
                setError(err);
            }
        };

        importSvgIcon();
    }, [iconName]);

    return { error, iconInfo };
}
