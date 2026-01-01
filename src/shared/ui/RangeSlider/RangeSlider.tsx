import { create, API as TSliderBase, target as TargetElement, Options as SliderOptions, PipsMode } from 'nouislider';
import { memo, useEffect, useRef } from 'react';

import { cn, type Argument } from '@/shared/lib/utils/classes';
import './RangeSlider.css'; // TODO: change default classes to custom classes

// PipsMode is an enum, so using it in props requires importing the enum. Below types allow setting mode as a string:
type OverrideMode<T extends { mode: PipsMode }, NewMode> = Omit<T, 'mode'> & { mode: NewMode };
type LibPips = Pick<SliderOptions, 'pips'>['pips'];
type RequiredLibPips = Exclude<LibPips, undefined>;
type CustomPips =
    | OverrideMode<Extract<RequiredLibPips, { mode: PipsMode.Steps }>, 'steps'>
    | OverrideMode<Extract<RequiredLibPips, { mode: PipsMode.Range }>, 'range'>
    | OverrideMode<
        /* eslint-disable prettier/prettier */
        Exclude<RequiredLibPips, { mode: PipsMode.Steps } | { mode: PipsMode.Range }>,
        'positions' | 'count' | 'values'
    >;
type TProps = Omit<SliderOptions, 'start' | 'pips'> &
    Required<Pick<SliderOptions, 'start'>> & {
        className?: Argument;
        disabled?: boolean;
        onChange?: Parameters<TSliderBase['on']>[1];
        pips?: CustomPips;
    };

export const RangeSlider = memo(function RangeSlide({ onChange, className, disabled, pips, ...options }: TProps) {
    const containerRef = useRef<TargetElement | null>(null);
    const sliderInstRef = useRef<TSliderBase | null>(null);

    /** Init and cleanup */
    useEffect(() => {
        if (!options.range || !options.start || !containerRef.current || sliderInstRef.current) {
            return;
        }

        sliderInstRef.current = create(containerRef.current, {
            ...options,
            pips: pips as LibPips,
            cssPrefix: options.cssPrefix || 'range-'
        });

        return () => {
            sliderInstRef.current?.destroy();
            sliderInstRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Update the slider when some of options are changed */
    useEffect(() => {
        if (sliderInstRef.current) {
            sliderInstRef.current.updateOptions(
                {
                    ...options,
                    pips: pips as LibPips
                },
                false // `false` prevents the slider from resetting its position
            );
        }
        // Update options only this deps are changed
    }, [options.range, options.start, options.step, pips]);

    /** Disable */
    useEffect(() => {
        if (disabled) {
            sliderInstRef.current?.disable();
        } else {
            sliderInstRef.current?.enable();
        }
    }, [disabled]);

    /** Events */
    useEffect(() => {
        typeof onChange === 'function' && sliderInstRef.current?.on('change', onChange);

        return () => {
            sliderInstRef.current?.off('change');
        };
    }, [onChange]);

    return <span ref={containerRef} aria-disabled={disabled} className={cn(className)}></span>;
});
