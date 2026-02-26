import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    className,
    label,
    error,
    id,
    ...props
}, ref) => {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-slate-700 ml-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={id}
                className={cn(
                    'block w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 sm:text-sm',
                    error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
                    className
                )}
                {...props}
            />
            {error && <p className="text-sm text-red-600 ml-1 animate-in slide-in-from-top-1 fade-in duration-200">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export { Input };
