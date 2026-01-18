import { motion } from 'framer-motion'
import { Cloud, Shield, Zap, Users, Lock, RefreshCw } from 'lucide-react'

const features = [
    {
        icon: Cloud,
        title: 'Cloud Storage',
        description: 'Store all your files securely in the cloud with automatic backup and sync across devices.',
        color: 'text-[#4285F4]',
        bgColor: 'bg-blue-50',
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'Bank-grade encryption and advanced security protocols keep your data safe and private.',
        color: 'text-[#34a853]',
        bgColor: 'bg-green-50',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Ultra-fast upload and download speeds powered by our global CDN infrastructure.',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
    },
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Share files and folders with your team. Real-time collaboration made simple.',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
    },
    {
        icon: Lock,
        title: 'Access Control',
        description: 'Fine-grained permissions let you control who can view, edit, or share your files.',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
    },
    {
        icon: RefreshCw,
        title: 'Auto Sync',
        description: 'Changes sync automatically across all your devices. Always have the latest version.',
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-50',
    },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
}

export default function FeaturesSection() {
    return (
        <section id="features" className="py-20 md:py-28 bg-gray-50 font-inter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-blue-100 text-[#4285F4] text-sm font-medium rounded-full mb-4">
                        Features
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Everything you need for <span className="text-gradient-primary">cloud storage</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Powerful features designed to help you manage, share, and protect your files effortlessly
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={itemVariants}
                            className="group bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 hover-lift"
                        >
                            <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
