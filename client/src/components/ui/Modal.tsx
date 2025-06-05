import React, { type ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className={`bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative ${className}`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                >
                    &times;
                </button>
                {title && <h2 className="text-2xl font-bold mb-4 border-b pb-2">{title}</h2>}
                <div>{children}</div>
            </div>
        </div>,
        document.getElementById('modal-root') || document.body // Ensure you have a #modal-root in your index.html
    );
};

export default Modal;