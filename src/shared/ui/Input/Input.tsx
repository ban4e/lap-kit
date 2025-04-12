import { ChangeEvent, FocusEvent, forwardRef, useState } from 'react';

import { FieldContainer } from '@/shared/ui/FieldContainer';

import { InputAtomic } from './InputAtomic';

// NOTE: using type instead of interface to avoid error from eslint@typescript-eslint/no-empty-object-type
type FieldContainerProps = React.ComponentPropsWithoutRef<typeof FieldContainer>;
type InputAtomicProps = React.ComponentPropsWithRef<typeof InputAtomic>;

interface InputProps extends Omit<FieldContainerProps, 'children'>, Omit<InputAtomicProps, keyof FieldContainerProps> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function InputField(
    { view, className, label, error, disabled, suffix, prefix, ...props },
    ref
) {
    const [focused, setFocused] = useState(false);
    const [filled, setFilled] = useState(Boolean(props.value));

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.onChange && props.onChange(e);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        e.target.value ? setFilled(true) : setFilled(false);
    };

    return (
        <FieldContainer
            className={className}
            disabled={disabled}
            error={error}
            isFilled={filled}
            isFocused={focused}
            label={label}
            prefix={prefix}
            suffix={suffix}
            view={view}
        >
            <InputAtomic
                {...props}
                ref={ref}
                disabled={disabled}
                onBlur={handleBlur}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
            />
        </FieldContainer>
    );
});
