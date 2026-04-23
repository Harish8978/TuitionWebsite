import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Calendar, User } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

interface Staff {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: 'Present' | 'Absent' | 'WeekOff';
  color?: string;
  clockInTime?: any;
  clockOutTime?: any;
}

export default function AdminAttendanceDashboard() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Status Edit Modal
  const [editingRecord, setEditingRecord] = useState<{staffId: string, date: string, status: string, color: string, id?: string} | null>(null);

  useEffect(() => {
    // Fetch staff
    const unsubscribeStaff = onSnapshot(collection(db, 'staffs'), (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setStaffList(staffData);
    });

    // Fetch attendance
    const unsubscribeAtt = onSnapshot(collection(db, 'staffAttendance'), (snapshot) => {
      const attData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          staffId: data.staffId,
          date: data.date,
          status: data.status || (data.present ? 'Present' : 'Absent'),
          color: data.color || (data.status === 'WeekOff' ? '#94a3b8' : data.present ? '#10b981' : '#ef4444'),
          clockInTime: data.clockInTime,
          clockOutTime: data.clockOutTime,
        } as AttendanceRecord;
      });
      setAttendance(attData);
      setLoading(false);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeAtt();
    };
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const getRecordForDay = (staffId: string, day: number) => {
    const dateStr = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.find(a => a.staffId === staffId && a.date === dateStr);
  };

  const handleSaveRecord = async () => {
    if (!editingRecord) return;
    const { staffId, date, status, color, id } = editingRecord;
    try {
      if (id) {
        await updateDoc(doc(db, 'staffAttendance', id), {
          status,
          color,
          present: status === 'Present'
        });
      } else {
        const newId = `${staffId}_${date}`;
        await setDoc(doc(db, 'staffAttendance', newId), {
          staffId,
          date,
          status,
          color,
          present: status === 'Present',
          markedVia: 'admin'
        });
      }
      setEditingRecord(null);
    } catch (err) {
      console.error("Failed to update record", err);
    }
  };

  const openEditModal = (staffId: string, day: number) => {
    const dateStr = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendance.find(a => a.staffId === staffId && a.date === dateStr);
    
    // Default to Sunday as WeekOff
    const isSunday = new Date(year, currentMonth.getMonth(), day).getDay() === 0;
    
    if (record) {
      setEditingRecord({ staffId, date: dateStr, status: record.status, color: record.color || '', id: record.id });
    } else {
      setEditingRecord({ 
        staffId, 
        date: dateStr, 
        status: isSunday ? 'WeekOff' : 'Absent', 
        color: isSunday ? '#94a3b8' : '#ef4444' 
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  const filteredStaff = selectedStaff === 'all' ? staffList : staffList.filter(s => s.id === selectedStaff);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">ATTENDANCE DASHBOARD</h1>
          <p className="text-slate-500 font-medium">Manage Staff Attendance Calendar</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={selectedStaff} 
            onChange={e => setSelectedStaff(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-medium"
          >
            <option value="all">All Staff</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-900 text-white">
          <h3 className="text-xl font-black tracking-tight">{monthName} {year}</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl"><ChevronLeft /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl"><ChevronRight /></button>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          {filteredStaff.map(staff => (
            <div key={staff.id} className="mb-8">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                {staff.name}
              </h4>
              <div className="grid grid-cols-7 gap-2 min-w-[600px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-black text-slate-400 uppercase pb-2">{day}</div>
                ))}
                
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const record = getRecordForDay(staff.id, day);
                  
                  let bgColor = 'bg-slate-50';
                  let textColor = 'text-slate-400';
                  
                  if (record) {
                    if (record.status === 'Present') { bgColor = 'bg-emerald-50'; textColor = 'text-emerald-600'; }
                    else if (record.status === 'Absent') { bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
                    else if (record.status === 'WeekOff') { bgColor = 'bg-slate-200'; textColor = 'text-slate-600'; }
                  }

                  return (
                    <button 
                      key={day}
                      onClick={() => openEditModal(staff.id, day)}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-100 hover:shadow-md transition-all ${bgColor} ${textColor}`}
                      style={record?.color ? { backgroundColor: record.color + '20', color: record.color, borderColor: record.color + '40' } : {}}
                    >
                      <span className="font-bold">{day}</span>
                      {record?.status === 'Present' && <CheckCircle2 className="w-4 h-4" />}
                      {record?.status === 'Absent' && <XCircle className="w-4 h-4" />}
                      {record?.status === 'WeekOff' && <Calendar className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Edit Attendance</h3>
            <p className="mb-4 text-slate-600 font-medium">Date: {editingRecord.date}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                <select 
                  value={editingRecord.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    let color = editingRecord.color;
                    if (status === 'Present') color = '#10b981';
                    else if (status === 'Absent') color = '#ef4444';
                    else if (status === 'WeekOff') color = '#94a3b8';
                    setEditingRecord({...editingRecord, status, color});
                  }}
                  className="w-full px-4 py-2 border rounded-xl"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="WeekOff">Week Off</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Custom Color</label>
                <input 
                  type="color" 
                  value={editingRecord.color}
                  onChange={(e) => setEditingRecord({...editingRecord, color: e.target.value})}
                  className="w-full h-10 border rounded-xl cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setEditingRecord(null)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
              <button onClick={handleSaveRecord} className="flex-1 py-2 bg-blue-900 text-white rounded-xl font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
