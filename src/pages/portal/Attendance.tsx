import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, XCircle, Loader2, Filter, ChevronLeft, ChevronRight, Clock, MapPin, Info, X } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  time?: string;
  location?: string;
  notes?: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setRecords(attendanceData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching attendance:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    total: records.length,
    percentage: records.length > 0 ? Math.round((records.filter(r => r.status === 'present').length / records.length) * 100) : 0
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-slate-900">Attendance Record</h1>
        <p className="text-slate-500">Track your presence and consistency</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Present', value: stats.present, icon: CheckCircle2, color: 'emerald' },
          { label: 'Absent', value: stats.absent, icon: XCircle, color: 'rose' },
          { label: 'Total Classes', value: stats.total, icon: Calendar, color: 'slate' },
          { label: 'Attendance %', value: `${stats.percentage}%`, icon: Filter, color: 'indigo', progress: true }
        ].map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              {stat.progress && (
                <div className="flex-1 h-2 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${stats.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const record = records.find(r => r.date === dateStr);
              
              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => record && setSelectedRecord(record)}
                  disabled={!record}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl border transition-all relative group
                    ${record 
                      ? (record.status === 'present' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-100' 
                        : 'bg-rose-50 border-rose-100 text-rose-700 cursor-pointer hover:bg-rose-100') 
                      : 'bg-slate-50/50 border-slate-100 text-slate-400 cursor-default'}
                  `}
                >
                  <span className="text-sm font-semibold">{day}</span>
                  {record && (
                    <div className="absolute bottom-1">
                      {record.status === 'present' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
          
          <div className="mt-6 flex items-center gap-6 text-sm text-slate-500 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-full" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-200 rounded-full" />
              <span>No Class</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {records.slice(0, 10).map((record, idx) => (
              <motion.div 
                key={record.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedRecord(record)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${record.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {record.status === 'present' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(record.date).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{record.status}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {records.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic">
                No attendance records found.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className={`p-6 ${selectedRecord.status === 'present' ? 'bg-emerald-500' : 'bg-rose-500'} text-white relative`}>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                    {selectedRecord.status === 'present' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold capitalize">{selectedRecord.status}</h3>
                    <p className="text-white/80">
                      {new Date(selectedRecord.date).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Time</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedRecord.time || '09:00 AM'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedRecord.location || 'Main Campus'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Notes</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-600 text-sm italic">
                      {selectedRecord.notes || 'No specific notes for this session.'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
