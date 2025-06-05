import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';
import { getInitials } from '../../utils/helpers';

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="bg-white shadow-md">
            <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600">
                    MehendiApp
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link to="/designs" className="text-gray-600 hover:text-indigo-600 transition-colors">
                        Designs
                    </Link>
                    <Link to="/artists" className="text-gray-600 hover:text-indigo-600 transition-colors">
                        Artists
                    </Link>
                    <Link to="/book-appointment" className="text-gray-600 hover:text-indigo-600 transition-colors">
                        Book Appointment
                    </Link>
                    {isAuthenticated ? (
                        <div className="relative group">
                            <button className="flex items-center space-x-2 focus:outline-none">
                                {user?.avatar?.url ? (
                                    <img src={user.avatar.url} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {getInitials(user?.firstName, user?.lastName)}
                                    </div>
                                )}
                                <span className="text-gray-700">{user?.firstName}</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 hidden group-hover:block">
                                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    Profile
                                </Link>
                                {user?.role === 'artist' && (
                                    <Link to="/artist/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                        Artist Dashboard
                                    </Link>
                                )}
                                <button
                                    onClick={logout}
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="outline" size="small">Login</Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="primary" size="small">Register</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 focus:outline-none">
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {isMobileMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12"></path>
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16"></path>
                            )}
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white shadow-lg pb-4">
                    <div className="flex flex-col items-center space-y-4">
                        <Link to="/designs" className="text-gray-600 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>
                            Designs
                        </Link>
                        <Link to="/artists" className="text-gray-600 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>
                            Artists
                        </Link>
                        <Link to="/book-appointment" className="text-gray-600 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>
                            Book Appointment
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" className="text-gray-600 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>
                                    Profile
                                </Link>
                                {user?.role === 'artist' && (
                                    <Link to="/artist/dashboard" className="text-gray-600 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>
                                        Artist Dashboard
                                    </Link>
                                )}
                                <Button variant="outline" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline">Login</Button>
                                </Link>
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="primary">Register</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;