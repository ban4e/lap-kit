import { HTMLAttributes } from 'react';

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        // extends React's HTMLAttributes
        [name: `data-${string}`]: string;
    }
}
