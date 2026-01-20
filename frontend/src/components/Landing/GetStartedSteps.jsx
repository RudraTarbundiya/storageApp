import { motion } from 'framer-motion'
import { UserPlus, Upload, Smartphone } from 'lucide-react'

const steps = [
    {
        icon: UserPlus,
        title: 'Sign Up',
        description: 'Create your free account in seconds',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
    },
    {
        icon: Upload,
        title: 'Upload Files',
        description: 'Upload files & folders securely',
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
    },
    {
        icon: Smartphone,
        title: 'Access Anywhere',
        description: 'Access files on any device, anytime',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
    },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
}

export default function GetStartedSteps() {
    return (
        <section className="py-20 md:py-28 bg-white font-inter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Get Started in <span className="text-gradient-primary">3 Simple Steps</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Start storing and managing your files in the cloud within minutes
                    </p>
                </motion.div>

                {/* Steps Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    className="grid md:grid-cols-3 gap-8 lg:gap-12"
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            variants={itemVariants}
                            className="relative group"
                        >
                            {/* Connector Line (hidden on mobile, shown between cards on desktop) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-gray-200 to-transparent" />
                            )}

                            <div className="relative hover-lift bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300">
                                {/* Step Number */}
                                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-linear-to-br from-gray-800 to-gray-900 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                                    {index + 1}
                                </div>

                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {step.description}
                                </p>

                                {/* Decorative gradient bar */}
                                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
