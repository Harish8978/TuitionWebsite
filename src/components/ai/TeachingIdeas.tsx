import React, { useState } from 'react';
import { generateWithGemini } from '../../services/gemini';
import { Type } from "@google/genai";
import { BookOpen, Lightbulb, Loader2, Sparkles, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeachingIdea {
  name: string;
  description: string;
  materials: string;
  learningOutcome: string;
  engagementReason: string;
}

const TeachingIdeas: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<TeachingIdea[]>([]);
  const [formData, setFormData] = useState({
    topic: '',
    grade: '',
    subject: ''
  });

  const generateIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const systemPrompt = `You are an expert pedagogical consultant for a tuition center in Chennai, India. 
      Your goal is to suggest 5 low-prep, highly engaging teaching activities for the given topic.
      Context: CBSE/TN State Board curriculum.
      Output must be in JSON format.
      Output Schema:
      - ideas: array of objects
        - name: string (activity name)
        - description: string (how to do it)
        - materials: string (what's needed)
        - learningOutcome: string (what students will learn)
        - engagementReason: string (why it works)`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          ideas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                materials: { type: Type.STRING },
                learningOutcome: { type: Type.STRING },
                engagementReason: { type: Type.STRING },
              },
              required: ["name", "description", "materials", "learningOutcome", "engagementReason"],
            },
          },
        },
        required: ["ideas"],
      };

      const userPrompt = `Topic: ${formData.topic}
      Grade: ${formData.grade}
      Subject: ${formData.subject}
      Please generate 5 engaging teaching ideas.`;

      const result = await generateWithGemini(
        systemPrompt,
        userPrompt,
        "gemini-3-flash-preview",
        "application/json",
        responseSchema
      );

      const parsed = JSON.parse(result);
      setIdeas(parsed.ideas);
      toast.success("5 Teaching Ideas generated!");
    } catch (error) {
      console.error("Ideas generation error:", error);
      toast.error("Failed to generate teaching ideas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-900 p-2 rounded-xl">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-black text-blue-900 tracking-tight uppercase">AI Teaching Content Ideas</h3>
      </div>

      <form onSubmit={generateIdeas} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subject</label>
          <input
            required
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
            placeholder="e.g. Physics"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Grade/Class</label>
          <input
            required
            type="text"
            value={formData.grade}
            onChange={(e) => setFormData({...formData, grade: e.target.value})}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
            placeholder="e.g. 10th Grade"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Topic Name</label>
          <input
            required
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold"
            placeholder="e.g. Newton's Laws"
          />
        </div>
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-900 text-white py-5 rounded-3xl font-bold text-lg hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            Get 5 Engaging Teaching Ideas
          </button>
        </div>
      </form>

      {ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {ideas.map((idea, i) => (
            <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
              <div className="flex items-start justify-between">
                <span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">
                  {i + 1}
                </span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                  {formData.subject}
                </span>
              </div>
              <h4 className="text-lg font-black text-blue-900 tracking-tight uppercase">{idea.name}</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{idea.description}</p>
              <div className="pt-4 space-y-3 border-t border-slate-200">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Materials</p>
                  <p className="text-xs text-slate-700 font-bold">{idea.materials}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Learning Outcome</p>
                  <p className="text-xs text-slate-700 font-bold">{idea.learningOutcome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeachingIdeas;
