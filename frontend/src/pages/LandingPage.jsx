import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cloud, FolderOpen, Share2, HardDrive, ArrowRight, Shield, Zap } from 'lucide-react'

// Floating file card visual for hero
function FloatingCards() {
  const cards = [
    { icon: '📄', name: 'Report_Q4.pdf', size: '2.4 MB', color: '#e8f0fe', delay: 0 },
    { icon: '🖼️', name: 'design_v3.png', size: '5.1 MB', color: '#fce8e6', delay: 0.15 },
    { icon: '📁', name: 'Projects/', size: '14 files', color: '#e6f4ea', delay: 0.3 },
    { icon: '📊', name: 'Analytics.xlsx', size: '890 KB', color: '#fff3e0', delay: 0.45 },
  ]

  return (
    <div className="relative w-full max-w-sm mx-auto h-72 hidden md:block">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: card.delay + 0.5, duration: 0.5 },
            y: { delay: card.delay + 0.5, duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{
            position: 'absolute',
            top: `${i * 60 + (i % 2 === 0 ? 0 : 20)}px`,
            left: `${i % 2 === 0 ? 0 : 40}px`,
            right: `${i % 2 === 0 ? 40 : 0}px`,
            zIndex: 4 - i,
          }}
          className="bg-white rounded-lg shadow-md px-4 py-3 flex items-center gap-3 border border-slate-100"
        >
          <span className="text-2xl">{card.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{card.name}</p>
            <p className="text-xs text-slate-400 font-mono">{card.size}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#134074] opacity-40" />
        </motion.div>
      ))}
    </div>
  )
}

const features = [
  {
    icon: <FolderOpen className="w-6 h-6" />,
    title: 'File Management',
    description: 'Upload, organize in folders, rename, and delete files with an intuitive interface.',
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: 'Secure Sharing',
    description: 'Share files or folders with specific users or generate public links with access controls.',
  },
  {
    icon: <HardDrive className="w-6 h-6" />,
    title: 'Google Drive Sync',
    description: 'Connect your Google Drive and browse all your cloud files from one place.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#eef4ed] font-[Rubik,system-ui,sans-serif]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#eef4ed]/90 backdrop-blur-sm border-b border-[#baccdc]/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Storix" className="w-8 h-8 rounded-md" onError={(e) => { e.target.style.display='none' }} />
            <span className="text-xl font-semibold text-[#134074] tracking-tight">Storix</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-[#456685]">
            <a href="#features" className="hover:text-[#134074] transition-colors">Features</a>
            <a href="#about" className="hover:text-[#134074] transition-colors">About</a>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-[#134074] border border-[#134074] rounded hover:bg-[#134074]/5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-[#134074] rounded hover:bg-[#0d2f56] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-mono text-[#456685] bg-white border border-[#baccdc]/60 rounded-full shadow-sm">
            <Shield className="w-3 h-3" /> Secure · Private · Simple
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#134074] leading-tight mb-5">
            Secure file storage,<br />made simple.
          </h1>
          <p className="text-base text-[#456685] mb-8 max-w-lg leading-relaxed">
            Upload, organize, and share files with full privacy controls. Powered by Google Drive integration — all your files in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#134074] rounded hover:bg-[#0d2f56] transition-colors"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-[#134074] border border-[#134074] rounded hover:bg-[#134074]/5 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex justify-center"
        >
          <FloatingCards />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white border-t border-[#baccdc]/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="text-xs font-mono text-[#8da9c4] uppercase tracking-widest">What you get</span>
            <h2 className="text-2xl font-semibold text-[#134074] mt-2">Everything you need to manage files</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group p-6 rounded-lg bg-white border border-[#baccdc]/30 shadow-[0_4px_12px_rgba(19,64,116,0.05)] hover:shadow-[0_6px_20px_rgba(19,64,116,0.1)] hover:border-[#134074]/20 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#134074]/8 flex items-center justify-center text-[#134074] mb-4 group-hover:bg-[#134074]/12 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#134074] mb-2">{f.title}</h3>
                <p className="text-sm text-[#456685] leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Trust section */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center gap-10 bg-white rounded-xl border border-[#baccdc]/30 shadow-[0_4px_12px_rgba(19,64,116,0.05)] p-10"
        >
          <div className="flex-1">
            <span className="text-xs font-mono text-[#8da9c4] uppercase tracking-widest">Built for trust</span>
            <h2 className="text-2xl font-semibold text-[#134074] mt-2 mb-4">Your files, your control</h2>
            <p className="text-sm text-[#456685] leading-relaxed mb-4">
              Storix gives you full visibility and control over your data. Share with specific users, set public links, or keep files private — the choice is always yours.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 text-sm font-medium text-[#134074] hover:underline">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 flex flex-wrap gap-4 justify-center">
            {[
              { icon: <Shield className="w-5 h-5" />, label: 'Private by default' },
              { icon: <Share2 className="w-5 h-5" />, label: 'Granular sharing' },
              { icon: <Zap className="w-5 h-5" />, label: 'Fast uploads' },
              { icon: <HardDrive className="w-5 h-5" />, label: 'Google Drive sync' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#eef4ed] text-sm text-[#134074] font-medium">
                {item.icon} {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#baccdc]/40 bg-[#eef4ed]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#456685]">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#134074]" />
            <span className="font-medium text-[#134074]">Storix</span>
            <span>&copy; 2025</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs">
            <a href="#" className="hover:text-[#134074] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#134074] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#134074] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
