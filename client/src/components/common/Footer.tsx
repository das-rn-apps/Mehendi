import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white py-8 mt-12">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">MehendiApp</h3>
                    <p className="text-gray-400 text-sm">
                        Discover exquisite mehendi designs and connect with talented artists. Your one-stop destination for beautiful mehendi art.
                    </p>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2">
                        <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                        <li><Link to="/designs" className="text-gray-400 hover:text-white transition-colors">Designs</Link></li>
                        <li><Link to="/artists" className="text-gray-400 hover:text-white transition-colors">Artists</Link></li>
                        <li><Link to="/book-appointment" className="text-gray-400 hover:text-white transition-colors">Book Appointment</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-4">Support</h4>
                    <ul className="space-y-2">
                        <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                        <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                        <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
                    <div className="flex space-x-4">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                            <i className="fab fa-facebook-f"></i> {/* Placeholder for icon */}
                            FB
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                            <i className="fab fa-instagram"></i> {/* Placeholder for icon */}
                            Insta
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                            <i className="fab fa-twitter"></i> {/* Placeholder for icon */}
                            Twitter
                        </a>
                    </div>
                    <p className="text-gray-400 text-sm mt-4">Email: info@mehendiapp.com</p>
                </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} MehendiApp. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;