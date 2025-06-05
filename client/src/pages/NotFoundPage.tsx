import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-100 text-center px-4">
            <h1 className="text-9xl font-extrabold text-indigo-600 mb-4">404</h1>
            <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Page Not Found</p>
            <p className="text-lg text-gray-600 mb-8">
                Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/">
                <Button variant="primary" size="large">Go to Homepage</Button>
            </Link>
        </div>
    );
};

export default NotFoundPage;