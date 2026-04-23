import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Calendar, 
  Clock,
  ArrowRight,
  GraduationCap,
  FileText,
  BarChart3,
  ChevronRight,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import StaffDashboard from './staff/StaffDashboard';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import StudyPlanGenerator from '../components/ai/StudyPlanGenerator';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    enquiries: 0,
    testimonials: 0
  });
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let statsLoaded = false;
    let coursesLoaded = false;
    let enquiriesLoaded = false;

    const checkLoading = () => {
      if (statsLoaded && coursesLoaded && enquiriesLoaded) {
        setLoading(false);
      }
    };

    // Listen for users (students)
    const unsubStudents = onSnapshot(query(collection(db, 'users'), where('role', '==', 'student')), (snap) => {
      setStats(prev => ({ ...prev, students: snap.size }));
      statsLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admin_students_stats');
      statsLoaded = true;
      checkLoading();
    });

    // Listen for courses
    const unsubCourses = onSnapshot(query(collection(db, 'courses'), orderBy('title')), (snap) => {
      setStats(prev => ({ ...prev, courses: snap.size }));
      const coursesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveCourses(coursesData);
      coursesLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admin_courses_stats');
      coursesLoaded = true;
      checkLoading();
    });

    // Listen for enquiries
    const unsubEnquiries = onSnapshot(collection(db, 'enquiries'), (snap) => {
      setStats(prev => ({ ...prev, enquiries: snap.size }));
      enquiriesLoaded = true;
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admin_enquiries_stats');
      enquiriesLoaded = true;
      checkLoading();
    });

    // Listen for testimonials
    const unsubTestimonials = onSnapshot(collection(db, 'testimonials'), (snap) => {
      setStats(prev => ({ ...prev, testimonials: snap.size }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'admin_testimonials_stats'));

    // Listen for recent enquiries
    const enquiriesQ = query(collection(db, 'enquiries'), orderBy('timestamp', 'desc'), limit(5));
    const unsubRecentEnquiries = onSnapshot(enquiriesQ, (snap) => {
      setRecentEnquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'admin_recent_enquiries'));

    return () => {
      unsubStudents();
      unsubCourses();
      unsubEnquiries();
      unsubTestimonials();
      unsubRecentEnquiries();
    };
  }, []);

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  const statCards = [
    { icon: <BookOpen className="w-6 h-6 text-emerald-600" />, label: 'Active Courses', value: stats.courses, color: 'bg-emerald-50' },
    { icon: <MessageSquare className="w-6 h-6 text-orange-600" />, label: 'New Enquiries', value: stats.enquiries, color: 'bg-orange-50' },
    { icon: <Star className="w-6 h-6 text-purple-600" />, label: 'Testimonials', value: stats.testimonials, color: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-blue-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, Lokesh Arumugam. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-blue-50 p-2 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-bold text-slate-700 pr-4">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-blue-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-blue-900">Recent Enquiries</h2>
            <Link to="/admin/enquiries" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {recentEnquiries.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold">
                        {enquiry.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{enquiry.name}</h4>
                        <p className="text-sm text-slate-500">{enquiry.grade} · {enquiry.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {enquiry.timestamp?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 italic">No recent enquiries found.</div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-blue-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link to="/admin/courses" className="bg-blue-900 text-white p-6 rounded-3xl font-bold flex items-center justify-between hover:bg-blue-800 transition-all shadow-lg group">
              <div className="flex items-center gap-4">
                <Plus className="w-6 h-6" />
                Add New Course
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-900">Active Courses</h2>
          <Link to="/admin/courses" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            Manage Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeCourses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all"
            >
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-8">
                <BookOpen className="w-16 h-16 text-blue-200 group-hover:text-blue-300 transition-colors group-hover:scale-110 duration-500" />
                <div className="absolute top-4 right-4">
                  <span className="bg-white text-blue-900 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm border border-slate-100">
                    {course.grade}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-grow space-y-3">
                <h3 className="text-lg font-bold text-blue-900 leading-tight">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">{course.description}</p>
                <div className="flex flex-wrap gap-2">
                  {course.subjects?.slice(0, 3).map((sub: string, i: number) => (
                    <span key={i} className="bg-slate-50 text-slate-600 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      {sub}
                    </span>
                  ))}
                  {course.subjects?.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-bold flex items-center">+{course.subjects.length - 3} more</span>
                  )}
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-lg font-black text-blue-900">{course.price}</p>
                  <div className="flex items-center gap-2">
                    <Link to="/admin/courses" className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {activeCourses.length === 0 && (
            <div className="col-span-full p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400 italic">
              No courses found. Add your first course to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentOverview: React.FC = () => {
  const { user, profile } = useAuth();
  const [recentMarks, setRecentMarks] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Marks
        const marksQ = query(
          collection(db, 'marks'),
          where('studentId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(3)
        );
        const marksSnap = await getDocs(marksQ);
        setRecentMarks(marksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Attendance Stats
        const attendanceQ = query(
          collection(db, 'attendance'),
          where('studentId', '==', user.uid)
        );
        const attendanceSnap = await getDocs(attendanceQ);
        const records = attendanceSnap.docs.map(doc => doc.data());
        const present = records.filter(r => r.status === 'present').length;
        const total = records.length;
        setAttendanceStats({
          present,
          total,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0
        });

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'student_dashboard_data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-blue-900 tracking-tight">Student Portal</h1>
          <p className="text-slate-500 font-medium">Welcome back, {profile?.displayName}. Here's your academic summary.</p>
        </div>
        <div className="bg-orange-50 px-6 py-3 rounded-2xl border border-orange-100">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Current Grade</p>
          <p className="text-lg font-black text-orange-600">{profile?.grade || 'Not Assigned'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
        >
          <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">Study Materials</h3>
          <p className="text-slate-500 mb-6">Access your notes, assignments, and practice papers.</p>
          <Link to="/portal/notes" className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
            View Notes <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
        >
          <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">Attendance</h3>
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <p className="text-slate-500 text-sm">Overall Consistency</p>
              <p className="text-emerald-600 font-bold">{attendanceStats.percentage}%</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${attendanceStats.percentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full rounded-full ${attendanceStats.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
            </div>
          </div>
          <Link to="/portal/attendance" className="text-emerald-600 font-bold flex items-center gap-2 hover:underline">
            View Report <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
        >
          <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">Marks & Progress</h3>
          <p className="text-slate-500 mb-6">Check your test results and performance analysis.</p>
          <Link to="/portal/marks" className="text-orange-600 font-bold flex items-center gap-2 hover:underline">
            View Marks <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <StudyPlanGenerator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-bold text-blue-900 mb-8">Recent Test Results</h2>
          {recentMarks.length > 0 ? (
            <div className="space-y-6">
              {recentMarks.map((mark) => (
                <div key={mark.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{mark.examName}</h4>
                      <p className="text-sm text-slate-500">{mark.subject} · {mark.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-900">{mark.score}/{mark.maxScore}</p>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                      {Math.round((mark.score / mark.maxScore) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 italic">No test results posted yet.</div>
          )}
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-bold text-blue-900 mb-8">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Total Classes</p>
              <p className="text-3xl font-black text-blue-900">{attendanceStats.total}</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Days Present</p>
              <p className="text-3xl font-black text-emerald-900">{attendanceStats.present}</p>
            </div>
            <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Academic Performance</p>
                <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Keep up the great work! Your attendance is at <span className="font-bold text-orange-600">{attendanceStats.percentage}%</span>. 
                Consistency is key to academic success.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardOverview: React.FC = () => {
  const { isAdmin, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (profile?.role === 'staff') {
    return <StaffDashboard />;
  }

  return isAdmin ? <AdminOverview /> : <StudentOverview />;
};

export default DashboardOverview;
