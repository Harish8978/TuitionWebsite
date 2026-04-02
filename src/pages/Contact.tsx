import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    grade: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // 1. Store in Firebase
      await addDoc(collection(db, 'enquiries'), {
        ...formData,
        timestamp: serverTimestamp()
      });

      // 2. Update UI
      setStatus('success');
      setFormData({ name: '', phone: '', grade: '', message: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'enquiries');
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again or contact us directly.');
    }
  };

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold"
          >
            Get in <span className="text-orange-400">Touch</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-blue-100/80 max-w-2xl mx-auto"
          >
            Have questions? We're here to help. Fill out the form below and we'll 
            get back to you as soon as possible.
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Contact Info */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-blue-900">Contact Information</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Feel free to reach out to us through any of the following channels. 
                We are always happy to discuss your academic needs.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-6 group">
                <div className="bg-orange-50 p-4 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <Phone className="w-6 h-6 text-orange-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Phone Number</p>
                  <p className="text-xl font-bold text-slate-900">+91 7604936317</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-900 group-hover:text-white transition-all">
                  <Mail className="w-6 h-6 text-blue-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Email Address</p>
                  <p className="text-xl font-bold text-slate-900">workwithharishp@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="bg-emerald-50 p-4 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <MapPin className="w-6 h-6 text-emerald-500 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Our Location</p>
                  <p className="text-xl font-bold text-slate-900">Hindu College, Tamil Nadu</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Office Hours</h3>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-semibold">4:00 PM - 9:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-semibold">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-semibold">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enquiry Form */}
          <div className="bg-white p-6 sm:p-12 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-blue-900 mb-8">Send an Enquiry</h2>
              
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 space-y-6"
                  >
                    <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900">Enquiry Sent!</h3>
                      <p className="text-slate-500">Enquiry has been sent, we will be contacting you soon.</p>
                    </div>
                    <button 
                      onClick={() => setStatus('idle')}
                      className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all"
                    >
                      Send Another Enquiry
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} 
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Enter your name"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                        <input 
                          required
                          type="tel" 
                          placeholder="Enter phone number"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Class / Grade</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. 10th Standard"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none"
                          value={formData.grade}
                          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Message</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="How can we help you?"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all outline-none resize-none"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">{errorMessage}</p>
                      </div>
                    )}

                    <button 
                      disabled={status === 'loading'}
                      type="submit"
                      className="w-full bg-blue-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                      {status === 'loading' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          Send Enquiry
                          <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
