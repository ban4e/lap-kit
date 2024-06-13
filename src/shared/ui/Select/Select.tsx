// TODO: investigate problem with ts errors. Imporve displaying multiple select
import cn from 'classnames';
import { forwardRef, useState } from 'react';
import ReactSelect, {
    ActionMeta,
    MultiValue,
    Props as ReactSelectProps,
    SelectInstance,
    SingleValue
} from 'react-select';

import { FieldContainer } from '@/shared/ui/FieldContainer';

import styles from './Select.module.css';

interface FieldContainerProps extends React.ComponentPropsWithoutRef<typeof FieldContainer> {}
interface SelectProps<Option = unknown>
    extends Omit<FieldContainerProps, 'children'>, // ReactSelect is a children
    Omit<ReactSelectProps<Option>, keyof FieldContainerProps> {}

type OptionType = { label: string; value: number | string };
type OnChange = (
    value: SingleValue<OptionType> | MultiValue<OptionType> | null,
    actionMeta: ActionMeta<OptionType>
) => void;

const Select = forwardRef<SelectInstance, SelectProps<OptionType>>(function SelectField(
    { view, className, label, error, disabled, suffix, prefix, ...props },
    ref
) {
    const [focused, setFocused] = useState(false);
    const [filled, setFilled] = useState(false);

    const handleChange: OnChange = (option, meta) => {
        option ? setFilled(true) : setFilled(false);
        props.onChange && props.onChange(option, meta);
    };

    const handleBlur = () => {
        setFocused(false);
    };

    return (
        <FieldContainer isFilled={filled} isFocused={focused} label="Your title here">
            <ReactSelect
                {...props}
                ref={ref}
                classNames={{
                    container: () => styles.select,
                    control: () => styles['select-control'],
                    menu: () => styles['select-menu'],
                    option: (state) =>
                        cn([
                            styles['select-option'],
                            {
                                [styles['select-option_selected']]: state.isSelected
                            }
                        ])
                }}
                placeholder=""
                unstyled
                onBlur={handleBlur}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
            />
        </FieldContainer>
    );
});

export default Select;
