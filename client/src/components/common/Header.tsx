import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';
import { getInitials } from '../../utils/helpers';
import { ThemeColorPalette } from '../ui/BackgroundColor';

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showMobileThemePalette, setShowMobileThemePalette] = useState(false);
    const location = useLocation();

    const isActiveLink = (path: string) => location.pathname === path;

    const activeClasses = 'text-indigo-700 font-semibold';
    const inactiveClasses = 'text-gray-600 hover:text-indigo-600 transition-colors';

    return (
        <header className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md border-b border-indigo-100 relative z-50">
            <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                    InduHenna
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-6">
                    {['/designs', '/artists', '/my-appointments'].map((path) => (
                        <Link
                            key={path}
                            to={path}
                            className={`${isActiveLink(path) ? activeClasses : inactiveClasses}`}
                        >
                            {path.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Link>
                    ))}

                    {isAuthenticated ? (
                        <div className="relative group">
                            <button className="flex items-center gap-2 focus:outline-none">
                                {user?.avatar?.url ? (
                                    <img
                                        src={user.avatar.url}
                                        alt="User Avatar"
                                        className="w-9 h-9 rounded-full border border-indigo-200 object-cover"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                                        {getInitials(user?.firstName, user?.lastName)}
                                    </div>
                                )}
                                <span className="text-gray-700">{user?.firstName}</span>
                            </button>
                            <div className="absolute right-0 mt-0 w-65 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 hidden group-hover:block">
                                <Link
                                    to="/profile"
                                    className={`block px-4 py-2 text-sm ${inactiveClasses} ${isActiveLink('/profile') ? 'bg-indigo-50' : ''}`}
                                >
                                    Profile
                                </Link>
                                {user?.role === 'artist' && (
                                    <Link
                                        to="/artist/dashboard"
                                        className={`block px-4 py-2 text-sm ${inactiveClasses} ${isActiveLink('/artist/dashboard') ? 'bg-indigo-50' : ''}`}
                                    >
                                        Artist Dashboard
                                    </Link>
                                )}
                                <Link
                                    to="/settings"
                                    className={`block px-4 py-2 text-sm ${inactiveClasses} ${isActiveLink('/settings') ? 'bg-indigo-50' : ''}`}
                                >
                                    Settings
                                </Link>
                                <button
                                    onClick={logout}
                                    className="w-full text-left text-sm text-red-500 hover:bg-red-50 px-4 py-2"
                                >
                                    Logout
                                </button>
                                <div className="px-4 py-3">
                                    <ThemeColorPalette />
                                </div>
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

                {/* Mobile Menu Toggle */}
                <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 focus:outline-none">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </nav>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-indigo-100 shadow-lg">
                    <div className="px-4 py-5 flex flex-col space-y-4 text-center">
                        {['/designs', '/artists', '/my-appointments'].map((path) => (
                            <div key={path}>
                                <Link
                                    to={path}
                                    className={`block ${isActiveLink(path) ? activeClasses : inactiveClasses}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {path.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Link>
                            </div>
                        ))}

                        {isAuthenticated ? (
                            <>
                                <div>
                                    <Link
                                        to="/profile"
                                        className={`block ${inactiveClasses}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                </div>
                                {user?.role === 'artist' && (
                                    <div>
                                        <Link
                                            to="/artist/dashboard"
                                            className={`block ${inactiveClasses}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Artist Dashboard
                                        </Link>
                                    </div>
                                )}
                                <div>
                                    <Link
                                        to="/settings"
                                        className={`block ${inactiveClasses}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                </div>
                                <div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full"
                                    >
                                        Logout
                                    </Button>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => setShowMobileThemePalette(!showMobileThemePalette)}
                                        className="text-sm text-indigo-600 underline"
                                    >
                                        {showMobileThemePalette ? "Hide" : "Show"} Theme Colors
                                    </button>
                                    {showMobileThemePalette && (
                                        <div className="pt-3">
                                            <ThemeColorPalette />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">Login</Button>
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="primary" className="w-full">Register</Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

        </header>
    );
};

export default Header;
