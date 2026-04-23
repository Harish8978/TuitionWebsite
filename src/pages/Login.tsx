import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, isAdmin, isStudent, isStaff } = useAuth();

  useEffect(() => {
    if (user && profile) {
      if (isAdmin) navigate('/admin');
      else if (isStaff) navigate('/staff');
      else {
        auth.signOut();
        setError("Unauthorized access. Admin or Staff only.");
      }
    } else if (user && profile === null && !authLoading && loading) {
      setLoading(false);
      setError("Failed to load user profile. Please contact admin or try again.");
    }
  }, [user, profile, authLoading, isAdmin, isStudent, isStaff, navigate, loading]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center"
      >
        <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-blue-900" />
        </div>
        <h2 className="text-3xl font-bold text-blue-900 mb-2">Admin / Staff Login</h2>
        <p className="text-slate-500 mb-8">Access the management dashboard</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-lg disabled:opacity-70"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign in with Google
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
