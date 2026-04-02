import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Phone, Mail, Calendar, User, MessageSquare, Search } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

const ViewEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'enquiries'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setEnquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        await deleteDoc(doc(db, 'enquiries', id));
        setEnquiries(enquiries.filter(e => e.id !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `enquiries/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900">Student Enquiries</h1>
        <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-full font-bold text-sm">
          {enquiries.length} Total
        </div>
      </div>

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
              placeholder="Search enquiries by name, grade, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium shadow-sm"
            />
          </div>

          {enquiries.filter(e => 
            (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (e.grade || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (e.phone || '').includes(searchTerm)
          ).length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence>
                {enquiries.filter(e => 
                  (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (e.grade || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (e.phone || '').includes(searchTerm)
                ).map((enquiry) => (
              <motion.div
                key={enquiry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  <div className="space-y-6 flex-grow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-900 font-bold text-xl">
                        {enquiry.name[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{enquiry.name}</h3>
                        <p className="text-blue-600 font-bold">Grade: {enquiry.grade}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{enquiry.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">
                          {enquiry.timestamp?.toDate().toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex gap-3">
                        <MessageSquare className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                        <p className="text-slate-700 leading-relaxed">{enquiry.message}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex lg:flex-col justify-end gap-3">
                    <button
                      onClick={() => handleDelete(enquiry.id)}
                      className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Delete Enquiry"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No enquiries found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewEnquiries;
