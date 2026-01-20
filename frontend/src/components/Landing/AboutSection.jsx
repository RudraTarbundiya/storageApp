import { motion } from 'framer-motion'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutSection() {
    return (
        <section id="about" className="py-20 md:py-28 bg-gray-50 font-inter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full mb-4">
                            About Us
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            Building the future of <span className="text-gradient-primary">cloud storage</span>
                        </h2>
                        <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                            <p>
                                StorageApp was founded with a simple mission: make cloud storage accessible,
                                secure, and effortless for everyone. We believe your files should be available
                                whenever and wherever you need them.
                            </p>
                            <p>
                                Our team of passionate engineers and designers work tirelessly to deliver
                                enterprise-grade security with consumer-friendly simplicity. We're trusted
                                by over 10,000 teams worldwide.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 mt-10">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">10K+</div>
                                <div className="text-sm text-gray-500 mt-1">Active Teams</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">50M+</div>
                                <div className="text-sm text-gray-500 mt-1">Files Stored</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                                <div className="text-sm text-gray-500 mt-1">Uptime</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Content - Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="relative aspect-square max-w-md mx-auto">
                            {/* Background circles */}
                            <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 rounded-full opacity-60 blur-3xl" />

                            {/* Main card */}
                            <div className="relative glass-card rounded-3xl p-8 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src="/googleDrive.png"
                                        alt="StorageApp"
                                        className="w-14 h-14"
                                    />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">StorageApp</h3>
                                        <p className="text-sm text-gray-500">Secure Cloud Storage</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                                        <span className="text-sm font-medium text-gray-700">End-to-end encryption</span>
                                        <span className="text-green-600">✓</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                                        <span className="text-sm font-medium text-gray-700">GDPR Compliant</span>
                                        <span className="text-blue-600">✓</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                                        <span className="text-sm font-medium text-gray-700">SOC 2 Certified</span>
                                        <span className="text-purple-600">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-20 pt-12 border-t border-gray-200"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <img
                                src="/googleDrive.png"
                                alt="StorageApp"
                                className="w-9 h-9"
                            />
                            <span className="text-xl font-bold text-gray-900">StorageApp</span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                            <Link to="/login" className="hover:text-gray-900 transition-colors">Privacy</Link>
                            <Link to="/login" className="hover:text-gray-900 transition-colors">Terms</Link>
                            <Link to="/login" className="hover:text-gray-900 transition-colors">Contact</Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} StorageApp. All rights reserved.
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
