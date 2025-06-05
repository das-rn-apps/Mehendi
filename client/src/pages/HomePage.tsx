import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturedDesigns from '../components/home/FeaturedDesigns';
import HowItWorks from '../components/home/HowItWorks';

const HomePage: React.FC = () => {
    return (
        <div className="home-page">
            <HeroSection />
            <FeaturedDesigns />
            <HowItWorks />
            {/* Add more sections like Testimonials, Call to Action, etc. */}
        </div>
    );
};

export default HomePage;