import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Save, BookOpen, GraduationCap, DollarSign, Image as ImageIcon, Search } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  grade: string;
  subjects: string[];
  price: string;
  image: string;
}

const ManageCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade: '',
    subjects: '',
    price: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'courses'), orderBy('title'));
    const unsub = onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching courses:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s !== '')
    };

    if (editingCourse) {
      await updateDoc(doc(db, 'courses', editingCourse.id), data);
    } else {
      await addDoc(collection(db, 'courses'), data);
    }

    setShowForm(false);
    setEditingCourse(null);
    setFormData({ title: '', description: '', grade: '', subjects: '', price: '' });
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      grade: course.grade,
      subjects: course.subjects.join(', '),
      price: course.price
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      await deleteDoc(doc(db, 'courses', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900">Manage Courses</h1>
        <button
          onClick={() => {
            setEditingCourse(null);
            setFormData({ title: '', description: '', grade: '', subjects: '', price: '' });
            setShowForm(true);
          }}
          className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add New Course
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-blue-900">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Course Title</label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. 10th Standard Mathematics"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Target Grade</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. 10th Standard"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Subjects (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Algebra, Geometry, Trigonometry"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Pricing / Fee</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. ₹1500 / Month"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>



                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Course Description</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe what students will learn..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative mb-6 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses by title, grade, or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium shadow-sm"
            />
          </div>
          
          {courses.filter(c => 
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.grade.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
          ).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.filter(c => 
                c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.grade.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
              ).map((course) => (
            <motion.div
              key={course.id}
              layout
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group"
            >
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-8">
                <BookOpen className="w-16 h-16 text-blue-200 group-hover:text-blue-300 transition-colors group-hover:scale-110 duration-500" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-blue-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-8 flex-grow space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-blue-900">{course.title}</h3>
                  <span className="bg-blue-50 text-blue-900 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                    {course.grade}
                  </span>
                </div>
                <p className="text-slate-500 text-sm line-clamp-2">{course.description}</p>
                <div className="flex flex-wrap gap-2">
                  {course.subjects.map((sub, i) => (
                    <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {sub}
                    </span>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-lg font-black text-blue-900">{course.price}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        ) : (
          <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No matching courses found.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default ManageCourses;
