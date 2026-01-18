import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, Folder, FileText, Image, Upload, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HeroSection() {
    return (
        <section className="relative min-h-screen bg-gradient-hero overflow-hidden font-inter pt-20 md:pt-24">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-100/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="text-center lg:text-left"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6"
                        >
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ teams</span>
                        </motion.div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                            Cloud storage that{' '}
                            <span className="text-gradient-primary">actually works</span>{' '}
                            for you.
                        </h1>

                        {/* Subheading */}
                        <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Upload, organize, and access your files from anywhere. Simple, fast, and secure cloud storage for everyone.
                        </p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                        >
                            <Link to="/register">
                                <Button className="btn-gradient-primary text-white rounded-full px-8 py-6 text-base font-semibold transition-all duration-300 flex items-center gap-2 group">
                                    Get Started
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-2 px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors group cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow">
                                    <Play className="w-4 h-4 text-[#4285F4] ml-0.5" />
                                </div>
                                View pricing
                            </button>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Free 15GB storage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Cancel anytime</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Content - Hero Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Main Browser Mockup */}
                            <div className="absolute inset-0 glass-card rounded-2xl shadow-2xl shadow-gray-200/50 overflow-hidden">
                                {/* Browser Header */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="flex-1 ml-4">
                                        <div className="max-w-xs mx-auto px-3 py-1.5 bg-white rounded-lg text-xs text-gray-500 text-center border">
                                            app.storageapp.cloud
                                        </div>
                                    </div>
                                </div>

                                {/* App Interface */}
                                <div className="p-4 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src="/googleDrive.png"
                                                alt="StorageApp"
                                                className="w-7 h-7"
                                            />
                                            <span className="font-semibold text-gray-800 text-sm">StorageApp</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Pro</div>
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                                        </div>
                                    </div>

                                    {/* Storage Bar */}
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                                            <span>Storage used</span>
                                            <span>8.5 GB / 15 GB</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full w-[57%] bg-gradient-to-r from-[#4285F4] to-[#34a853] rounded-full" />
                                        </div>
                                    </div>

                                    {/* File Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                            <Folder className="w-8 h-8 text-[#4285F4] mx-auto mb-1" />
                                            <span className="text-xs text-gray-600">Projects</span>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <FileText className="w-8 h-8 text-[#34a853] mx-auto mb-1" />
                                            <span className="text-xs text-gray-600">Documents</span>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                                            <Image className="w-8 h-8 text-purple-500 mx-auto mb-1" />
                                            <span className="text-xs text-gray-600">Photos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Cards */}
                            <motion.div
                                className="absolute -top-4 -right-4 floating-card"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <div className="glass-card rounded-xl p-3 shadow-lg flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-800">Upload complete</p>
                                        <p className="text-xs text-gray-500">3 files uploaded</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute -bottom-4 -left-4 floating-card-delayed"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            >
                                <div className="glass-card rounded-xl p-3 shadow-lg flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-[#4285F4]" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-800">Syncing...</p>
                                        <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[#4285F4] rounded-full"
                                                animate={{ width: ['0%', '100%'] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
