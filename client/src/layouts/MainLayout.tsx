import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useThemeStore } from '../store/useThemeStore';

const MainLayout: React.FC = () => {
    const backgroundColor = useThemeStore((state) => state.backgroundColor);

    return (
        <div
            className="flex flex-col min-h-screen"
            style={{ backgroundColor }}
        >
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
