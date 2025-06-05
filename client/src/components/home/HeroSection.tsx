import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import heroBg from '../../assets/images/hero-bg.jpg'; // Make sure you have this image

const HeroSection: React.FC = () => {
    return (
        <section
            className="relative bg-cover bg-center h-[500px] md:h-[600px] flex items-center justify-center text-white p-4"
            style={{ backgroundImage: `url(${heroBg})` }}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative z-10 text-center max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    Exquisite Mehendi Art for Every Occasion
                </h1>
                <p className="text-lg md:text-xl mb-8">
                    Discover breathtaking designs and book talented mehendi artists near you.
                </p>
                <div className="flex justify-center space-x-4">
                    <Link to="/designs">
                        <Button variant="primary" size="large">Explore Designs</Button>
                    </Link>
                    <Link to="/artists">
                        <Button variant="outline" size="large">Find an Artist</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;