import { ChangeEvent, FocusEvent, forwardRef, useState } from 'react';

import { FieldContainer } from '@/shared/ui/FieldContainer';

import InputAtomic from './InputAtomic';

interface FieldContainerProps extends React.ComponentPropsWithoutRef<typeof FieldContainer> {}
interface InputAtomicProps extends React.ComponentPropsWithRef<typeof InputAtomic> {}

interface InputProps extends Omit<FieldContainerProps, 'children'>, Omit<InputAtomicProps, keyof FieldContainerProps> {}

const Input = forwardRef<HTMLInputElement, InputProps>(function InputField(
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

export default Input;
