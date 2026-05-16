import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Check, Star, CheckCircle, ArrowRight, Building, Laptop, Briefcase, Globe, Brain, Music } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

export default function PartnershipInvitation() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organizationType: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const messageBody = `
Organization Type: ${formData.organizationType}
Country: ${formData.country}

I am interested in the Course Creator Partnership Invitation.
      `;
      
      await axios.post(`${API_BASE}/messages/contact/`, {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        subject: 'Course Creator Partnership Application',
        message: messageBody,
        type: 'partnership_invitation'
      });
      
      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        organizationType: '',
        country: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while submitting your application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Course Creator <span className="text-brand-600">Partnership Invitation</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                We are delighted to introduce Light Hub Academy (LHA)—a growing global digital learning platform committed to empowering learners through quality education, transformational knowledge, skills development, leadership training, and purpose-driven learning experiences.
              </p>
              
              <ul className="space-y-4">
                {[
                  'Global Reach & Visibility',
                  'Earn from Your Knowledge',
                  'Build Your Personal Brand',
                  'Flexible Teaching Formats'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-brand-600" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <a href="#apply" className="inline-block px-8 py-4 bg-brand-600 text-white rounded font-bold text-lg hover:bg-brand-700 transition-colors">
                  Partner with Us
                </a>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="aspect-[4/5] rounded-tl-[100px] rounded-br-[100px] overflow-hidden shadow-2xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
                  alt="Smiling professional" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 -left-6 bg-gray-900 text-white p-6 rounded-xl shadow-2xl max-w-xs hidden sm:block">
                <div className="text-3xl font-bold mb-1 border-b border-gray-700 pb-2">Why Partner?</div>
                <div className="text-sm text-gray-300 pt-2">
                  Knowledge is one of the greatest tools for transformation. Your expertise can reach learners across nations.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Types of Courses You Can Create</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We welcome courses across a wide range of disciplines. If your expertise lies outside these categories, we would still be glad to explore it with you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all border-t-4 border-t-brand-600">
              <Laptop className="w-10 h-10 text-brand-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Technology & Digital Skills</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Data Analysis & AI</li>
                <li>• Machine Learning</li>
                <li>• Programming & Software Dev</li>
                <li>• UI/UX & Web Design</li>
                <li>• Cybersecurity & Cloud</li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all border-t-4 border-t-green-500">
              <Briefcase className="w-10 h-10 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Business & Career</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Entrepreneurship</li>
                <li>• Project Management</li>
                <li>• Business Strategy</li>
                <li>• Digital Marketing</li>
                <li>• Leadership & Coaching</li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all border-t-4 border-t-purple-500">
              <Building className="w-10 h-10 text-purple-500 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Engineering & Pro Skills</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Chemical Engineering</li>
                <li>• Environmental Management</li>
                <li>• Process Design</li>
                <li>• CAD & Simulation Tools</li>
                <li>• Technical Writing</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all border-t-4 border-t-orange-500">
              <Brain className="w-10 h-10 text-orange-500 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Growth</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Purpose Discovery</li>
                <li>• Leadership Formation</li>
                <li>• Productivity & Time Management</li>
                <li>• Emotional Intelligence</li>
                <li>• Societal Transformation</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all border-t-4 border-t-red-500">
              <Globe className="w-10 h-10 text-red-500 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Faith & Ministry</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Bible Studies</li>
                <li>• Christian Leadership</li>
                <li>• Youth Discipleship</li>
                <li>• Spiritual Growth</li>
                <li>• Ministry Training</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all border-t-4 border-t-pink-500">
              <Music className="w-10 h-10 text-pink-500 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Creative & Practical Skills</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Graphic Design</li>
                <li>• Video Editing</li>
                <li>• Public Speaking</li>
                <li>• Photography & Music</li>
                <li>• Crafts & Vocational Skills</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Details & Form Section */}
      <section id="apply" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Left side text */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Who Can Apply?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  'Experienced professionals',
                  'Subject matter experts',
                  'Academic tutors',
                  'Trainers and consultants',
                  'Coaches and mentors',
                  'Researchers',
                  'Industry practitioners',
                  'Faith and leadership educators'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-brand-600 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Us in Transforming Lives</h3>
              <p className="text-gray-600 mb-6">
                At Light Hub Academy, we believe education should not only transfer knowledge but also ignite purpose, excellence, and societal transformation.
              </p>
              <p className="text-gray-600 mb-6">
                Whether you already have an existing course or need support developing one, LHA can help you bring your vision to life.
              </p>
              <p className="text-gray-600 italic">
                "If you are passionate about teaching and ready to expand your impact, we would be honored to partner with you."
              </p>
            </div>
            
            {/* Right side form */}
            <div className="w-full lg:w-[450px]">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-8 sticky top-28">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Apply to Partner</h3>
                
                {success ? (
                  <div className="bg-green-50 text-green-800 p-6 rounded-lg text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h4 className="font-bold text-lg mb-2">Application Submitted!</h4>
                    <p>Thank you for your interest. Our team will review your application and contact you soon.</p>
                    <button 
                      onClick={() => setSuccess(false)}
                      className="mt-6 text-brand-600 font-semibold hover:underline"
                    >
                      Submit another application
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="First Name"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Last Name"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Work Email Address"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone Number"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all"
                      />
                    </div>
                    
                    <div>
                      <select
                        name="organizationType"
                        value={formData.organizationType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all bg-white text-gray-700"
                      >
                        <option value="" disabled>Organization Type</option>
                        <option value="Individual Expert">Individual Expert / Freelancer</option>
                        <option value="Academic Institution">Academic Institution</option>
                        <option value="Corporate Training">Corporate Training Provider</option>
                        <option value="NGO / Non-Profit">NGO / Non-Profit</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Country"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-all"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 my-4 leading-relaxed">
                      By submitting your info in the form above, you agree to our Terms of Use and Privacy Notice. We may use this info to contact you and/or use data from third parties to personalize your experience.
                    </p>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-brand-600 text-white font-bold rounded hover:bg-brand-700 transition-colors disabled:opacity-70 flex justify-center items-center"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
