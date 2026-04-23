import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ArrowRight, Star, Users, Award, MapPin, CheckCircle2, Send, Loader2, MessageSquare, Megaphone, Image as ImageIcon, FileText } from 'lucide-react';
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
  // Public content states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);

  useEffect(() => {

    const unsubAnn = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3)), snap => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubAds = onSnapshot(query(collection(db, 'advertisements'), orderBy('createdAt', 'desc'), limit(4)), snap => {
      setAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(8)), snap => {
      setGallery(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubAnn(); unsubAds(); unsubGallery(); };
  }, []);

  const highlights = [
    { icon: <Award className="w-8 h-8 text-orange-500" />, title: "3+ Years Experience", desc: "Expert guidance from Lokesh Arumugam." },
    { icon: <Star className="w-8 h-8 text-blue-500" />, title: "95% Success Rate", desc: "Consistently delivering top results." },
    { icon: <Users className="w-8 h-8 text-emerald-500" />, title: "100+ Students", desc: "Trusted by parents and students alike." },
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
                      <p className="text-2xl font-bold text-slate-900">200+ Enrolled</p>
                      <p className="text-sm text-slate-500">Since 2021</p>
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

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-orange-50 rounded-3xl p-8 border border-orange-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500 p-2 rounded-xl text-white">
                <Megaphone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-orange-900">Latest Announcements</h2>
            </div>
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{ann.title}</h3>
                  <p className="text-slate-600">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Advertisements Section */}
      {ads.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ads.map((ad) => (
              <a 
                key={ad.id} 
                href={ad.link || '#'} 
                target={ad.link ? "_blank" : "_self"} 
                rel="noopener noreferrer"
                className="block group relative rounded-3xl overflow-hidden aspect-video shadow-md hover:shadow-xl transition-all"
              >
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                  <h3 className="text-white font-bold text-lg">{ad.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}



      {/* Media Gallery Section */}
      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">Our Gallery</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Glimpses of our events, classes, and special moments.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((media) => (
              <div key={media.id} className="relative group rounded-3xl overflow-hidden aspect-square border border-slate-100 shadow-sm">
                {media.type === 'video' ? (
                  <video src={media.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                ) : (
                  <img src={media.url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
                Located near Hindu College, our center provides a peaceful and focused environment for learning. 
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
                href="https://maps.app.goo.gl/32g9qxUuLEKDR5eT8" 
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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118225.12274415843!2d80.02297041670762!3d13.045005096928342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5289c8e3fb42dd%3A0x658d9b0a453aad3d!2sSK%20Tuition%20Centre!5e1!3m2!1sen!2sin!4v1776924942138!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="SK Tuition Centre Location"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
