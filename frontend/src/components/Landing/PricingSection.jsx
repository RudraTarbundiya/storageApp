import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Perfect for personal use and getting started',
        features: [
            '15 GB storage',
            'Basic file sharing',
            'Access on 3 devices',
            'Standard support',
            'Basic encryption',
        ],
        cta: 'Get Started Free',
        popular: false,
    },
    {
        name: 'Pro',
        price: '$9.99',
        period: 'per month',
        description: 'Best for professionals and small teams',
        features: [
            '100 GB storage',
            'Advanced sharing options',
            'Unlimited devices',
            'Priority support',
            'Advanced encryption',
            'Version history (30 days)',
            'Offline access',
        ],
        cta: 'Start Pro Trial',
        popular: true,
    },
    {
        name: 'Business',
        price: '$24.99',
        period: 'per user/month',
        description: 'For teams that need advanced features',
        features: [
            '2 TB storage per user',
            'Team management',
            'Admin controls',
            '24/7 phone support',
            'SSO integration',
            'Unlimited version history',
            'Advanced analytics',
            'Custom branding',
        ],
        cta: 'Contact Sales',
        popular: false,
    },
]

export default function PricingSection() {
    return (
        <section id="pricing" className="py-20 md:py-28 bg-white font-inter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-4">
                        Pricing
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Simple, transparent <span className="text-gradient-primary">pricing</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the plan that fits your needs. Upgrade or downgrade at any time.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative rounded-2xl p-8 ${plan.popular
                                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white scale-105 shadow-2xl'
                                    : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
                                } transition-all duration-300`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#4285F4] to-[#1a73e8] text-white text-sm font-medium rounded-full flex items-center gap-1.5 shadow-lg">
                                    <Sparkles className="w-4 h-4" />
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className={`text-xl font-semibold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                                        {plan.price}
                                    </span>
                                    <span className={plan.popular ? 'text-gray-400' : 'text-gray-500'}>
                                        /{plan.period}
                                    </span>
                                </div>
                                <p className={`mt-2 text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-green-400' : 'text-green-500'}`} />
                                        <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link to="/register">
                                <Button
                                    className={`w-full rounded-xl py-6 font-medium transition-all duration-300 ${plan.popular
                                            ? 'bg-white text-gray-900 hover:bg-gray-100'
                                            : 'btn-gradient-primary text-white'
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
