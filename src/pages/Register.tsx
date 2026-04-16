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
import api from '../utils/axiosInterceptor'
import labanonLogo from './labanonlogo.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
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
  const pendingDownload = params.get('pendingDownload') || '';
  const fromInstitutions = params.get('from') === 'institutions'; // Check if coming from institutions page

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

  // Institution-specific fields (Step 1.5)
  const [institutionType, setInstitutionType] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [contactFullName, setContactFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [country, setCountry] = useState('');
  const [purpose, setPurpose] = useState<string[]>([]);

  const roles = [
    { 
      id: 'student', 
      label: 'Student', 
      icon: <GraduationCap className="w-6 h-6" />,
      description: 'Access courses, take exams, track progress',
      color: 'from-brand-500 to-brand-400',
      features: [
        'Access to all courses',
        'Progress tracking',
        'Certificate earning',
        'Practice real CBT past questions (JAMB, WAEC, NECO)'
      ]
    },
    { 
      id: 'tutor', 
      label: 'Tutor/Instructor', 
      icon: <Users className="w-6 h-6" />,
      description: 'Create courses, teach students, earn money',
      color: 'from-brand-500 to-pink-400',
      features: ['Create and sell courses', 'Live teaching sessions', 'Revenue sharing', ]
    },
    { 
      id: 'institution', 
      label: 'Institution/School', 
      icon: <Building className="w-6 h-6" />,
      description: 'Manage students, create courses, track performance',
      color: 'from-brand-500 to-brand-400',
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

  // Filter roles based on referrer: only show student & researcher by default, all if from institutions
  const visibleRoles = fromInstitutions 
    ? roles 
    : roles.filter(r => r.id === 'student' || r.id === 'researcher');

  const institutionTypes = [
    { value: 'university', label: 'University' },
    { value: 'polytechnic', label: 'Polytechnic' },
    { value: 'secondary_school', label: 'Secondary School' },
    { value: 'training_org', label: 'Training Organization' },
    { value: 'professional_institute', label: 'Professional Institute' },
    { value: 'tutorial_center', label: 'Tutorial Center' },
  ];

  const purposeOptions = [
    { value: 'host_courses', label: 'Host courses' },
    { value: 'recruitment_exams', label: 'Organise recruitment exams or online exams' },
    { value: 'certificates', label: 'Launch certificate programs' },
    { value: 'partnerships', label: 'Explore partnership opportunities' },
  ];

  const positionOptions = [
    { value: 'president', label: 'President/Rector' },
    { value: 'vice_chancellor', label: 'Vice Chancellor/Principal' },
    { value: 'provost', label: 'Provost' },
    { value: 'dean', label: 'Dean' },
    { value: 'hod', label: 'Head of Department (HOD)' },
    { value: 'teaching_staff', label: 'Teaching Staff' },
    { value: 'it_admin', label: 'IT/Admin Staff' },
    { value: 'others', label: 'Others' },
  ];

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 
    'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 
    'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 
    'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 
    'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Côte d\'Ivoire', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
    'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
    'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
    'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
    'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
    'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
    'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
    'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
    'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
    'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
    'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
    'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
    'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
    'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
    'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen', 'Zambia', 'Zimbabwe'
  ];

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /\d/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*]/.test(password) },
  ];

  const togglePurpose = (purposeValue: string) => {
    setPurpose(prev => 
      prev.includes(purposeValue) 
        ? prev.filter(p => p !== purposeValue)
        : [...prev, purposeValue]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    // Validation for Step 2
    // For institutions, don't require firstName/lastName
    if (role === 'institution') {
      if (!email || !password || !confirmPassword) {
        setError('Email and password are required');
        return;
      }
    } else {
      if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        setError('All fields are required');
        return;
      }
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordRequirements.every(req => req.met)) {
      setError('Password does not meet requirements');
      return;
    }

    // Additional validation for institution role
    if (role === 'institution') {
      if (!institutionName || !institutionType || !position || !department || !country) {
        setError('Please fill in all institution details');
        return;
      }
      if (purpose.length === 0) {
        setError('Please select at least one purpose');
        return;
      }
    }

    setIsLoading(true);

    try {
      const registrationData: any = {
        username: role === 'institution' ? institutionName : username,
        email,
        password,
        role,
        first_name: role === 'institution' ? contactFullName || institutionName : firstName,
        last_name: role === 'institution' ? '' : lastName,
      };

      // Add institution-specific data if role is institution
      if (role === 'institution') {
        registrationData.institution_name = institutionName;
        registrationData.full_name = contactFullName;
        registrationData.job_title = jobTitle;
        registrationData.work_email = workEmail;
        registrationData.institution_type = institutionType;
        registrationData.position = position;
        registrationData.department = department;
        registrationData.country = country;
        registrationData.purpose = purpose.join(',');
      }

      await register(registrationData);

      // If user just registered and there was a pending download, request the public endpoint
      if (pendingDownload) {
        try {
          await api.post(`/materials/materials/${pendingDownload}/request_download_email/`, { email })
          // ignore response; verification email is primary
        } catch (err) {
          console.warn('Failed to request download email after registration', err)
        }
      }

      // Show verification email message and redirect
      setTimeout(() => {
        navigate('/verify-email-sent', { 
          state: { email, role },
          replace: true 
        });
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

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole);
    // Move to Step 1.5 if institution, otherwise to Step 2
    if (selectedRole === 'institution') {
      setStep(1.5);
    } else {
      setStep(2);
    }
  };

  const handleBackFromInstitution = () => {
    setStep(1);
    setRole('student');
  };

  const handleContinueFromInstitution = () => {
    // Validate institution fields
    if (!institutionName || !institutionType || !position || !department || !country || purpose.length === 0) {
      setError('Please fill in all institution details');
      return;
    }
    setError(null);
    setStep(2);
  };

  const isFormValid = () => {
    // For institutions: only check email, password, and password requirements
    // (username is auto-generated from institutionName)
    if (role === 'institution') {
      return email && password && confirmPassword && 
             password === confirmPassword &&
             passwordRequirements.every(req => req.met);
    }
    
    // For other roles: check all fields
    return firstName && lastName && username && email && password && confirmPassword && 
           password === confirmPassword &&
           passwordRequirements.every(req => req.met);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50 flex items-center justify-center p-4">
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
                <img src={labanonLogo} alt="LightHub Academy logo" width={40} height={40} className="w-10 h-10 object-contain" />
                <div className="text-left">
                  <h1 className="text-xl font-bold text-gray-900">
                    LightHub Academy
                  </h1>
                  <p className="text-xs text-gray-500">Future Ready Learning</p>
                </div>
              </Link>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Join <span className="bg-gradient-to-r from-brand-600 to-brand-600 bg-clip-text text-transparent">LightHub Academy</span>
              </h2>
              <p className="text-gray-600">Start your learning journey today</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                {role === 'institution' ? (
                  // Institution: 3 steps
                  [1, 1.5, 2].map((stepNumber, idx) => (
                    <React.Fragment key={idx}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        step >= stepNumber 
                          ? 'bg-gradient-to-r from-brand-600 to-brand-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {stepNumber === 1.5 ? '1.5' : stepNumber}
                      </div>
                      {stepNumber !== 2 && (
                        <div className={`w-12 h-1 ${
                          step > stepNumber ? 'bg-gradient-to-r from-brand-600 to-brand-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  // Other roles: 2 steps
                  <>
                  {[1, 2].map((stepNumber) => (
                    <React.Fragment key={stepNumber}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        step >= stepNumber 
                          ? 'bg-gradient-to-r from-brand-600 to-brand-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {stepNumber}
                      </div>
                    {stepNumber < 2 && (
                      <div className={`w-16 h-1 ${
                        step > stepNumber ? 'bg-gradient-to-r from-brand-600 to-brand-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
                  </>
                )}
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
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {visibleRoles.map((roleOption) => (
                    <motion.div
                      key={roleOption.id}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRole(roleOption.id)}
                      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 min-h-[220px] ${
                        role === roleOption.id
                          ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {role === roleOption.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-brand-600 to-brand-600 rounded-full flex items-center justify-center shadow">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-center h-full">
                        <div className={`w-14 h-14 bg-gradient-to-br ${roleOption.color} rounded-2xl flex items-center justify-center mb-3 flex-shrink-0`}>
                          <div className="text-white">
                            {roleOption.icon}
                          </div>
                        </div>

                        <div className="w-full">
                          <h4 className="font-semibold text-gray-900 mb-2 text-center text-base">{roleOption.label}</h4>
                          <p className="text-xs text-gray-600 mb-3 text-center leading-tight">{roleOption.description}</p>
                          <ul className="space-y-1.5 text-left">
                            {roleOption.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start text-xs text-gray-600 gap-2">
                                <CheckCircle className="w-3 h-3 text-brand-600 mt-0.5 flex-shrink-0" />
                                <span className="leading-snug">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRoleSelection(role)}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-600 text-white rounded-xl font-semibold hover:shadow-lg"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                </motion.button>
              </motion.div>
            )}

            {/* Step 1.5: Institution Details (Only for Institution Role) */}
            {step === 1.5 && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Institution Details
                </h3>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Institution Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Type *
                  </label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Select institution type</option>
                    {institutionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Institution Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Your institution name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-sm">Contact Person Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={contactFullName}
                      onChange={(e) => setContactFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Vice Chancellor, Dean, Director"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="your.work@institution.edu"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Organization Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-sm">Organization Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select position</option>
                      {positionOptions.map(pos => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g., Academics, Administration"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select country</option>
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Purpose Selection */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-sm">Purpose of Account Creation *</h4>
                  <p className="text-xs text-gray-600">Select all that apply</p>
                  
                  <div className="space-y-3">
                    {purposeOptions.map(option => (
                      <label key={option.value} className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={purpose.includes(option.value)}
                          onChange={() => togglePurpose(option.value)}
                          className="mt-1 w-4 h-4 text-brand-600 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBackFromInstitution}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinueFromInstitution}
                    className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-brand-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5 inline ml-2" />
                  </motion.button>
                </div>
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
                  onClick={() => role === 'institution' ? setStep(1.5) : setStep(1)}
                  className="flex items-center text-brand-700 hover:text-brand-800 font-medium mb-4"
                >
                  <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
                  Back to {role === 'institution' ? 'institution details' : 'account type'}
                </button>

                {/* Selected Role Display */}
                <div className="flex items-center justify-center mb-6">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-100 text-brand-700 rounded-full">
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
                  {/* First and Last Name - Only for non-institution roles */}
                  {role !== 'institution' && (
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                          required
                        />
                        {fieldErrors.last_name && (
                          <p className="mt-2 text-sm text-red-600">{fieldErrors.last_name.join(' ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Username - Read-only for institutions */}
                  {role === 'institution' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Institution Username
                      </label>
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center text-gray-700">
                        {institutionName || 'Institution name required'}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Auto-generated from institution name</p>
                    </div>
                  ) : (
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                        required
                      />
                      {fieldErrors.username && (
                        <p className="mt-2 text-sm text-red-600">{fieldErrors.username.join(' ')}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your personal email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
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
                            <CheckCircle className="w-4 h-4 text-brand-600 mr-2" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                          )}
                          <span className={`text-sm ${req.met ? 'text-brand-700' : 'text-gray-500'}`}>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
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
                    className="mt-1 w-4 h-4 text-brand-600 rounded"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">
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
                      : 'bg-gradient-to-r from-brand-600 to-brand-600 text-white hover:shadow-lg'
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
                    <Link to={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`} className="text-brand-700 hover:text-brand-800 font-semibold">
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
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <div className="w-12 h-12 bg-gradient-to-br from-yellow--500 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
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
                className="mt-12 bg-gradient-to-br from-yellow-600 to-yellow-600 rounded-2xl p-8 text-white"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Dr. Sarah Johnson</h4>
                    <p className="text-yellow-200">Education Director</p>
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
