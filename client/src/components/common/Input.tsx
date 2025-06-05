import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    id: string;
    error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
    return (
        <div className="mb-4">
            {label && (
                <label htmlFor={id} className="block text-gray-700 text-sm font-bold mb-2">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
        </div>
    );
}

export default Input;