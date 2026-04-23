import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

interface AttendanceRecord {
  id: string;
  date: string;
  present: boolean;
  clockInTime: any;
  markedVia: string;
}

const StaffAttendance = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'staffAttendance'), 
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendance(attData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staffAttendance');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isPresent = (day: number) => {
    const dateStr = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.find(a => a.date === dateStr && a.present);
  };

  const stats = {
    total: daysInMonth,
    present: attendance.filter(a => a.date.startsWith(`${year}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`) && a.present).length,
    absent: daysInMonth - attendance.filter(a => a.date.startsWith(`${year}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`) && a.present).length
  };

  const downloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Status,Marked Via\n";
    
    attendance.forEach(record => {
      const date = record.date;
      const status = record.present ? "Present" : "Absent";
      const markedVia = record.markedVia || "N/A";
      csvContent += `${date},${status},${markedVia}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${profile?.displayName || 'staff'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/staff')}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tight uppercase">MY ATTENDANCE</h1>
            <p className="text-slate-500 font-medium">Track your presence</p>
          </div>
        </div>
        <button 
          onClick={downloadReport}
          className="flex items-center justify-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
        >
          <Download className="w-5 h-5" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-blue-900/5 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-900 text-white">
              <h3 className="text-xl font-black tracking-tight uppercase">{monthName} {year}</h3>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-7 gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const record = isPresent(day);
                  return (
                    <div 
                      key={day} 
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
                        record 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-black">{day}</span>
                      {record && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-8">
            <h3 className="text-xl font-black text-blue-900 tracking-tight uppercase">MONTHLY STATS</h3>
            <div className="space-y-4">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Days Present</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-emerald-700">{stats.present}</span>
                  <span className="text-emerald-600/60 font-bold mb-1">/ {daysInMonth}</span>
                </div>
              </div>
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">Days Absent</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-red-700">{stats.absent}</span>
                  <span className="text-red-600/60 font-bold mb-1">/ {daysInMonth}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-900/20">
            <h3 className="text-xl font-black mb-6 tracking-tight uppercase">RECENT LOGS</h3>
            <div className="space-y-4">
              {attendance.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl">
                      <Clock className="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.markedVia}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Present</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAttendance;
