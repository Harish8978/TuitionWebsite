import { motion } from 'motion/react';
import { GraduationCap, ArrowRight, Sparkles, BookOpen, Target } from 'lucide-react';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-orange-500" />,
      title: "Conceptual Learning",
      description: "We focus on understanding the 'why' behind every concept, not just memorizing."
    },
    {
      icon: <Target className="w-6 h-6 text-blue-500" />,
      title: "Result Oriented",
      description: "Proven track record of helping students achieve their academic goals and top marks."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-emerald-500" />,
      title: "Personalized Attention",
      description: "Small batch sizes to ensure every student gets the guidance they need."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Visual */}
          <div className="bg-blue-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl opacity-50" />
            
            <div className="relative z-10">
              <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md mb-8">
                <GraduationCap className="w-10 h-10 text-orange-400" />
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-6">
                Unlock Your <span className="text-orange-400">Creative Potential</span> with SK Tuition
              </h1>
              <p className="text-blue-100/80 text-lg leading-relaxed">
                Join our community of learners and transform your academic journey with expert guidance from Lokesh Arumugam.
              </p>
            </div>

            <div className="relative z-10 mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/student${i}/100/100`} 
                    alt="Student" 
                    className="w-10 h-10 rounded-full border-2 border-blue-900"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-sm text-blue-200">Joined by 500+ students this year</p>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="p-8 sm:p-12 flex flex-col justify-center">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to SK Tuition</h2>
              <p className="text-slate-500">Here's how we help you succeed in your studies.</p>
            </div>

            <div className="space-y-8 mb-12">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="bg-slate-50 p-3 rounded-xl h-fit">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={onComplete}
              className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl group"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
