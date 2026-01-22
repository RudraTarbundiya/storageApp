import { Link } from 'react-router-dom'
import { Twitter, Github, Linkedin, Mail } from 'lucide-react'

const footerLinks = {
    company: [
        { label: 'Quick Start', to: '/quick-start' },
        { label: 'Careers', to: '/login' },
        { label: 'Blog', to: '/login' },
        { label: 'Press', to: '/login' },
    ],
    product: ['Features', 'Pricing', 'Security', 'Integrations'],
    resources: ['Documentation', 'Help Center', 'Community', 'API'],
    legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'],
}

export default function FooterSection() {
    return (
        <footer className="bg-linear-to-br from-gray-900 to-gray-800 text-white font-inter relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Main Footer */}
            <div className="relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        {/* Company */}
                        <div>
                            <h3 className="font-semibold text-white mb-4">Company</h3>
                            <ul className="space-y-3">
                                {footerLinks.company.map(({ label, to }) => (
                                    <li key={label}>
                                        <Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm">
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Product */}
                        <div>
                            <h3 className="font-semibold text-white mb-4">Product</h3>
                            <ul className="space-y-3">
                                {footerLinks.product.map((item) => (
                                    <li key={item}>
                                        <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h3 className="font-semibold text-white mb-4">Resources</h3>
                            <ul className="space-y-3">
                                {footerLinks.resources.map((item) => (
                                    <li key={item}>
                                        <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="font-semibold text-white mb-4">Legal</h3>
                            <ul className="space-y-3">
                                {footerLinks.legal.map((item) => (
                                    <li key={item}>
                                        <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="StorageApp" className="w-8 h-8" />
                            <span className="text-xl font-bold">StorageApp</span>
                        </div>

                        <div className="flex items-center gap-6">
                            {[
                                { Icon: Twitter, href: '#' },
                                { Icon: Github, href: '#' },
                                { Icon: Linkedin, href: '#' },
                                { Icon: Mail, href: '#' },
                            ].map(({ Icon, href }, index) => (
                                <a
                                    key={index}
                                    href={href}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>

                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} StorageApp. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
