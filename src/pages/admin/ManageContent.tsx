import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Image as ImageIcon, Video, FileText, Megaphone, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ManageContent() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'ads' | 'gallery'>('announcements');
  
  // Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  
  // Forms
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [adForm, setAdForm] = useState({ title: '', link: '', imageUrl: '' });
  const [mediaForm, setMediaForm] = useState({ url: '', type: 'image' });
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubAnn = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), snap => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubAds = onSnapshot(query(collection(db, 'advertisements'), orderBy('createdAt', 'desc')), snap => {
      setAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')), snap => {
      setGallery(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubAnn(); unsubAds(); unsubGallery(); };
  }, []);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    setUploading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...announcementForm,
        createdAt: serverTimestamp()
      });
      setAnnouncementForm({ title: '', content: '' });
    } catch (err) { 
      console.error(err); 
      alert("Failed to add announcement. Check permissions.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title) return;
    setUploading(true);

    let finalImageUrl = adForm.imageUrl;

    try {
      if (file) {
        finalImageUrl = await compressAndConvert(file);
      }

      if (!finalImageUrl) {
        alert("Please provide an image URL or upload an image.");
        setUploading(false);
        return;
      }

      await addDoc(collection(db, 'advertisements'), {
        title: adForm.title,
        link: adForm.link,
        imageUrl: finalImageUrl,
        createdAt: serverTimestamp()
      });
      setAdForm({ title: '', link: '', imageUrl: '' });
      setFile(null);
      setFileInputKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to save ad data. If the image is very large, try a smaller one or use a URL.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    let finalUrl = mediaForm.url;
    let finalType = mediaForm.type;

    try {
      if (file) {
        if (file.type.startsWith('video/') && file.size > 2 * 1024 * 1024) {
          throw new Error("Video file too large for direct upload. Please use a URL instead.");
        }
        
        if (file.type.startsWith('image/')) {
          finalUrl = await compressAndConvert(file);
          finalType = 'image';
        } else {
          finalUrl = await convertFileToBase64(file);
          finalType = 'video';
        }
      }

      if (!finalUrl) {
        alert("Please provide a media URL or upload a file.");
        setUploading(false);
        return;
      }

      await addDoc(collection(db, 'gallery'), {
        url: finalUrl,
        type: finalType,
        createdAt: serverTimestamp()
      });
      setFile(null);
      setMediaForm({ url: '', type: 'image' });
      setFileInputKey(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save media. For large files, please paste a URL instead.");
    } finally {
      setUploading(false);
    }
  };

  const compressAndConvert = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxDim = 1200;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (confirm('Are you sure you want to delete this?')) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-blue-900 tracking-tight uppercase">Manage Content</h1>
        <p className="text-slate-500 font-medium">Update announcements, ads, and gallery for public view.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-5 h-5" /> },
          { id: 'ads', label: 'Advertisements', icon: <FileText className="w-5 h-5" /> },
          { id: 'gallery', label: 'Media Gallery', icon: <ImageIcon className="w-5 h-5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 px-6 font-bold border-b-2 transition-all ${
              activeTab === tab.id ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-blue-900'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        {activeTab === 'announcements' && (
          <div className="space-y-8">
            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <h3 className="text-xl font-bold text-blue-900">Add New Announcement</h3>
              <input 
                required
                type="text" 
                placeholder="Announcement Title" 
                value={announcementForm.title}
                onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                className="w-full px-5 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-900/10"
              />
              <textarea 
                required
                placeholder="Announcement Content" 
                value={announcementForm.content}
                onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})}
                className="w-full px-5 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-900/10 h-32"
              />
              <button disabled={uploading} type="submit" className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-70 flex items-center gap-2">
                {uploading && activeTab === 'announcements' ? <><Loader2 className="w-5 h-5 animate-spin" /> Adding...</> : 'Add Announcement'}
              </button>
            </form>
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann.id} className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900">{ann.title}</h4>
                    <p className="text-slate-600">{ann.content}</p>
                  </div>
                  <button onClick={() => handleDelete('announcements', ann.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl h-fit"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-8">
            <form onSubmit={handleAddAd} className="space-y-4">
              <h3 className="text-xl font-bold text-blue-900">Add New Advertisement</h3>
              <input 
                required
                type="text" 
                placeholder="Ad Title" 
                value={adForm.title}
                onChange={e => setAdForm({...adForm, title: e.target.value})}
                className="w-full px-5 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2"
              />
              <input 
                type="url" 
                placeholder="Ad Link (optional)" 
                value={adForm.link}
                onChange={e => setAdForm({...adForm, link: e.target.value})}
                className="w-full px-5 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2"
              />
              <input 
                type="url" 
                placeholder="Image URL (Or upload below)" 
                value={adForm.imageUrl}
                onChange={e => setAdForm({...adForm, imageUrl: e.target.value})}
                className="w-full px-5 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2"
              />
              <input 
                key={`ad-file-${fileInputKey}`}
                type="file" 
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full px-5 py-3 border border-slate-200 rounded-xl"
              />
              <p className="text-xs text-slate-500">Provide an image URL <strong>OR</strong> upload a small image (under 1MB).</p>
              <button disabled={uploading} type="submit" className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center gap-2">
                {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : 'Add Advertisement'}
              </button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map(ad => (
                <div key={ad.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video">
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white font-bold">{ad.title}</p>
                    <button onClick={() => handleDelete('advertisements', ad.id)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl"><Trash2 className="w-5 h-5"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <form onSubmit={handleAddMedia} className="space-y-4">
              <h3 className="text-xl font-bold text-blue-900">Add Media to Gallery</h3>
              <div className="flex gap-4">
                <select 
                  value={mediaForm.type}
                  onChange={e => setMediaForm({...mediaForm, type: e.target.value})}
                  className="px-5 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <input 
                  type="url" 
                  placeholder="Paste Media URL (YouTube, Drive, Imgur, etc.)" 
                  value={mediaForm.url}
                  onChange={e => setMediaForm({...mediaForm, url: e.target.value})}
                  className="w-full px-5 py-3 border border-slate-200 rounded-xl font-medium focus:ring-2"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">OR UPLOAD FILE</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <input 
                key={`gallery-file-${fileInputKey}`}
                type="file" 
                accept="image/*,video/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full px-5 py-3 border border-slate-200 rounded-xl"
              />
              <p className="text-xs text-slate-500 font-medium">Images are automatically compressed. For videos or very large files, please paste a URL instead.</p>
              <button disabled={uploading} type="submit" className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center gap-2">
                {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : 'Upload Media'}
              </button>
            </form>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map(media => (
                <div key={media.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square">
                  {media.type === 'video' ? (
                    <video src={media.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={media.url} alt="Gallery" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDelete('gallery', media.id)} className="bg-red-500 text-white p-3 rounded-xl hover:scale-110 transition-transform"><Trash2 className="w-6 h-6"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
