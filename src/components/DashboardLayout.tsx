import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  Star, 
  Users, 
  LogOut, 
  ChevronRight,
  GraduationCap,
  FileText,
  Calendar,
  BarChart3,
  Home,
  Menu,
  X,
  Briefcase,
  QrCode
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'student' | 'staff';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const adminNav = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', path: '/admin' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Courses', path: '/admin/courses' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Enquiries', path: '/admin/enquiries' },
    { icon: <Briefcase className="w-5 h-5" />, label: 'Staff Management', path: '/admin/staff' },
    { icon: <Star className="w-5 h-5" />, label: 'Testimonials', path: '/admin/testimonials' },
    { icon: <FileText className="w-5 h-5" />, label: 'Manage Content', path: '/admin/content' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Staff Attendance', path: '/admin/attendance' },
  ];

  const studentNav = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/portal' },
    { icon: <FileText className="w-5 h-5" />, label: 'Notes', path: '/portal/notes' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Attendance', path: '/portal/attendance' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Marks', path: '/portal/marks' },
  ];

  const staffNav = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/staff' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Attendance', path: '/staff/attendance' },
  ];

  const navItems = role === 'admin' ? adminNav : (role === 'staff' ? staffNav : studentNav);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-blue-900 p-1.5 rounded-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-blue-900">SK Tuition</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-x-0 top-[73px] bottom-0 bg-white border-b border-slate-200 z-40 shadow-xl overflow-y-auto pb-4"
          >
            <nav className="p-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                    location.pathname === item.path
                      ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link
                  to="/"
                  className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-900 transition-all"
                >
                  <Home className="w-5 h-5" />
                  Back to Website
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all mt-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-blue-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-blue-900 tracking-tight">SK TUITION</span>
          </Link>
        </div>

        <nav className="flex-grow p-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                location.pathname === item.path
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
              {location.pathname === item.path && (
                <motion.div layoutId="activeNav">
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              to="/"
              className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Website
            </Link>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName || profile?.email}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{profile?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
