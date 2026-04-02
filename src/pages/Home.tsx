import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ArrowRight, Star, Users, Award, MapPin, CheckCircle2, Send, Loader2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface Testimonial {
  id: string;
  name: string;
  marks: string;
  feedback: string;
  timestamp: any;
}

export default function Home() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', marks: '', feedback: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const q = query(collection(db, 'testimonials'), orderBy('timestamp', 'desc'), limit(6));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
      setTestimonials(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
    });
    return () => unsubscribe();
  }, []);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        ...formData,
        timestamp: serverTimestamp()
      });
      setSubmitStatus('success');
      setFormData({ name: '', marks: '', feedback: '' });
      setTimeout(() => {
        setSubmitStatus('idle');
        setShowForm(false);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'testimonials');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const highlights = [
    { icon: <Award className="w-8 h-8 text-orange-500" />, title: "10+ Years Experience", desc: "Expert guidance from Lokesh Arumugam." },
    { icon: <Star className="w-8 h-8 text-blue-500" />, title: "98% Success Rate", desc: "Consistently delivering top results." },
    { icon: <Users className="w-8 h-8 text-emerald-500" />, title: "500+ Students", desc: "Trusted by parents and students alike." },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 text-sm font-bold border border-orange-100">
                <Star className="w-4 h-4 fill-orange-500" />
                Start Your Learning Journey
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 leading-tight">
                Learn Without <br />
                <span className="text-orange-500">Limits</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg">
                Unlock your potential with expert-led tuition by Lokesh Arumugam. 
                Personalized guidance for students from primary to 12th standard.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  to="/courses"
                  className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-xl hover:shadow-2xl group"
                >
                  Explore Courses
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/contact"
                  className="bg-white text-blue-900 border-2 border-blue-900 px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-orange-500 rounded-full blur-3xl opacity-20" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white aspect-[4/3] lg:aspect-auto">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
                  alt="Students Learning" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">500+ Enrolled</p>
                      <p className="text-sm text-slate-500">This academic year</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((item, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="bg-slate-50 w-fit p-4 rounded-2xl mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-4 text-left">
              <h2 className="text-4xl font-bold text-blue-900">Student Results & Feedback</h2>
              <p className="text-slate-500 max-w-2xl">Hear from our students and parents about their journey with SK Tuition.</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
              {showForm ? 'Cancel' : 'Give Feedback'}
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-16 overflow-hidden"
              >
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold text-blue-900 mb-6">Share Your Experience</h3>
                  <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Your Name</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Enter your name"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Achievement / Context</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 95% in 10th Maths"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                          value={formData.marks}
                          onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Your Feedback</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="Tell us about your experience..."
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none resize-none"
                        value={formData.feedback}
                        onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                      />
                    </div>

                    {submitStatus === 'success' && (
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                        <p className="text-sm font-medium">Thank you for your feedback!</p>
                      </div>
                    )}

                    <button 
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          Submit Feedback
                          <Send className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.length > 0 ? (
              testimonials.map((t, i) => (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative flex flex-col h-full"
                >
                  <div className="flex items-center gap-1 text-orange-400 mb-6">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-slate-600 italic mb-8 leading-relaxed flex-grow">"{t.feedback}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{t.name}</h4>
                      <p className="text-sm text-orange-600 font-semibold">{t.marks}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-400 italic">
                No feedback yet. Be the first to share your experience!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-12 space-y-8">
              <div className="bg-orange-50 w-fit p-3 rounded-xl">
                <MapPin className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-4xl font-bold text-blue-900">Visit Our Center</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Located at Hindu College, our center provides a peaceful and focused environment for learning. 
                Equipped with modern teaching aids to help students excel.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Spacious Classrooms</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Quiet Study Environment</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Easily Accessible Location</span>
                </div>
              </div>
              <a 
                href="https://www.google.com/maps?q=Hindu+College+Tamil+Nadu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-900 font-bold hover:underline"
              >
                Open in Google Maps
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="h-[500px] bg-slate-200">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5123456789!2d77.123456!3d11.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDA3JzI0LjQiTiA3N8KwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
