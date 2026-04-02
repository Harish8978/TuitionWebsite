import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, Phone, Mail, MapPin, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isStudent, isStaff } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Courses', path: '/courses' },
    { name: 'Contact', path: '/contact' },
  ];

  const dashboardPath = isAdmin ? '/admin' : isStaff ? '/staff' : isStudent ? '/portal' : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-900 p-1.5 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-blue-900">SK Tuition</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-blue-900",
                    location.pathname === link.path ? "text-blue-900" : "text-slate-600"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              {user ? (
                <div className="flex items-center gap-4">
                  <Link
                    to={dashboardPath || '/'}
                    className="flex items-center gap-2 text-sm font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-900 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}

              <Link
                to="/contact"
                className="bg-blue-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                Enquire Now
              </Link>
            </div>

            {/* Mobile Actions & Menu Toggle */}
            <div className="md:hidden flex items-center gap-2">
              {user ? (
                <Link
                  to={dashboardPath || '/'}
                  className="p-2 text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="p-2 text-slate-600 hover:bg-slate-50 hover:text-blue-900 rounded-lg transition-colors"
                  title="Login"
                >
                  <LogIn className="w-5 h-5" />
                </Link>
              )}
              <button
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium",
                      location.pathname === link.path
                        ? "bg-blue-50 text-blue-900"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {user ? (
                  <>
                    <Link
                      to={dashboardPath || '/'}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-bold text-blue-900 bg-blue-50"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-base font-bold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <LogIn className="w-5 h-5" />
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="w-8 h-8" />
                <span className="text-2xl font-bold">SK Tuition</span>
              </div>
              <p className="text-blue-100/80 leading-relaxed">
                Empowering students with quality education and personalized guidance. 
                Led by Lokesh Arumugam, we focus on conceptual clarity and academic excellence.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-4 text-blue-100/80">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Tutor</Link></li>
                <li><Link to="/courses" className="hover:text-white transition-colors">Our Courses</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
              <ul className="space-y-4 text-blue-100/80">
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-orange-400" />
                  <span>+91 7604936317</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-400" />
                  <span>workwithharishp@gmail.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-400 mt-1" />
                  <span>Hindu College, Tamil Nadu</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-blue-800 text-center text-blue-200/60 text-sm">
            <p>&copy; {new Date().getFullYear()} SK Tuition. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
