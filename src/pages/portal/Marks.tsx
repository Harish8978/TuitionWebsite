import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, BookOpen, Calendar, Loader2, ChevronDown, ChevronUp, Award, Target, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';

interface Mark {
  id: string;
  subject: string;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
}

export default function Marks() {
  const { user } = useAuth();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'marks'),
      where('studentId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mark[];
      setMarks(marksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching marks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const subjects = ['All', ...new Set(marks.map(m => m.subject))];
  const filteredMarks = selectedSubject === 'All' ? marks : marks.filter(m => m.subject === selectedSubject);

  // Stats
  const stats = {
    average: marks.length > 0 ? Math.round((marks.reduce((acc, m) => acc + (m.score / m.maxScore), 0) / marks.length) * 100) : 0,
    highest: marks.length > 0 ? Math.max(...marks.map(m => Math.round((m.score / m.maxScore) * 100))) : 0,
    totalExams: marks.length,
    recentScore: marks.length > 0 ? Math.round((marks[0].score / marks[0].maxScore) * 100) : 0
  };

  // Chart Data
  const chartData = [...marks].reverse().map(m => ({
    name: m.examName,
    percentage: Math.round((m.score / m.maxScore) * 100),
    subject: m.subject
  }));

  const subjectPerformance = subjects.filter(s => s !== 'All').map(s => {
    const subjectMarks = marks.filter(m => m.subject === s);
    const avg = Math.round((subjectMarks.reduce((acc, m) => acc + (m.score / m.maxScore), 0) / subjectMarks.length) * 100);
    return { subject: s, average: avg };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Academic Performance</h1>
        <p className="text-slate-500">View your marks and progress over time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Average %</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.average}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Highest %</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.highest}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Exams</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalExams}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Recent Score</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.recentScore}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Performance Trend</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPerc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPerc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Subject Average</h2>
          <div className="space-y-4">
            {subjectPerformance.map((perf) => (
              <div key={perf.subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{perf.subject}</span>
                  <span className="text-slate-500">{perf.average}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${perf.average}%` }}
                    className={`h-full rounded-full ${perf.average >= 75 ? 'bg-emerald-500' : perf.average >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  />
                </div>
              </div>
            ))}
            {subjectPerformance.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic">
                No subject data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Exam History</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Filter by Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Exam Name</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Percentage</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMarks.map((mark) => {
                const percentage = Math.round((mark.score / mark.maxScore) * 100);
                return (
                  <tr key={mark.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900">{mark.examName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{mark.subject}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(mark.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{mark.score}</span>
                      <span className="text-slate-400"> / {mark.maxScore}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${percentage >= 75 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="font-medium text-slate-700">{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}
                      `}>
                        {percentage >= 75 ? 'Excellent' : percentage >= 50 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredMarks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No exam records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
