import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  BookOpen, 
  Calendar, 
  DollarSign,
  FileText,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  QrCode,
  Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

interface Staff {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  dailySalary: number;
  joinDate: string;
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  present: boolean;
  clockInTime: any;
  markedVia: string;
}

const ManageStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingStaffAttendance, setViewingStaffAttendance] = useState<Staff | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subjects: '',
    dailySalary: 300,
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  // Default URL — staff should be on same WiFi as dev machine.
  // Replace with your deployed URL once live (e.g. https://yoursite.com/staff)
  const [qrUrl, setQrUrl] = useState(
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:5173/staff`
      : 'http://localhost:5173/staff'
  );
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'staffs'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          ...data
        } as Staff;
      });
      setStaff(staffData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staffs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'staffAttendance'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendance(attendanceData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staffAttendance');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      subjects: formData.subjects.split(',').map(s => s.trim()),
      dailySalary: Number(formData.dailySalary)
    };

    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'staffs', editingStaff.id), {
          ...data,
          uid: editingStaff.uid || null // Preserve UID if it exists
        });
      } else {
        await addDoc(collection(db, 'staffs'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subjects: '',
        dailySalary: 300,
        joinDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, editingStaff ? OperationType.UPDATE : OperationType.CREATE, 'staffs');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member? This will also delete all their attendance records.')) {
      try {
        // Clean up attendance records first
        const attendanceQ = query(collection(db, 'staffAttendance'), where('staffId', '==', id));
        const attendanceSnap = await getDocs(attendanceQ);
        const deletePromises = attendanceSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        // Delete staff profile
        await deleteDoc(doc(db, 'staffs', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `staffs/${id}`);
      }
    }
  };

  const calculateSalary = (staffId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthAttendance = attendance.filter(a => 
      a.staffId === staffId && a.date.startsWith(currentMonth) && a.present
    );
    const staffMember = staff.find(s => s.id === staffId);
    const dailyRate = staffMember?.dailySalary || 300;
    return {
      presentDays: monthAttendance.length,
      totalSalary: monthAttendance.length * dailyRate
    };
  };

  const generateSalarySlip = (staffMember: Staff) => {
    const { presentDays, totalSalary } = calculateSalary(staffMember.id);
    const doc = new jsPDF();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text('SK TUITION CENTER', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Salary Slip - ' + currentMonth, 105, 30, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Staff Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Staff Name: ${staffMember.name}`, 20, 50);
    doc.text(`Email: ${staffMember.email}`, 20, 60);
    doc.text(`Subject(s): ${staffMember.subjects.join(', ')}`, 20, 70);
    doc.text(`Date of Joining: ${staffMember.joinDate}`, 20, 80);

    // Salary Table
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Details']],
      body: [
        ['Working Days in Month', '30'],
        ['Days Present', presentDays.toString()],
        ['Days Absent', (30 - presentDays).toString()],
        ['Daily Rate', `Rs. ${staffMember.dailySalary}`],
        ['Total Salary', `Rs. ${totalSalary}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 30 : 150;
    doc.text('_______________________', 20, finalY);
    doc.text('Admin Signature', 20, finalY + 10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 140, finalY + 10);

    doc.save(`${staffMember.name}_Salary_Slip_${currentMonth}.pdf`);
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">STAFF MANAGEMENT</h1>
          <p className="text-slate-500 font-medium">Manage tuition staff, attendance, and salaries</p>
        </div>
        <button
          onClick={() => {
            setEditingStaff(null);
            setFormData({
              name: '',
              email: '',
              phone: '',
              subjects: '',
              dailySalary: 300,
              joinDate: new Date().toISOString().split('T')[0]
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          Add New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Staff Info</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Subjects</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Salary Info</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((s) => {
                    const { presentDays, totalSalary } = calculateSalary(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900 font-bold">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{s.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <Mail className="w-3 h-3" />
                                {s.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {s.subjects.map((sub, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900">₹{totalSalary}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {presentDays} days present
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => generateSalarySlip(s)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Generate PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStaff(s);
                                setFormData({
                                  name: s.name,
                                  email: s.email,
                                  phone: s.phone,
                                  subjects: s.subjects.join(', '),
                                  dailySalary: s.dailySalary,
                                  joinDate: s.joinDate
                                });
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Staff"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setViewingStaffAttendance(s);
                                setIsAttendanceModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Manage Attendance"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Staff"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-900 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20">
            <h3 className="text-xl font-black mb-6 tracking-tight">ATTENDANCE SUMMARY</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-200" />
                  <span className="font-bold">Total Staff</span>
                </div>
                <span className="text-2xl font-black">{staff.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold">Present Today</span>
                </div>
                <span className="text-2xl font-black">
                  {attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.present).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span className="font-bold">Total Payout</span>
                </div>
                <span className="text-2xl font-black">
                  ₹{staff.reduce((acc, s) => acc + calculateSalary(s.id).totalSalary, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/10 p-2 rounded-xl">
                <QrCode className="w-5 h-5 text-blue-300" />
              </div>
              <h3 className="text-lg font-black tracking-tight uppercase">Attendance QR</h3>
            </div>
            <p className="text-slate-400 text-xs font-medium mb-4 leading-relaxed">
              Print this QR and place it at the tuition entrance. Staff scan it to open the check-in page.
            </p>

            {/* URL input */}
            <div className="mb-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-in URL</label>
              <input
                type="text"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>

            {/* QR Preview */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeSVG
                  value={qrUrl}
                  size={140}
                  bgColor="#ffffff"
                  fgColor="#1e3a8a"
                  level="H"
                />
              </div>
            </div>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all"
            >
              <Printer className="w-4 h-4" />
              View Full Size / Print
            </button>
          </div>

        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-900 text-white shrink-0">
                <h3 className="text-2xl font-black tracking-tight">
                  {editingStaff ? 'EDIT STAFF' : 'ADD NEW STAFF'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subjects (comma separated)</label>
                    <input
                      required
                      type="text"
                      value={formData.subjects}
                      onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
                      placeholder="Maths, Physics"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Daily Salary (₹)</label>
                      <input
                        required
                        type="number"
                        value={formData.dailySalary}
                        onChange={(e) => setFormData({...formData, dailySalary: Number(e.target.value)})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Join Date</label>
                      <input
                        required
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-blue-900 text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                  >
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </button>
                </div>
              </form>
             </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendance Management Modal */}
      <AnimatePresence>
        {isAttendanceModalOpen && viewingStaffAttendance && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAttendanceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white shrink-0">
                <h3 className="text-2xl font-black tracking-tight uppercase">
                  ATTENDANCE: {viewingStaffAttendance.name}
                </h3>
                <button 
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <div className="space-y-4">
                  {attendance
                    .filter(a => a.staffId === viewingStaffAttendance.id && a.present)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(record => (
                      <div key={record.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-emerald-200 hover:bg-emerald-50/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Marked via {record.markedVia || 'System'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to remove this attendance record? This will reduce the estimated salary.')) {
                              try {
                                await deleteDoc(doc(db, 'staffAttendance', record.id));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, 'staffAttendance');
                              }
                            }
                          }}
                          className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all shadow-sm flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    ))}
                    
                  {attendance.filter(a => a.staffId === viewingStaffAttendance.id && a.present).length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">No attendance records found for this staff member.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Print Modal */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-white">
            <div className="absolute top-8 right-8 print:hidden">
              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors font-bold flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Close
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-8 max-w-lg w-full" ref={qrRef}>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-blue-900 tracking-tight uppercase">SK Tuition Center</h1>
                <p className="text-2xl font-bold text-slate-600">Staff Attendance Scanner</p>
              </div>
              
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-blue-900/10">
                <QRCodeSVG
                  value={qrUrl}
                  size={300}
                  bgColor="#ffffff"
                  fgColor="#1e3a8a"
                  level="H"
                />
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-500 text-xl">Scan with your phone to mark attendance.</p>
                <p className="text-slate-400 font-medium">Make sure you are at the tuition center.</p>
              </div>
              
              <button
                onClick={() => window.print()}
                className="mt-8 flex items-center gap-3 bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 print:hidden"
              >
                <Printer className="w-6 h-6" />
                Print This Code
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageStaff;
