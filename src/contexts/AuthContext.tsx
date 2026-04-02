import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'student' | 'staff';
  grade?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isStudent: false,
  isStaff: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const staffEmails = ['prathipa014@gmail.com', 'aaswindark@gmail.com'];
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          let isDynamicallyStaff = false;
          if (user.email) {
            const staffQ = query(collection(db, 'staffs'), where('email', '==', user.email));
            const staffSnap = await getDocs(staffQ);
            isDynamicallyStaff = !staffSnap.empty;
          }

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const existingProfile = userDoc.data() as UserProfile;
            const isAdminEmail = user.email === 'workwithharishp@gmail.com';
            const isStaffEmail = isDynamicallyStaff || (user.email && staffEmails.includes(user.email));
            
            // Force role update for specific emails if they don't match
            if (isAdminEmail && existingProfile.role !== 'admin') {
              const updatedProfile = { ...existingProfile, role: 'admin' as const };
              await setDoc(doc(db, 'users', user.uid), updatedProfile);
              setProfile(updatedProfile);
            } else if (isStaffEmail && existingProfile.role !== 'staff') {
              const updatedProfile = { ...existingProfile, role: 'staff' as const };
              await setDoc(doc(db, 'users', user.uid), updatedProfile);
              setProfile(updatedProfile);
            } else {
              setProfile(existingProfile);
            }
          } else {
            // Default to student role for new signups unless it's the admin or staff email
            const isAdminEmail = user.email === 'workwithharishp@gmail.com';
            const isStaffEmail = isDynamicallyStaff || (user.email && staffEmails.includes(user.email));
            
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: isAdminEmail ? 'admin' : (isStaffEmail ? 'staff' : 'student'),
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student',
    isStaff: profile?.role === 'staff',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
