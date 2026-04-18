import React from 'react'
import { Link } from 'react-router-dom'
import { Youtube, Facebook, MessageCircle } from 'lucide-react'
import whitelogo from '../pages/labanonlogo.png'
import seunSponsor from './SeunP Media.png'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Reviews', path: '/reviews' },
  { label: 'Blog', path: '/blog' },
  { label: 'About', path: '/about' },
]

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-12 sm:pt-16 pb-6 sm:pb-8 mt-12 sm:mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content - responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Company Info */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img src={whitelogo} width={32} height={32} className="w-8 h-8" alt="LightHub Academy logo" />
              <span className="text-lg sm:text-xl font-bold">LightHub Academy</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-sm">Africa's premier digital learning ecosystem, transforming education through technology.</p>
            <div className="flex items-center gap-4 mt-6">
              <a 
                href="https://www.youtube.com/channel/UCtBGZVHuNLRl-nPLVvzxFnQ" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-red-500 transition-colors" 
                aria-label="Follow us on YouTube"
              >
                <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a 
                href="https://www.facebook.com/profile.php?id=61587344120717" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-yellow-500 transition-colors" 
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold mb-4 text-sm sm:text-base">Platform</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              {navItems.map(item => (
                <li key={item.label}>
                  <Link to={item.path} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold mb-4 text-sm sm:text-base">Resources</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/institutions" className="hover:text-white transition-colors">Institutions</Link></li>
              <li><Link to="/reviews" className="hover:text-white transition-colors">Reviews</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/documentation" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4 text-sm sm:text-base">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="mailto:support@lighthubacademy.org" className="hover:text-white transition-colors">support@lighthubacademy.org</a></li>
              <li>
                <a 
                  href="https://wa.me/2348159749816" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
                  aria-label="Contact us on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>Lagos, Nigeria</li>
            </ul>
          </div>

          {/* Sponsors */}
          <div>
            <h4 className="font-bold mb-4 text-sm sm:text-base">Sponsors</h4>
            <div className="flex items-center">
              <a href="#" className="block">
                <img src={seunSponsor} alt="SeunP Media" className="w-32 h-auto object-contain" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center text-gray-300 text-xs sm:text-sm">
          © {new Date().getFullYear()} LightHub Academy Limited. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
