import classNames, { ArgumentArray } from 'classnames';
import { twMerge } from 'tailwind-merge';

export function cn(...args: ArgumentArray) {
    return twMerge(classNames(args));
}

export type { Argument, ArgumentArray } from 'classnames';
