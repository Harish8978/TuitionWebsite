import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'courses'), orderBy('title'));
        const querySnapshot = await getDocs(q);
        const fetchedCourses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(fetchedCourses);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-blue-900"
          >
            Our Tuition <span className="text-orange-500">Courses</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto"
          >
            Choose the right course for your academic success. We offer personalized 
            learning for all grade levels.
          </motion.p>
        </div>
      </section>

      {/* Course List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {courses.length > 0 ? (
            courses.map((course, i) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="p-6 sm:p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">{course.grade}</span>
                      <h2 className="text-3xl font-bold text-blue-900">{course.title}</h2>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-900 group-hover:text-white transition-colors">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  </div>

                  <p className="text-slate-500 text-lg leading-relaxed">{course.description || course.desc}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="flex items-center gap-3 text-slate-700">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="font-medium">
                        {Array.isArray(course.subjects) ? course.subjects.join(', ') : (course.syllabus || 'Various Subjects')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="font-medium">{course.timings || 'Flexible Timings'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <CreditCard className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="font-medium">{course.price || course.fees}</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <Link 
                      to="/contact"
                      className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl group"
                    >
                      Enquire Now
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 italic">No courses available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </section>


      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-900 rounded-3xl p-8 sm:p-12 text-center text-white space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10 space-y-4">
            <h2 className="text-4xl font-bold">Ready to Excel in Your Studies?</h2>
            <p className="text-blue-100/80 text-xl max-w-2xl mx-auto">
              Join SK Tuition today and experience the difference in your learning. 
              Contact us for a free demo session.
            </p>
            <div className="pt-8">
              <Link 
                to="/contact"
                className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl hover:shadow-2xl"
              >
                Book a Free Demo Session
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
