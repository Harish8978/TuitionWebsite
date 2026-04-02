import React, { useState } from 'react';
import { generateWithGemini } from '../../services/gemini';
import { Calendar, Clock, BookOpen, Loader2, Sparkles, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';

const StudyPlanGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    examDate: '',
    weakSubjects: '',
    studyHours: '4',
    otherNotes: ''
  });

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDate = new Date(formData.examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      toast.error("Please select a future date for the exam.");
      return;
    }

    setLoading(true);
    try {
      const systemPrompt = `You are an expert academic counselor for CBSE/TN State Board students in Chennai, India. 
      Your goal is to create a highly realistic and effective revision timetable based on the student's needs.
      Structure the output as a Markdown table with columns: Date | Subjects | Tasks | Time.
      
      Formatting Rules:
      - Use a Markdown table: Date | Subjects | Tasks | Time.
      - If you need line breaks inside a table cell, use the <br> tag.
      - Prioritize weak areas mentioned by the student.
      - Include breaks and practice tests.
      - Be realistic about daily study hours.
      - Use a professional yet encouraging tone.`;

      const today = new Date().toLocaleDateString('en-IN');
      const userPrompt = `Today's Date: ${today}
      Exam Date: ${formData.examDate}
      Weak Subjects/Topics: ${formData.weakSubjects}
      Daily Study Hours: ${formData.studyHours}
      Other Notes: ${formData.otherNotes}
      
      Please generate a revision plan starting from tomorrow until the day before the exam. 
      If the exam is very close (less than 7 days), make the plan more intensive. 
      If the exam is far away, structure it in phases (e.g., Foundation, Practice, Final Revision).`;

      const result = await generateWithGemini(systemPrompt, userPrompt);
      setPlan(result);
      toast.success("Revision Plan generated!");
    } catch (error) {
      console.error("Plan generation error:", error);
      toast.error("Failed to generate revision plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-900 p-2 rounded-xl">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-black text-blue-900 tracking-tight uppercase">AI Revision Plan Generator</h3>
      </div>

      <form onSubmit={generatePlan} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Exam Date</label>
            <input
              required
              type="date"
              value={formData.examDate}
              onChange={(e) => setFormData({...formData, examDate: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Daily Study Hours</label>
            <select
              value={formData.studyHours}
              onChange={(e) => setFormData({...formData, studyHours: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
            >
              {[2, 3, 4, 5, 6, 8, 10].map(h => (
                <option key={h} value={h}>{h} Hours</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Weak Subjects/Topics</label>
            <input
              required
              type="text"
              value={formData.weakSubjects}
              onChange={(e) => setFormData({...formData, weakSubjects: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
              placeholder="e.g. Maths (Trigonometry), Physics (Optics)"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Other Notes</label>
            <input
              type="text"
              value={formData.otherNotes}
              onChange={(e) => setFormData({...formData, otherNotes: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
              placeholder="e.g. Include time for sports, focus on previous year papers"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-900 text-white py-5 rounded-3xl font-bold text-lg hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            Create My Revision Plan
          </button>
        </div>
      </form>

      {plan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="prose prose-slate max-w-none p-8 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-x-auto">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw]}
            >
              {plan}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanGenerator;
