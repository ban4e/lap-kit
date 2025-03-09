import { create, API as TSliderBase, target as TargetElement, Options as SliderOptions } from 'nouislider';
import { useEffect, useRef } from 'react';
import './RangeSlider.css';

type TProps = Omit<SliderOptions, 'start'> &
    Required<Pick<SliderOptions, 'start'>> & {
        onChange?: Parameters<TSliderBase['on']>[1];
    };

export const RangeSlider = ({ onChange, ...options }: TProps) => {
    const containerRef = useRef<TargetElement | null>(null);
    const sliderInstRef = useRef<TSliderBase | null>(null);

    /** Init and cleanup */
    useEffect(() => {
        if (!options.range || !options.start || !containerRef.current || containerRef.current?.noUiSlider) {
            return;
        }

        sliderInstRef.current = create(containerRef.current, {
            ...options,
            cssPrefix: 'range-'
        });

        return () => {
            sliderInstRef.current?.destroy();
            sliderInstRef.current = null;
        };
    }, [options.range, options.start]);

    /** Events */
    useEffect(() => {
        typeof onChange === 'function' && sliderInstRef.current?.on('change', onChange);

        return () => {
            sliderInstRef.current?.off('change');
        };
    }, [onChange]);

    return <span ref={containerRef}></span>;
};
