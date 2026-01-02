import cn from 'classnames';
import IMask, { FactoryArg } from 'imask';
import { useRef, useEffect, forwardRef } from 'react';

import { useCombinedRefs } from '@/shared/lib/hooks/useCombinedRefs';

enum InputMasks {
    'numeric' = 'numeric'
}

interface InputAtomicProps extends React.ComponentPropsWithRef<'input'> {
    mask?: keyof typeof InputMasks;
}

export const InputAtomic = forwardRef<HTMLInputElement, InputAtomicProps>(function InputAtomic(
    { mask, type = 'text', className = '', ...props },
    ref
) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const combinedRef = useCombinedRefs(ref, inputRef);

    useEffect(() => {
        if (!mask) {
            return;
        }

        let maskOptions: FactoryArg | null = null;

        switch (mask) {
            case 'numeric': {
                maskOptions = {
                    mask: Number,
                    scale: 0, // digits after point, 0 for integers
                    thousandsSeparator: ' '
                };

                break;
            }
            default: {
                maskOptions = { mask };

                break;
            }
        }

        inputRef.current && IMask(inputRef.current, maskOptions); // type guard not working, that's why use type assertion
    }, [inputRef, mask]);

    return <input ref={combinedRef} className={cn(className)} type={type} {...props} />;
});
