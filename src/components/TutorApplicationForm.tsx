import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  BookOpen, 
  Phone, 
  Mail, 
  Home as HomeIcon, 
  Send, 
  CheckCircle,
  Loader2,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';

// API Base URL
const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

type FormDataType = {
  fullName: string;
  country: string;
  city: string;
  subject: string;
  academicLevel: string;
  whatsappNumber: string;
  email: string;
  address: string;
  additionalInfo: string;
};

export default function TutorApplicationForm() {
  const [formData, setFormData] = useState<FormDataType>({
    fullName: '',
    country: '',
    city: '',
    subject: '',
    academicLevel: '',
    whatsappNumber: '',
    email: '',
    address: '',
    additionalInfo: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // SEO: page title + meta description + keywords
  useEffect(() => {
    document.title = 'Find a Private Tutor Request a Tutor | Learn with Trusted Tutors';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Find experienced private tutors for Mathematics, English, Sciences, Programming and more. Submit your requirements and we’ll match you with vetted tutors quickly.');
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Find experienced private tutors for Mathematics, English, Sciences, Programming and more. Submit your requirements and we’ll match you with vetted tutors quickly.';
      document.head.appendChild(m);
    }

    const metaKeys = document.querySelector('meta[name="keywords"]');
    if (!metaKeys) {
      const k = document.createElement('meta');
      k.name = 'keywords';
      k.content = 'private tutor, online tutor, maths tutor, english tutor, programming tutor, tutor near me, tutor request';
      document.head.appendChild(k);
    }
  }, []);

  // JSON-LD structured data for SEO (Organization + Service + FAQ)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "TutorConnect",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo.png`,
    "contactPoint": [{
      "@type": "ContactPoint",
      "telephone": "+2348000000000",
      "contactType": "customer support",
      "areaServed": "NG"
    }],
    "description": "We connect students with vetted private tutors for personalised learning across academic and professional subjects.",
    "sameAs": []
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How quickly will I be matched with a tutor?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We typically match you within 24-72 hours depending on subject and availability."
        }
      },
      {
        "@type": "Question",
        "name": "Do you verify tutors' qualifications?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes  tutors are vetted by our team and must provide proof of qualifications and references."
        }
      }
    ]
  };

  // Basic client-side validation
  const validate = (data: FormDataType) => {
    const errs: Record<string, string> = {};
    if (!data.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Enter a valid email address.';
    if (!data.whatsappNumber.trim()) errs.whatsappNumber = 'WhatsApp number is required.';
    if (!data.subject.trim()) errs.subject = 'Subject is required.';
    if (!data.academicLevel.trim()) errs.academicLevel = 'Student level is required.';
    if (!data.country.trim()) errs.country = 'Country is required.';
    if (!data.address.trim()) errs.address = 'Address is required.';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // live validation clearing
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs = validate(formData);
    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    try {
      // Send data to backend
      await axios.post(`${API_BASE}/tutor-application/`, formData);
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit application. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          aria-live="polite"
        >
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Received!</h2>
          <p className="text-gray-600 mb-8">
            Thank you we received your tutor request. Our team will review your requirements and contact you shortly via email or WhatsApp to arrange the perfect match.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-colors w-full"
          >
            Return Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Inject structured data for crawlers */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-yellow-700 hover:text-yellow-800 font-medium mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Find Your Perfect <span className="text-yellow-700">Private Tutor</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Looking for personalized learning for yourself or your child? Submit the form below and we’ll match you with vetted tutors who specialise in academic and professional subjects.
              </p>
              {/* SEO visible keywords (subtle) */}
              <p className="text-sm text-gray-400 mt-2">
                Keywords: private tutor, online tutor, exam preparation, school tutoring, programming tutor
              </p>
            </motion.div>
          </div>

          {/* Form Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Progress Bar / Decorative Header */}
            <div className="h-2 bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600" />
            
            <form onSubmit={handleSubmit} className="p-8 md:p-12" aria-label="Tutor application form">
              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center" role="alert">
                  <span className="mr-2">⚠️</span> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                    <User className="w-5 h-5 mr-2 text-yellow-700" /> Personal Details
                  </h3>
                  
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      aria-invalid={!!validationErrors.fullName}
                      aria-describedby={validationErrors.fullName ? 'fullName-error' : undefined}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                      placeholder="e.g. John Doe"
                    />
                    {validationErrors.fullName && <p id="fullName-error" className="text-sm text-red-600 mt-1">{validationErrors.fullName}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        aria-invalid={!!validationErrors.email}
                        aria-describedby={validationErrors.email ? 'email-error' : undefined}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    {validationErrors.email && <p id="email-error" className="text-sm text-red-600 mt-1">{validationErrors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        id="whatsappNumber"
                        type="tel"
                        name="whatsappNumber"
                        required
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        aria-invalid={!!validationErrors.whatsappNumber}
                        aria-describedby={validationErrors.whatsappNumber ? 'whatsapp-error' : undefined}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                    {validationErrors.whatsappNumber && <p id="whatsapp-error" className="text-sm text-red-600 mt-1">{validationErrors.whatsappNumber}</p>}
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                    <BookOpen className="w-5 h-5 mr-2 text-yellow-700" /> Request Details
                  </h3>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject / Course Needed</label>
                    <input
                      id="subject"
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      aria-invalid={!!validationErrors.subject}
                      aria-describedby={validationErrors.subject ? 'subject-error' : undefined}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                      placeholder="e.g. Mathematics, French, React JS"
                    />
                    {validationErrors.subject && <p id="subject-error" className="text-sm text-red-600 mt-1">{validationErrors.subject}</p>}
                  </div>

                  {/* Academic Level / Class */}
                  <div>
                    <label htmlFor="academicLevel" className="block text-sm font-medium text-gray-700 mb-2">Student's Level / Class</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        id="academicLevel"
                        type="text"
                        name="academicLevel"
                        required
                        value={formData.academicLevel}
                        onChange={handleChange}
                        aria-invalid={!!validationErrors.academicLevel}
                        aria-describedby={validationErrors.academicLevel ? 'level-error' : undefined}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                        placeholder="e.g. JSS 2, Grade 5, 100 Level, Adult Learner"
                      />
                    </div>
                    {validationErrors.academicLevel && <p id="level-error" className="text-sm text-red-600 mt-1">{validationErrors.academicLevel}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          id="country"
                          type="text"
                          name="country"
                          required
                          value={formData.country}
                          onChange={handleChange}
                          aria-invalid={!!validationErrors.country}
                          aria-describedby={validationErrors.country ? 'country-error' : undefined}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                          placeholder="Country"
                        />
                      </div>
                      {validationErrors.country && <p id="country-error" className="text-sm text-red-600 mt-1">{validationErrors.country}</p>}
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City/State</label>
                      <input
                        id="city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Full Residential Address</label>
                    <div className="relative">
                      <HomeIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <textarea
                        id="address"
                        name="address"
                        required
                        rows={2}
                        value={formData.address}
                        onChange={handleChange}
                        aria-invalid={!!validationErrors.address}
                        aria-describedby={validationErrors.address ? 'address-error' : undefined}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                        placeholder="Street address, apartment, etc."
                      />
                    </div>
                    {validationErrors.address && <p id="address-error" className="text-sm text-red-600 mt-1">{validationErrors.address}</p>}
                  </div>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="mt-8">
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">Additional Information (Optional)</label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={4}
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                  placeholder="Specific goals, preferred schedule (e.g. Weekends only), gender preference for tutor, or any special requirements..."
                />
                <p className="text-xs text-gray-400 mt-2">Tip: Mention specific topics (e.g., calculus, essay writing, React hooks) to speed up matching.</p>
              </div>

              {/* Submit Button */}
              <div className="mt-10">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto md:min-w-[200px] float-right px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-yellow-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-live="polite"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request <Send className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
          
          <p className="text-center text-gray-500 mt-8 text-sm">
            Your information is secure and will only be used to connect you with a tutor.
          </p>

          {/* SEO-friendly content sections */}
          <section className="mt-10 bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why choose our tutors?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-xl">
                <h3 className="font-semibold text-gray-800">Vetted & Qualified</h3>
                <p className="text-sm text-gray-600 mt-2">All tutors are screened for experience and qualifications to ensure high-quality lessons.</p>
              </div>
              <div className="p-4 border rounded-xl">
                <h3 className="font-semibold text-gray-800">Personalised Learning</h3>
                <p className="text-sm text-gray-600 mt-2">Lessons tailored to the student's goals, pace and preferred learning style  online or in-person where available.</p>
              </div>
              <div className="p-4 border rounded-xl">
                <h3 className="font-semibold text-gray-800">Flexible Scheduling</h3>
                <p className="text-sm text-gray-600 mt-2">Choose times that work for you  evenings, weekends, or intensive revision sessions.</p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Testimonials */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What parents & students say</h3>
              <blockquote className="text-gray-700 italic">"Our tutor helped my son improve his maths grade from C to A in one term. Highly recommended!"</blockquote>
              <div className="mt-4 text-sm text-gray-500">— A satisfied parent</div>
              <hr className="my-4" />
              <blockquote className="text-gray-700 italic">"Great explanations, patient teacher and helpful resources for exam prep."</blockquote>
              <div className="mt-4 text-sm text-gray-500">— University student</div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently asked questions</h3>
              {[
                { q: 'How quickly will I be matched with a tutor?', a: 'We typically match within 24-72 hours depending on subject and availability.' },
                { q: 'Can I request a male or female tutor?', a: 'Yes indicate your preference in the additional information field and we will try to accommodate.' },
                { q: 'Do tutors provide learning materials?', a: 'Many tutors provide resources and practice materials; you can request this when submitting the form.' }
              ].map((item, idx) => (
                <div key={idx} className="mb-3">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 transition"
                    aria-expanded={openFaq === idx}
                    aria-controls={`faq-panel-${idx}`}
                  >
                    <span className="font-medium text-gray-800">{item.q}</span>
                    <span className="text-yellow-600 font-bold">{openFaq === idx ? '-' : '+'}</span>
                  </button>
                  <div id={`faq-panel-${idx}`} role="region" aria-hidden={openFaq !== idx} className={`mt-2 px-3 ${openFaq === idx ? '' : 'hidden'}`}>
                    <p className="text-sm text-gray-600">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <p className="text-center text-gray-400 mt-8 text-sm">
            <span className="font-medium text-gray-600">Need help?</span> Contact us at <a href="mailto:support@lighthubacademy.org" className="text-yellow-700 hover:underline">support@lighthubacademy.org</a> or WhatsApp 07063899747.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
