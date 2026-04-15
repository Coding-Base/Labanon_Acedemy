/**
 * Mock Exams API Service
 * Centralized API calls for all mock exams endpoints
 */

import api from '../utils/axiosInterceptor';

// ============ STUDENT ENDPOINTS ============

export const studentMockExamsAPI = {
  // Browse exams
  getMockExams: async (page = 1, search = '', filters = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      search,
      ...filters,
    });
    return api.get(`/mock-exams/student/exams/?${params}`);
  },

  getMockExamDetail: async (examId: number) => {
    return api.get(`/mock-exams/student/exams/${examId}/`);
  },

  // Unlock & Access
  checkUnlockStatus: async (examId: number) => {
    return api.post(`/mock-exams/student/exams/${examId}/check_unlock_status/`);
  },

  unlockMockExam: async (examId: number, paymentData: any) => {
    return api.post(`/mock-exams/student/exams/${examId}/unlock/`, paymentData);
  },

  // Attempt Management
  startMockExamAttempt: async (examId: number) => {
    return api.post(`/mock-exams/student/attempts/`, {
      mock_exam: examId,
    });
  },

  getAttemptDetail: async (attemptId: number) => {
    return api.get(`/mock-exams/student/attempts/${attemptId}/`);
  },

  submitMockExamAttempt: async (attemptId: number, answers: any, timeSpent: number) => {
    return api.post(`/mock-exams/student/attempts/${attemptId}/submit/`, {
      answers,
      time_spent: timeSpent,
    });
  },

  getAttemptResults: async (attemptId: number) => {
    return api.get(`/mock-exams/student/attempts/${attemptId}/results/`);
  },

  getStudentAttempts: async (page = 1) => {
    return api.get(`/mock-exams/student/attempts/?page=${page}`);
  },
};

// ============ ADMIN ENDPOINTS ============

export const adminMockExamsAPI = {
  // Exam Management
  createMockExam: async (data: any) => {
    return api.post(`/mock-exams/admin/exams/`, data);
  },

  getMockExams: async (page = 1, search = '', filters = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      search,
      ...filters,
    });
    return api.get(`/mock-exams/admin/exams/?${params}`);
  },

  getMockExamDetail: async (examId: number) => {
    return api.get(`/mock-exams/admin/exams/${examId}/`);
  },

  updateMockExam: async (examId: number, data: any) => {
    return api.put(`/mock-exams/admin/exams/${examId}/`, data);
  },

  deleteMockExam: async (examId: number) => {
    return api.delete(`/mock-exams/admin/exams/${examId}/`);
  },

  publishMockExam: async (examId: number) => {
    return api.post(`/mock-exams/admin/exams/${examId}/publish/`, {});
  },

  archiveMockExam: async (examId: number) => {
    return api.post(`/mock-exams/admin/exams/${examId}/archive/`, {});
  },

  getActivityOverview: async () => {
    return api.get(`/mock-exams/admin/exams/activity_overview/`);
  },

  // Subject Management
  addSubject: async (examId: number, data: any) => {
    return api.post(`/mock-exams/admin/subjects/`, {
      mock_exam: examId,
      ...data,
    });
  },

  getSubjects: async (examId: number) => {
    return api.get(`/mock-exams/admin/subjects/?mock_exam=${examId}`);
  },

  updateSubject: async (subjectId: number, data: any) => {
    return api.put(`/mock-exams/admin/subjects/${subjectId}/`, data);
  },

  deleteSubject: async (subjectId: number) => {
    return api.delete(`/mock-exams/admin/subjects/${subjectId}/`);
  },

  // Question Management
  addQuestion: async (subjectId: number, data: any) => {
    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add all fields to FormData
    formData.append('subject', subjectId.toString());
    formData.append('question_text', data.question_text);
    formData.append('question_type', data.question_type);
    formData.append('marks', data.marks.toString());
    formData.append('difficulty', data.difficulty);
    formData.append('explanation', data.explanation || '');
    
    // Add files only if they exist
    if (data.question_image_file) {
      formData.append('question_image_file', data.question_image_file);
    }
    if (data.explanation_image_file) {
      formData.append('explanation_image_file', data.explanation_image_file);
    }
    
    return api.post(`/mock-exams/admin/questions/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getQuestions: async (subjectId: number) => {
    return api.get(`/mock-exams/admin/questions/?subject=${subjectId}`);
  },

  updateQuestion: async (questionId: number, data: any) => {
    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add all text fields
    if (data.question_text) formData.append('question_text', data.question_text);
    if (data.question_type) formData.append('question_type', data.question_type);
    if (data.marks) formData.append('marks', data.marks.toString());
    if (data.difficulty) formData.append('difficulty', data.difficulty);
    if (data.explanation) formData.append('explanation', data.explanation);
    
    // Add files only if they exist
    if (data.question_image_file) {
      formData.append('question_image_file', data.question_image_file);
    }
    if (data.explanation_image_file) {
      formData.append('explanation_image_file', data.explanation_image_file);
    }
    
    return api.put(`/mock-exams/admin/questions/${questionId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteQuestion: async (questionId: number) => {
    return api.delete(`/mock-exams/admin/questions/${questionId}/`);
  },

  // Option Management
  addOption: async (questionId: number, data: any) => {
    return api.post(`/mock-exams/admin/options/`, {
      question: questionId,
      ...data,
    });
  },

  updateOption: async (optionId: number, data: any) => {
    return api.put(`/mock-exams/admin/options/${optionId}/`, data);
  },

  deleteOption: async (optionId: number) => {
    return api.delete(`/mock-exams/admin/options/${optionId}/`);
  },

  // Fee Management
  setMockExamFee: async (examId: number, feeData: any) => {
    return api.post(`/mock-exams/admin/fees/`, {
      mock_exam: examId,
      ...feeData,
    });
  },

  getMockExamFees: async () => {
    return api.get(`/mock-exams/admin/fees/`);
  },

  // Activity Logs
  getActivityLogs: async (page = 1, examId?: number) => {
    let url = `/mock-exams/admin/activity-logs/?page=${page}`;
    if (examId) url += `&exam=${examId}`;
    return api.get(url);
  },

  // Platform Configuration
  getPlatforms: async () => {
    return api.get(`/mock-exams/admin/platforms/`);
  },

  createPlatform: async (data: any) => {
    return api.post(`/mock-exams/admin/platforms/`, data);
  },

  updatePlatform: async (platformId: number, data: any) => {
    return api.put(`/mock-exams/admin/platforms/${platformId}/`, data);
  },

  testPlatformConnection: async (platformId: number) => {
    return api.post(`/mock-exams/admin/platforms/${platformId}/test_connection/`, {});
  },

  syncPlatformExams: async (platformId: number) => {
    return api.post(`/mock-exams/admin/platforms/${platformId}/sync_exams/`, {});
  },

  // Convenience methods for hierarchical data
  getExamWithStructure: async (examId: number) => {
    try {
      const examResponse = await api.get(`/mock-exams/admin/exams/${examId}/`);
      const exam = examResponse.data;

      // Get subjects for this exam
      const subjectsResponse = await api.get(`/mock-exams/admin/subjects/?mock_exam=${examId}`);
      const subjects = subjectsResponse.data.results || subjectsResponse.data || [];
      console.log('Fetched subjects:', subjects);

      // Get questions and options for each subject
      const enrichedSubjects = await Promise.all(
        subjects.map(async (subject: any) => {
          try {
            const questionsResponse = await api.get(`/mock-exams/admin/questions/?subject=${subject.id}`);
            const questions = questionsResponse.data.results || questionsResponse.data || [];
            console.log(`Fetched questions for subject ${subject.id}:`, questions);

            // Get options for each question
            const enrichedQuestions = await Promise.all(
              questions.map(async (question: any) => {
                try {
                  const optionsResponse = await api.get(`/mock-exams/admin/options/?question=${question.id}`);
                  const options = optionsResponse.data.results || optionsResponse.data || [];
                  return {
                    ...question,
                    options,
                  };
                } catch (err) {
                  console.log(`Failed to fetch options for question ${question.id}`, err);
                  return { ...question, options: [] };
                }
              })
            );

            return {
              ...subject,
              questions: enrichedQuestions,
            };
          } catch (err) {
            console.log(`Failed to fetch questions for subject ${subject.id}`, err);
            return { ...subject, questions: [] };
          }
        })
      );

      console.log('Final enriched structure:', { ...exam, subjects: enrichedSubjects });
      return {
        ...exam,
        subjects: enrichedSubjects,
      };
    } catch (error) {
      console.error('Error fetching exam with structure:', error);
      throw error;
    }
  },

  getOptions: async (questionId: number) => {
    return api.get(`/mock-exams/admin/options/?question=${questionId}`);
  },
};

// ============ DATA TYPES ============

export interface CustomMockExam {
  id: number;
  title: string;
  description: string;
  subject_area: string;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'mixed';
  total_duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: 'draft' | 'published' | 'archived';
  is_published: boolean;
  is_active: boolean;
  is_streaming: boolean;
  subjects: MockExamSubject[];
  fee?: MockExamFee;
  total_attempts: number;
  avg_score: number;
  created_at: string;
  updated_at: string;
}

export interface MockExamSubject {
  id: number;
  subject_name: string;
  description: string;
  num_questions: number;
  time_allocation_minutes: number;
  marks_per_question: number;
  order: number;
  questions: MockExamQuestion[];
}

export interface MockExamQuestion {
  id: number;
  question_text: string;
  question_type: 'MCQ' | 'TrueOrFalse' | 'Essay' | 'Matching' | 'Ordering';
  marks: number;
  difficulty: string;
  options: MockExamOption[];
  explanation?: string;
  question_image?: string;
}

export interface MockExamOption {
  id: number;
  text: string;
  is_correct: boolean;
  order: number;
}

export interface MockExamFee {
  id: number;
  fee_amount: number;
  currency: string;
  discount_percentage: number;
  promo_code?: string;
  created_at: string;
}

export interface MockExamAttempt {
  id: number;
  student: number;
  custom_mock_exam: number;
  status: 'in_progress' | 'submitted' | 'graded';
  answers: any[];
  time_spent: number;
  total_marks_obtained: number;
  grade: string;
  created_at: string;
  started_at: string;
  submitted_at?: string;
}

export interface MockExamResult {
  id: number;
  attempt: number;
  question: number;
  selected_option?: number;
  marks_obtained: number;
  is_correct: boolean;
  time_taken: number;
}

export interface ActivityOverviewData {
  total_exams: number;
  published_exams: number;
  draft_exams: number;
  total_students_attempted: number;
  average_completion_rate: number;
  average_score: number;
  most_attempted_exam: CustomMockExam;
  recent_activities: any[];
  attempts_over_time: any[];
  subject_wise_stats: any[];
}
