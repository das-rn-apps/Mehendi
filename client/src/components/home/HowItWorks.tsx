import React from 'react';

const HowItWorks: React.FC = () => {
    return (
        <section className="bg-gray-50 py-16">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="text-indigo-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">1. Explore Designs</h3>
                        <p className="text-gray-600">Browse through a vast collection of stunning mehendi designs.</p>
                    </div>

                    <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="text-indigo-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h2a2 2 0 002-2V7.586a1 1 0 00-.293-.707l-4.586-4.586A1 1 0 0015.414 2H5a2 2 0 00-2 2v16a2 2 0 002 2h12zm-9-10h.01M9 16h6m-4 4h4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">2. Find Artists</h3>
                        <p className="text-gray-600">Discover talented local mehendi artists and view their portfolios.</p>
                    </div>

                    <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="text-indigo-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">3. Book Appointment</h3>
                        <p className="text-gray-600">Schedule appointments directly with your chosen artist seamlessly.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;