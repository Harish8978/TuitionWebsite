import { motion } from 'motion/react';
import { GraduationCap, Award, BookOpen, Lightbulb, Users, Heart } from 'lucide-react';

export default function About() {
  const stats = [
    { label: "Years Experience", value: "10+" },
    { label: "Students Taught", value: "500+" },
    { label: "Subjects Covered", value: "15+" },
    { label: "Success Rate", value: "98%" },
  ];

  const values = [
    {
      icon: <Lightbulb className="w-6 h-6 text-orange-500" />,
      title: "Conceptual Clarity",
      desc: "We don't just teach the 'how', but also the 'why'. Understanding the core concepts is the key to mastering any subject."
    },
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "Personalized Guidance",
      desc: "Every student learns differently. We tailor our teaching style to match each student's pace and learning needs."
    },
    {
      icon: <Heart className="w-6 h-6 text-emerald-500" />,
      title: "Mentorship",
      desc: "Beyond academics, we provide mentorship to help students build confidence and develop a growth mindset."
    }
  ];

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Meet Your Tutor: <br />
                <span className="text-orange-400">Lokesh Arumugam</span>
              </h1>
              <p className="text-blue-100/80 text-lg leading-relaxed max-w-lg">
                With over a decade of experience in academic coaching, Lokesh Arumugam has helped hundreds of students achieve their dreams. 
                His passion for teaching and commitment to student success are the foundation of SK Tuition.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-blue-200 uppercase tracking-wider font-semibold">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative order-first lg:order-last"
            >
              <div className="aspect-square rounded-3xl overflow-hidden border-8 border-white/10 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800" 
                  alt="Lokesh Arumugam" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-orange-500 p-8 rounded-3xl shadow-xl">
                <Award className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Qualification & Style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-orange-500" />
                Qualifications
              </h2>
              <ul className="space-y-4 text-slate-600 text-lg">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2.5 shrink-0" />
                  <span>Master's Degree in Science (M.Sc)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2.5 shrink-0" />
                  <span>Bachelor's Degree in Education (B.Ed)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2.5 shrink-0" />
                  <span>Certified Academic Coach with 10+ years of experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2.5 shrink-0" />
                  <span>Expertise in Mathematics and Science subjects for secondary and higher secondary levels</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-orange-500" />
                Teaching Style
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Our teaching methodology is built on the principle of active engagement. We use real-world examples, 
                interactive problem-solving sessions, and regular assessments to ensure that students are not just 
                learning, but also applying their knowledge. We believe in creating a supportive environment where 
                students feel comfortable asking questions and exploring new ideas.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-8">Our Core Values</h2>
            {values.map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="bg-slate-50 w-fit p-3 rounded-xl mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-500 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
