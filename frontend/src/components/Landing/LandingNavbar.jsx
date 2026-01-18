import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context'

export default function LandingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
        setIsMobileMenuOpen(false)
    }

    const handleProtectedNavigation = (path) => {
        if (user) {
            navigate(path)
        } else {
            navigate('/login')
        }
    }

    const navLinks = [
        { label: 'Features', onClick: () => scrollToSection('features') },
        { label: 'Pricing', onClick: () => scrollToSection('pricing') },
        { label: 'About', onClick: () => scrollToSection('about') },
    ]

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-inter ${isScrolled
                ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <img
                            src="/googleDrive.png"
                            alt="StorageApp"
                            className="w-9 h-9 group-hover:scale-110 transition-transform duration-300"
                        />
                        <span className="text-xl font-bold text-gray-900">StorageApp</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={link.onClick}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all cursor-pointer"
                            >
                                {link.label}
                            </button>
                        ))}
                        {/* Protected Links */}
                        <button
                            onClick={() => handleProtectedNavigation('/dashboard')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all cursor-pointer"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => handleProtectedNavigation('/google-drive')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all cursor-pointer"
                        >
                            Google Drive
                        </button>
                    </nav>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="btn-gradient-primary text-white rounded-full px-6 font-medium transition-all duration-300 cursor-pointer"
                            >
                                Go to Dashboard
                            </Button>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button className="btn-gradient-primary text-white rounded-full px-6 font-medium transition-all duration-300 cursor-pointer">
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6 text-gray-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden overflow-hidden bg-white border-t border-gray-100"
                        >
                            <div className="py-4 space-y-1">
                                {navLinks.map((link) => (
                                    <button
                                        key={link.label}
                                        onClick={link.onClick}
                                        className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        {link.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handleProtectedNavigation('/dashboard')}
                                    className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => handleProtectedNavigation('/google-drive')}
                                    className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    Google Drive
                                </button>
                                <div className="pt-4 px-4 space-y-2">
                                    {user ? (
                                        <Button
                                            onClick={() => navigate('/dashboard')}
                                            className="w-full btn-gradient-primary text-white rounded-full font-medium"
                                        >
                                            Go to Dashboard
                                        </Button>
                                    ) : (
                                        <>
                                            <Link to="/login" className="block">
                                                <Button variant="outline" className="w-full rounded-full">
                                                    Sign In
                                                </Button>
                                            </Link>
                                            <Link to="/register" className="block">
                                                <Button className="w-full btn-gradient-primary text-white rounded-full font-medium">
                                                    Get Started
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    )
}
