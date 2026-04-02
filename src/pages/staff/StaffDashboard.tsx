import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  QrCode,
  ChevronRight,
  TrendingUp,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  orderBy,
  limit,
  updateDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';
import { verifyTuitionLocation } from '../../utils/gpsVerification';
import { TUITION_LOCATION } from '../../config/tuitionLocation';
import TeachingIdeas from '../../components/ai/TeachingIdeas';

interface StaffData {
  id: string;
  name: string;
  subjects: string[];
  dailySalary: number;
  joinDate: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  present: boolean;
  clockInTime: any;
  markedVia: string;
}

interface Student {
  id: string;
  displayName: string;
  email: string;
  grade: string;
}

const StaffDashboard = () => {
  const { profile, user } = useAuth();
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<
    'idle' | 'gps-checking' | 'loading' | 'success' | 'already-marked' | 'error' | 'gps-denied' | 'outside-tuition'
  >('idle');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasCheckedIn = attendance.some(record => record.date === today && record.present);
    if (hasCheckedIn) {
      setCheckInStatus('already-marked');
    } else if (checkInStatus !== 'success' && checkInStatus !== 'loading' && checkInStatus !== 'error') {
      setCheckInStatus('idle');
    }
  }, [attendance]);

  const handleCheckIn = async () => {
    if (!staffData || !user) return;

    const today = new Date().toISOString().split('T')[0];
    const hasCheckedIn = attendance.some(record => record.date === today && record.present);
    if (hasCheckedIn) {
      setCheckInStatus('already-marked');
      return;
    }

    // Step 1: GPS Verification
    setCheckInStatus('gps-checking');
    setCheckInError(null);
    setGpsDistance(null);

    let gpsResult: Awaited<ReturnType<typeof verifyTuitionLocation>> | null = null;
    try {
      gpsResult = await verifyTuitionLocation();
    } catch (err: any) {
      if (err.message === 'GPS_DENIED') {
        setCheckInStatus('gps-denied');
        setCheckInError('Location access was denied. Please allow location permission and try again.');
      } else if (err.message === 'GPS_NOT_SUPPORTED') {
        setCheckInStatus('gps-denied');
        setCheckInError('Your browser does not support GPS. Please use a modern mobile browser.');
      } else {
        setCheckInStatus('gps-denied');
        setCheckInError('Could not get your location. Please check GPS settings and try again.');
      }
      return;
    }

    if (!gpsResult.isAtTuition) {
      setGpsDistance(gpsResult.distanceMeters);
      setCheckInStatus('outside-tuition');
      setCheckInError(
        `You are ${gpsResult.distanceMeters}m away from ${TUITION_LOCATION.name}. ` +
        `You must be within ${TUITION_LOCATION.radiusMeters}m to mark attendance.`
      );
      return;
    }

    // Step 2: Mark Attendance in Firestore
    setCheckInStatus('loading');
    const attendanceId = `${staffData.id}_${today}`;
    try {
      const attendanceDoc = doc(db, 'staffAttendance', attendanceId);
      await setDoc(attendanceDoc, {
        staffId: staffData.id,
        uid: user.uid,
        date: today,
        present: true,
        clockInTime: serverTimestamp(),
        markedVia: 'qr-gps',
        gpsLat: gpsResult.lat,
        gpsLng: gpsResult.lng,
        gpsAccuracy: gpsResult.accuracy,
        distanceFromTuition: gpsResult.distanceMeters,
      });
      setCheckInStatus('success');
    } catch (err: any) {
      console.error(err);
      setCheckInStatus('error');
      setCheckInError(`Failed to save attendance: ${err.message || String(err)}`);
    }
  };

  useEffect(() => {
    if (!user?.email) return;

    setLoading(true);

    // Fetch staff profile from staffs collection
    const q = query(collection(db, 'staffs'), where('email', '==', user.email));
    const unsubscribeStaff = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const staffDoc = snapshot.docs[0];
        const data = { id: staffDoc.id, ...staffDoc.data() } as StaffData;
        setStaffData(data);
        
        // If the staff document doesn't have a UID yet, claim it
        if (!staffDoc.data().uid && user.uid) {
          updateDoc(doc(db, 'staffs', staffDoc.id), { uid: user.uid }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `staffs/${staffDoc.id}`);
          });
        }
      } else {
        setStaffData(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staffs');
      setLoading(false);
    });

    // Fetch attendance for this staff using uid
    const attQ = query(
      collection(db, 'staffAttendance'), 
      where('uid', '==', user.uid),
      limit(30)
    );
    const unsubscribeAtt = onSnapshot(attQ, (attSnapshot) => {
      const attData = attSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      // Sort by date descending client-side
      attData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setAttendance(attData);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'staffAttendance');
      setError("Failed to load attendance records. Please check permissions.");
    });

    // Fetch students
    const studentQ = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentQ, (studentSnapshot) => {
      const studentData = studentSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          ...data
        } as any;
      }) as Student[];
      setStudents(studentData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => {
      unsubscribeStaff();
      unsubscribeAtt();
      unsubscribeStudents();
    };
  }, [user]);

  const stats = [
    {
      label: 'Students Enrolled',
      value: students.length,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      trend: '+12% this month'
    },
    {
      label: 'Days Present',
      value: attendance.filter(a => a.present).length,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'bg-emerald-500',
      trend: 'Last 30 days'
    },
    {
      label: 'Estimated Salary',
      value: `₹${(attendance.filter(a => a.present).length * (staffData?.dailySalary || 300))}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-amber-500',
      trend: 'Current month'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-rose-600 font-bold max-w-md text-center">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-blue-900 text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="bg-red-50 p-6 rounded-[2.5rem]">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-blue-900 tracking-tight uppercase">STAFF PROFILE NOT FOUND</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            Your email ({user?.email}) is not registered in our staff management system. 
            Please contact the administrator to add your profile.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
        >
          Retry Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight uppercase">STAFF PORTAL</h1>
          <p className="text-slate-500 font-medium">Welcome back, {profile?.displayName || 'Staff Member'}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="bg-blue-50 p-2 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-900" />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Date</p>
            <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TeachingIdeas />
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-blue-900 tracking-tight uppercase">RECENT STUDENTS</h3>
              <Link to="/staff/students" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">View All</Link>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {students.length > 0 ? students.slice(0, 5).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-100 group-hover:text-blue-900 transition-colors">
                        {(student.displayName || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{student.displayName || 'Unnamed Student'}</p>
                        <p className="text-xs text-slate-500 font-medium">Grade {student.grade || 'N/A'}</p>
                      </div>
                    </div>
                    <Link 
                      to="/staff/students" 
                      className="p-2 text-slate-400 hover:text-blue-900 hover:bg-white rounded-xl transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-400 italic font-medium">No students enrolled yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-blue-900 tracking-tight uppercase">ATTENDANCE HISTORY</h3>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Present</span>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-7 gap-4">
                {attendance.length > 0 ? attendance.slice(0, 14).reverse().map((record, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${record.present ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {record.present ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }) : 'N/A'}
                    </span>
                  </div>
                )) : (
                  <div className="col-span-7 p-8 text-center text-slate-400 italic font-medium">No attendance records found.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-2xl font-black mb-6 tracking-tight uppercase relative z-10">DAILY ATTENDANCE</h3>

            {/* ✅ Already marked or just succeeded */}
            {(checkInStatus === 'already-marked' || checkInStatus === 'success') && (
              <div className="relative z-10 flex flex-col items-center justify-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="font-bold text-lg text-emerald-300">Attendance Marked</p>
                <p className="text-sm text-blue-200">You're all set for today!</p>
              </div>
            )}

            {/* ❌ GPS denied */}
            {checkInStatus === 'gps-denied' && (
              <div className="relative z-10 space-y-4">
                <div className="bg-orange-500/20 border border-orange-400/30 rounded-2xl p-4">
                  <p className="text-orange-300 text-sm font-bold">📍 {checkInError}</p>
                </div>
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-white text-blue-900 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            )}

            {/* ❌ Outside tuition */}
            {checkInStatus === 'outside-tuition' && (
              <div className="relative z-10 space-y-4">
                <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4">
                  <p className="text-red-300 text-sm font-bold">🚫 {checkInError}</p>
                  {gpsDistance !== null && (
                    <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${Math.min((TUITION_LOCATION.radiusMeters / gpsDistance) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-white text-blue-900 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            )}

            {/* Default / loading / error states */}
            {(checkInStatus === 'idle' || checkInStatus === 'gps-checking' || checkInStatus === 'loading' || checkInStatus === 'error') && (
              <div className="relative z-10 space-y-6">
                <p className="text-blue-100 font-medium">
                  {checkInStatus === 'gps-checking'
                    ? '📍 Verifying your location…'
                    : 'Scan the QR at the tuition entrance, then tap the button below.'}
                </p>
                {checkInStatus === 'error' && (
                  <p className="text-red-300 text-sm font-bold bg-red-900/40 p-3 rounded-xl">{checkInError}</p>
                )}
                <button
                  onClick={handleCheckIn}
                  disabled={checkInStatus === 'gps-checking' || checkInStatus === 'loading'}
                  className="w-full bg-white text-blue-900 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {checkInStatus === 'gps-checking'
                    ? 'Checking Location…'
                    : checkInStatus === 'loading'
                    ? 'Marking Attendance…'
                    : 'Mark Present Today'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <h3 className="text-xl font-black text-blue-900 mb-6 tracking-tight uppercase">MY SUBJECTS</h3>
            <div className="space-y-3">
              {staffData?.subjects && staffData.subjects.length > 0 ? staffData.subjects.map((subject, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl group hover:bg-blue-50 transition-all">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 group-hover:border-blue-200 transition-all">
                    <BookOpen className="w-5 h-5 text-blue-900" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-blue-900 transition-all">{subject}</span>
                </div>
              )) : (
                <div className="p-4 text-center text-slate-400 italic font-medium">No subjects assigned.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
