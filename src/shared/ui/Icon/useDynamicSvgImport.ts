import React, { ReactElement, useEffect, useRef, useState } from 'react';

export default function useDynamicSvgImport(iconName: string) {
    const importedIconRef = useRef<React.FC<React.SVGProps<SVGElement>>>();
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>();

    useEffect(() => {
        // Dynamically import the mentioned svg icon name in props
        const importSvgIcon = async (): Promise<void> => {
            setLoading(true);
            // Please make sure all your svg icons are placed in the same directory
            // If we want that part to be configurable then instead of iconName we will send iconPath as prop
            try {
                // NOTE: Template string causes error in IntelliJ IDEA IDE
                // eslint-disable-next-line prefer-template
                importedIconRef.current = (await import(`@assets/icons/${iconName}.svg`)).default; // SVGR provides ReactComponent for given svg path
                const componentData = importedIconRef.current?.({});
                const width = (componentData as ReactElement)?.props?.width;
                const height = (componentData as ReactElement)?.props?.height;
                if (typeof width === 'number' && typeof height === 'number') {
                    setSize({ width, height });
                }
            } catch (err) {
                setError(err);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        (async () => importSvgIcon())();
    }, [iconName]);

    return { error, loading, IconComponent: importedIconRef.current, size };
}
