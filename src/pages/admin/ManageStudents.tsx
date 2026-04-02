import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Calendar, BarChart3, Save, X, ChevronRight, GraduationCap, Phone, Mail, AlertCircle, Search } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

interface Student {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: string;
  grade?: string;
  phone?: string;
}

const ManageStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks'>('attendance');
  
  // Form states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent'>('present');
  
  const [markData, setMarkData] = useState({
    subject: '',
    examName: '',
    score: '',
    maxScore: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          uid: data.uid || doc.id, // Fallback to doc.id if uid is missing
          ...data 
        } as Student;
      }));
      setLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'users');
      setError("Failed to load students list. Please check your permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedStudent || !selectedStudent.uid) {
      setStudentAttendance([]);
      setStudentMarks([]);
      return;
    }

    const attQ = query(
      collection(db, 'attendance'), 
      where('studentId', '==', selectedStudent.uid),
      orderBy('date', 'desc')
    );
    const marksQ = query(
      collection(db, 'marks'), 
      where('studentId', '==', selectedStudent.uid),
      orderBy('date', 'desc')
    );

    const unsubAtt = onSnapshot(attQ, (snap) => {
      setStudentAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `attendance/${selectedStudent.uid}`);
    });

    const unsubMarks = onSnapshot(marksQ, (snap) => {
      setStudentMarks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `marks/${selectedStudent.uid}`);
    });

    return () => {
      unsubAtt();
      unsubMarks();
    };
  }, [selectedStudent]);

  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await addDoc(collection(db, 'attendance'), {
        studentId: selectedStudent.uid,
        date: attendanceDate,
        status: attendanceStatus
      });

      alert('Attendance recorded successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
    }
  };

  const handleAddMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await addDoc(collection(db, 'marks'), {
        studentId: selectedStudent.uid,
        subject: markData.subject,
        examName: markData.examName,
        score: Number(markData.score),
        maxScore: Number(markData.maxScore),
        date: markData.date
      });

      setMarkData({ subject: '', examName: '', score: '', maxScore: '', date: new Date().toISOString().split('T')[0] });
      alert('Mark recorded successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marks');
    }
  };

  const handleUpdateGrade = async (studentId: string, newGrade: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { grade: newGrade });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.grade || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900">Manage Students</h1>
        <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-full font-bold text-sm">
          {students.length} Enrolled
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-rose-600 font-bold flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Student List */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Student Directory</h2>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students by name, email, or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-900 mx-auto"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full p-6 text-left transition-all flex items-center justify-between group ${
                    selectedStudent?.id === student.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      selectedStudent?.id === student.id ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-900'
                    }`}>
                      {(student.displayName || '').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{student.displayName || 'Unnamed Student'}</h4>
                      <p className="text-xs text-slate-500 font-medium">{student.grade || 'No Grade'}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${
                    selectedStudent?.id === student.id ? 'text-blue-900 translate-x-1' : 'text-slate-300 group-hover:translate-x-1'
                  }`} />
                </button>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400 italic">No matching students found.</div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div
                key={selectedStudent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl space-y-10"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-900 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {(selectedStudent.displayName || '').charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-blue-900">{selectedStudent.displayName || 'Unnamed Student'}</h2>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Mail className="w-4 h-4" />
                          {selectedStudent.email}
                        </div>
                        {selectedStudent.phone && (
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Phone className="w-4 h-4" />
                            {selectedStudent.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 p-2">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl">
                  <GraduationCap className="w-6 h-6 text-blue-900" />
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned Grade</p>
                    <select
                      className="bg-transparent font-bold text-blue-900 outline-none cursor-pointer"
                      value={selectedStudent.grade || ''}
                      onChange={(e) => handleUpdateGrade(selectedStudent.id, e.target.value)}
                    >
                      <option value="">Select Grade</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                        <option key={g} value={`${g}th Standard`}>{g}th Standard</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className={`px-8 py-4 font-bold transition-all border-b-2 ${
                        activeTab === 'attendance' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Record Attendance
                    </button>
                    <button
                      onClick={() => setActiveTab('marks')}
                      className={`px-8 py-4 font-bold transition-all border-b-2 ${
                        activeTab === 'marks' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Assign Marks
                    </button>
                  </div>

                  {activeTab === 'attendance' ? (
                    <div className="space-y-8">
                      <form onSubmit={handleAddAttendance} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 outline-none"
                              value={attendanceDate}
                              onChange={(e) => setAttendanceDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Status</label>
                            <select
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 outline-none font-bold"
                              value={attendanceStatus}
                              onChange={(e) => setAttendanceStatus(e.target.value as 'present' | 'absent')}
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                            </select>
                          </div>
                        </div>
                        <button type="submit" className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg">
                          <Save className="w-5 h-5" />
                          Save Attendance
                        </button>
                      </form>

                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Attendance History</h3>
                        <div className="bg-slate-50 rounded-2xl overflow-hidden divide-y divide-slate-200">
                          {studentAttendance.length > 0 ? (
                            studentAttendance.map((record) => (
                              <div key={record.id} className="p-4 flex justify-between items-center">
                                <span className="font-medium text-slate-700">{record.date}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                  record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {record.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-slate-400 italic">No attendance records found.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <form onSubmit={handleAddMark} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Subject</label>
                            <input
                              required
                              type="text"
                              placeholder="e.g. Mathematics"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 outline-none"
                              value={markData.subject}
                              onChange={(e) => setMarkData({ ...markData, subject: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Exam Name</label>
                            <input
                              required
                              type="text"
                              placeholder="e.g. Unit Test 1"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 outline-none"
                              value={markData.examName}
                              onChange={(e) => setMarkData({ ...markData, examName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Score</label>
                            <input
                              required
                              type="number"
                              placeholder="e.g. 95"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 outline-none"
                              value={markData.score}
                              onChange={(e) => setMarkData({ ...markData, score: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Max Score</label>
                            <input
                              required
                              type="number"
                              placeholder="e.g. 100"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 outline-none"
                              value={markData.maxScore}
                              onChange={(e) => setMarkData({ ...markData, maxScore: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 outline-none"
                              value={markData.date}
                              onChange={(e) => setMarkData({ ...markData, date: e.target.value })}
                            />
                          </div>
                        </div>
                        <button type="submit" className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg">
                          <Save className="w-5 h-5" />
                          Save Marks
                        </button>
                      </form>

                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Marks History</h3>
                        <div className="bg-slate-50 rounded-2xl overflow-hidden divide-y divide-slate-200">
                          {studentMarks.length > 0 ? (
                            studentMarks.map((mark) => (
                              <div key={mark.id} className="p-6 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-slate-900">{mark.subject}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{mark.examName} • {mark.date}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-black text-blue-900">{mark.score}/{mark.maxScore}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      {Math.round((mark.score / mark.maxScore) * 100)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-slate-400 italic">No marks recorded found.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Users className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Select a Student</h3>
                <p className="text-slate-500 max-w-xs">Choose a student from the directory to manage their records.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;
