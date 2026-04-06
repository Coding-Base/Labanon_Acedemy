import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, User, Mail, MapPin, BookOpen, CheckCircle2, XCircle, Loader } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

interface InstitutionProfile {
  id: number;
  user: number;
  full_name: string;
  job_title: string;
  work_email: string;
  institution_name: string;
  institution_type: string;
  position: string;
  department: string;
  country: string;
  purpose_list: Array<{ value: string; label: string }>;
  can_create_diploma_courses: boolean;
  can_create_degree_programs: boolean;
  can_upload_projects: boolean;
  certifications_list: string[];
  dashboard_variant: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export default function InstitutionDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access');
        
        // Fetch user details
        const userRes = await axios.get(`${API_BASE}/users/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userRes.data);

        // Fetch institution profile
        const profileRes = await axios.get(
          `${API_BASE}/users/institution-profile/${userId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile(profileRes.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load institution details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  const institutionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'university': 'University',
      'polytechnic': 'Polytechnic',
      'secondary_school': 'Secondary School',
      'training_org': 'Training Organization',
      'professional_institute': 'Professional Institute',
      'tutorial_center': 'Tutorial Center',
    };
    return types[type] || type;
  };

  const positionLabel = (pos: string) => {
    const positions: Record<string, string> = {
      'president': 'President/Rector',
      'vice_chancellor': 'Vice Chancellor/Principal',
      'provost': 'Provost',
      'dean': 'Dean',
      'hod': 'Head of Department (HOD)',
      'teaching_staff': 'Teaching Staff',
      'it_admin': 'IT/Admin Staff',
      'others': 'Others',
    };
    return positions[pos] || pos;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !profile || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error || 'Institution not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Institutions
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-8 text-white mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{profile.institution_name}</h1>
              <p className="text-brand-100">{institutionTypeLabel(profile.institution_type)}</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <Building className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Person Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-6 h-6 text-brand-600" />
                Contact Person
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Job Title</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.job_title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Work Email</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.work_email}</p>
                </div>
              </div>
            </motion.div>

            {/* Institution Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-6 h-6 text-brand-600" />
                Institution Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {institutionTypeLabel(profile.institution_type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {positionLabel(profile.position)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.country}</p>
                </div>
              </div>
            </motion.div>

            {/* Purpose Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Purpose of Account</h2>
              <div className="flex flex-wrap gap-2">
                {profile.purpose_list.map((purpose, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {purpose.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* User Account Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-brand-600" />
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Account Owner</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="text-lg font-semibold text-gray-900">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Permissions Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Permissions</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {profile.can_create_diploma_courses ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Create Diploma Courses</span>
                </div>
                <div className="flex items-center gap-3">
                  {profile.can_create_degree_programs ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Create Degree Programs</span>
                </div>
                <div className="flex items-center gap-3">
                  {profile.can_upload_projects ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Upload Projects</span>
                </div>
              </div>
            </motion.div>

            {/* Certifications Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" />
                Allowed Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.certifications_list.map((cert, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Dashboard Variant */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Dashboard Variant</h3>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {profile.dashboard_variant}
              </p>
            </motion.div>

            {/* Dates */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 rounded-xl border border-gray-200 p-6"
            >
              <div className="space-y-3 text-xs text-gray-600">
                <div>
                  <p>Created:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p>Last Updated:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
