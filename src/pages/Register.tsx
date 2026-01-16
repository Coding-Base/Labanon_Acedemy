import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  GraduationCap, 
  Users, 
  Building, 
  Search, 
  CheckCircle,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff,
  Shield,
  Globe,
  Award,
  BookOpen
} from 'lucide-react';
import { register } from '../api/auth';
import labanonLogo from './labanonlogo.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const nextParam = params.get('next') || '';

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const roles = [
    { 
      id: 'student', 
      label: 'Student', 
      icon: <GraduationCap className="w-6 h-6" />,
      description: 'Access courses, take exams, track progress',
      color: 'from-green-500 to-teal-400',
      features: ['Access to all courses', 'Progress tracking', 'Certificate earning',' Practice real CBT  past questions Jamb, Waec, Neco']
    },
    { 
      id: 'tutor', 
      label: 'Tutor/Instructor', 
      icon: <Users className="w-6 h-6" />,
      description: 'Create courses, teach students, earn money',
      color: 'from-purple-500 to-pink-400',
      features: ['Create and sell courses', 'Live teaching sessions', 'Revenue sharing', ]
    },
    { 
      id: 'institution', 
      label: 'Institution/School', 
      icon: <Building className="w-6 h-6" />,
      description: 'Manage students, create courses, track performance',
      color: 'from-green-500 to-emerald-400',
      features: ['Portfolio management' ,'Custom courses Sales', 'Performance analytics', 'Institution portal']
    },
    { 
      id: 'researcher', 
      label: 'Researcher/Professional', 
      icon: <Search className="w-6 h-6" />,
      description: 'Access advanced courses, research materials',
      color: 'from-amber-500 to-orange-400',
      features: ['Access to Interview Questions','Advanced courses', 'Research materials', 'Professional network', 'Learning analytics']
    }
  ];

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /\d/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*]/.test(password) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    // Validation
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordRequirements.every(req => req.met)) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      await register({ username, email, password, role, first_name: firstName, last_name: lastName });
      // After successful registration, redirect to login preserving `next` if present
      const qs = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';
      // small success delay for UX
      setTimeout(() => {
        navigate(`/login${qs}`, { replace: true });
      }, 800);
    } catch (err: any) {
      // DRF/Djoser typically returns field errors as an object: { username: [..], email:[..] }
      const resp = err?.response?.data;
      if (resp && typeof resp === 'object') {
        // collect field errors
        const fields: Record<string, string[]> = {};
        let general: string | null = null;
        if (Array.isArray(resp)) {
          general = resp.join(' ');
        } else {
          for (const k of Object.keys(resp)) {
            const v = resp[k];
            if (Array.isArray(v)) fields[k] = v.map(String);
            else fields[k] = [String(v)];
          }
          // try to pick a sensible general error
          if (fields.username && fields.username.length) general = fields.username.join(' ');
          else if (fields.email && fields.email.length) general = fields.email.join(' ');
          else if (fields.non_field_errors) general = fields.non_field_errors.join(' ');
        }
        setFieldErrors(fields);
        setError(general || 'Registration failed. Please check your input.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const isFormValid = () => {
    return firstName && lastName && username && email && password && confirmPassword && 
           password === confirmPassword &&
           passwordRequirements.every(req => req.met);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl w-full"
      >
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Form */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-2 mb-4">
                <img src={labanonLogo} alt="LightHub Academy" className="w-10 h-10 object-contain" />
                <div className="text-left">
                  <h1 className="text-xl font-bold text-gray-900">
                    LightHub Academy
                  </h1>
                  <p className="text-xs text-gray-500">Future Ready Learning</p>
                </div>
              </Link>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Join <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">LightHub Academy</span>
              </h2>
              <p className="text-gray-600">Start your learning journey today</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                {[1, 2].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step >= stepNumber 
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {stepNumber}
                    </div>
                    {stepNumber < 2 && (
                      <div className={`w-16 h-1 ${
                        step > stepNumber ? 'bg-gradient-to-r from-green-600 to-teal-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Choose Your Account Type
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {roles.map((roleOption) => (
                    <motion.div
                      key={roleOption.id}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRole(roleOption.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ${
                        role === roleOption.id
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${roleOption.color} rounded-xl flex items-center justify-center`}>
                          <div className="text-white">
                            {roleOption.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{roleOption.label}</h4>
                          <p className="text-sm text-gray-600 mb-3">{roleOption.description}</p>
                          <ul className="space-y-1">
                            {roleOption.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center text-xs text-gray-500">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {role === roleOption.id && (
                          <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                </motion.button>
              </motion.div>
            )}

            {/* Step 2: Registration Form */}
            {step === 2 && (
              <motion.form
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
                >
                  <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
                  Back to account type
                </button>

                {/* Selected Role Display */}
                <div className="flex items-center justify-center mb-6">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
                    {roles.find(r => r.id === role)?.icon}
                    <span className="font-medium">{roles.find(r => r.id === role)?.label}</span>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                      {fieldErrors.first_name && (
                        <p className="mt-2 text-sm text-red-600">{fieldErrors.first_name.join(' ')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                      {fieldErrors.last_name && (
                        <p className="mt-2 text-sm text-red-600">{fieldErrors.last_name.join(' ')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                    {fieldErrors.username && (
                      <p className="mt-2 text-sm text-red-600">{fieldErrors.username.join(' ')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="mt-2 text-sm text-red-600">{fieldErrors.email.join(' ')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="mt-3 space-y-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center">
                          {req.met ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                          )}
                          <span className={`text-sm ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 w-4 h-4 text-green-600 rounded"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isLoading || !isFormValid()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Account
                    </span>
                  )}
                </motion.button>

                {/* Login Link */}
                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link to={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`} className="text-green-600 hover:text-green-700 font-semibold">
                      Sign In
                    </Link>
                  </p>
                </div>
              </motion.form>
            )}
          </motion.div>

          {/* Right Side - Features & Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:flex flex-col justify-center p-8"
          >
            <div className="space-y-8">
              {/* Feature 1 */}
              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-start space-x-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Recognized Certificates</h3>
                  <p className="text-gray-600">
                    Earn industry-recognized certificates upon course completion that boost your career.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                whileHover={{ x: 10 }}
                transition={{ delay: 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Comprehensive Learning</h3>
                  <p className="text-gray-600">
                    Access thousands of courses across all subjects, from exam prep to professional skills.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                whileHover={{ x: 10 }}
                transition={{ delay: 0.2 }}
                className="flex items-start space-x-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Learn Anywhere</h3>
                  <p className="text-gray-600">
                    Access courses on any device, at your own pace, with progress synced across all platforms.
                  </p>
                </div>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                whileHover={{ x: 10 }}
                transition={{ delay: 0.3 }}
                className="flex items-start space-x-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Instructors</h3>
                  <p className="text-gray-600">
                    Learn from certified tutors and industry professionals with years of teaching experience.
                  </p>
                </div>
              </motion.div>

              {/* Testimonial */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-8 text-white"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Dr. Sarah Johnson</h4>
                    <p className="text-blue-200">Education Director</p>
                  </div>
                </div>
                <p className="italic text-lg">
                  "LightHub Academy transformed how I teach and reach students. The platform's tools helped me create engaging courses that students love."
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
