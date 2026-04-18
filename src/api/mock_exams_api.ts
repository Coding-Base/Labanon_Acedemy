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
    // Validate required fields
    if (!data.title || !data.title.trim()) {
      throw new Error('Exam title is required');
    }
    if (!data.subject_area || !data.subject_area.trim()) {
      throw new Error('Subject area is required');
    }
    if (!data.total_duration_minutes || data.total_duration_minutes <= 0) {
      throw new Error('Duration must be greater than 0 minutes');
    }
    if (!data.total_marks || data.total_marks <= 0) {
      throw new Error('Total marks must be greater than 0');
    }
    if (!data.passing_marks || data.passing_marks < 0) {
      throw new Error('Passing marks cannot be negative');
    }

    try {
      const response = await api.post(`/mock-exams/admin/exams/`, {
        title: data.title.trim(),
        description: data.description ? data.description.trim() : '',
        subject_area: data.subject_area.trim(),
        difficulty_level: data.difficulty_level || 'mixed',
        total_duration_minutes: parseInt(data.total_duration_minutes, 10),
        total_marks: parseInt(data.total_marks, 10),
        passing_marks: parseInt(data.passing_marks, 10),
        status: data.status || 'draft',
      });
      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to create exam: ${errorMessage}`);
      }
      throw error;
    }
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
    try {
      const updateData: any = {};
      if (data.title && data.title.trim()) {
        updateData.title = data.title.trim();
      }
      if (data.description) {
        updateData.description = data.description.trim();
      }
      if (data.subject_area && data.subject_area.trim()) {
        updateData.subject_area = data.subject_area.trim();
      }
      if (data.difficulty_level) {
        updateData.difficulty_level = data.difficulty_level;
      }
      if (data.total_duration_minutes && data.total_duration_minutes > 0) {
        updateData.total_duration_minutes = parseInt(data.total_duration_minutes, 10);
      }
      if (data.total_marks && data.total_marks > 0) {
        updateData.total_marks = parseInt(data.total_marks, 10);
      }
      if (data.passing_marks !== undefined && data.passing_marks >= 0) {
        updateData.passing_marks = parseInt(data.passing_marks, 10);
      }
      if (data.status) {
        updateData.status = data.status;
      }

      const response = await api.put(`/mock-exams/admin/exams/${examId}/`, updateData);
      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to update exam: ${errorMessage}`);
      }
      throw error;
    }
  },

  deleteMockExam: async (examId: number) => {
    return api.delete(`/mock-exams/admin/exams/${examId}/`);
  },

  publishMockExam: async (examId: number) => {
    try {
      const response = await api.post(`/mock-exams/admin/exams/${examId}/publish/`, {});
      return response;
    } catch (error: any) {
      // Provide detailed error messages
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        // Handle the specific "No questions found!" error
        if (errorData.detail && errorData.detail.includes('questions')) {
          throw new Error(`Cannot publish exam: ${errorData.detail}. Please add questions to all subjects before publishing.`);
        }
        
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        throw new Error(`Failed to publish exam: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      } else if (error.response?.status === 404) {
        throw new Error('Exam not found');
      }
      
      throw error;
    }
  },

  archiveMockExam: async (examId: number) => {
    return api.post(`/mock-exams/admin/exams/${examId}/archive/`, {});
  },

  getActivityOverview: async () => {
    return api.get(`/mock-exams/admin/exams/activity_overview/`);
  },

  // Subject Management
  addSubject: async (examId: number, data: any) => {
    // Validate required fields
    if (!data.subject_name || !data.subject_name.trim()) {
      throw new Error('Subject name is required');
    }
    if (!data.num_questions || data.num_questions <= 0) {
      throw new Error('Number of questions must be greater than 0');
    }

    try {
      const response = await api.post(`/mock-exams/admin/subjects/`, {
        mock_exam: examId,
        subject_name: data.subject_name.trim(),
        description: data.description ? data.description.trim() : '',
        num_questions: parseInt(data.num_questions, 10),
        time_allocation_minutes: data.time_allocation_minutes || 0,
        marks_per_question: data.marks_per_question || 0,
        order: data.order || 0,
      });
      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to add subject: ${errorMessage}`);
      }
      throw error;
    }
  },

  getSubjects: async (examId: number) => {
    return api.get(`/mock-exams/admin/subjects/?mock_exam=${examId}`);
  },

  updateSubject: async (subjectId: number, data: any) => {
    try {
      const updateData: any = {};
      if (data.subject_name && data.subject_name.trim()) {
        updateData.subject_name = data.subject_name.trim();
      }
      if (data.description !== undefined) {
        updateData.description = data.description ? data.description.trim() : '';
      }
      if (data.num_questions && data.num_questions > 0) {
        updateData.num_questions = parseInt(data.num_questions, 10);
      }
      if (data.time_allocation_minutes !== undefined) {
        updateData.time_allocation_minutes = parseInt(data.time_allocation_minutes, 10);
      }
      if (data.marks_per_question !== undefined) {
        updateData.marks_per_question = parseInt(data.marks_per_question, 10);
      }
      if (data.order !== undefined) {
        updateData.order = parseInt(data.order, 10);
      }

      const response = await api.put(`/mock-exams/admin/subjects/${subjectId}/`, updateData);
      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to update subject: ${errorMessage}`);
      }
      throw error;
    }
  },

  deleteSubject: async (subjectId: number) => {
    return api.delete(`/mock-exams/admin/subjects/${subjectId}/`);
  },

  // Question Management
  addQuestion: async (subjectId: number, data: any) => {
    // Check if data is FormData (from MasterAdminMockPanel) or regular object
    let questionText = '';
    let questionType = '';
    let marks: any = '';
    let difficulty = '';
    let formDataToSend: FormData;

    if (data instanceof FormData) {
      // Extract values from FormData for validation
      questionText = data.get('question_text') as string;
      questionType = data.get('question_type') as string;
      marks = data.get('marks') as string;
      difficulty = data.get('difficulty') as string;
      formDataToSend = data;
    } else {
      // Regular object - validate and build FormData
      questionText = data.question_text;
      questionType = data.question_type;
      marks = data.marks;
      difficulty = data.difficulty;

      // Validate required fields before building FormData
      if (!questionText || !questionText.trim()) {
        throw new Error('Question text is required');
      }
      if (!questionType) {
        throw new Error('Question type is required');
      }
      if (!marks || marks <= 0) {
        throw new Error('Marks must be greater than 0');
      }
      if (!difficulty) {
        throw new Error('Difficulty level is required');
      }

      // Create FormData for file uploads
      formDataToSend = new FormData();
      formDataToSend.append('subject', subjectId.toString());
      formDataToSend.append('question_text', questionText.trim());
      formDataToSend.append('question_type', questionType);
      formDataToSend.append('marks', parseInt(marks, 10).toString());
      formDataToSend.append('difficulty', difficulty);
      
      if (data.explanation && data.explanation.trim()) {
        formDataToSend.append('explanation', data.explanation.trim());
      }
      
      if (data.question_image_file && data.question_image_file instanceof File) {
        formDataToSend.append('question_image_file', data.question_image_file);
      }
      if (data.explanation_image_file && data.explanation_image_file instanceof File) {
        formDataToSend.append('explanation_image_file', data.explanation_image_file);
      }
    }

    // Validate FormData content
    if (!questionText || !questionText.trim()) {
      throw new Error('Question text is required');
    }
    if (!questionType) {
      throw new Error('Question type is required');
    }
    if (!marks || parseInt(marks, 10) <= 0) {
      throw new Error('Marks must be greater than 0');
    }
    if (!difficulty) {
      throw new Error('Difficulty level is required');
    }

    // Ensure FormData has subject field
    if (!formDataToSend.has('subject')) {
      formDataToSend.append('subject', subjectId.toString());
    }
    
    try {
      const response = await api.post(`/mock-exams/admin/questions/`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error: any) {
      // Provide better error messages for debugging
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to add question: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      }
      throw error;
    }
  },

  getQuestions: async (subjectId: number) => {
    return api.get(`/mock-exams/admin/questions/?subject=${subjectId}`);
  },

  updateQuestion: async (questionId: number, data: any) => {
    // Check if data is FormData (from MasterAdminMockPanel) or regular object
    let formDataToSend: FormData;

    if (data instanceof FormData) {
      // Already FormData, use as-is
      formDataToSend = data;
    } else {
      // Regular object - build FormData
      formDataToSend = new FormData();
      
      // Add text fields only if they're provided and not empty
      if (data.question_text && data.question_text.trim()) {
        formDataToSend.append('question_text', data.question_text.trim());
      }
      if (data.question_type) {
        formDataToSend.append('question_type', data.question_type);
      }
      if (data.marks && data.marks > 0) {
        formDataToSend.append('marks', parseInt(data.marks, 10).toString());
      }
      if (data.difficulty) {
        formDataToSend.append('difficulty', data.difficulty);
      }
      if (data.explanation && data.explanation.trim()) {
        formDataToSend.append('explanation', data.explanation.trim());
      }
      
      // Add files only if they exist and are File objects
      if (data.question_image_file && data.question_image_file instanceof File) {
        formDataToSend.append('question_image_file', data.question_image_file);
      }
      if (data.explanation_image_file && data.explanation_image_file instanceof File) {
        formDataToSend.append('explanation_image_file', data.explanation_image_file);
      }
    }
    
    try {
      const response = await api.put(`/mock-exams/admin/questions/${questionId}/`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error: any) {
      // Provide better error messages for debugging
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to update question: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      }
      throw error;
    }
  },

  deleteQuestion: async (questionId: number) => {
    return api.delete(`/mock-exams/admin/questions/${questionId}/`);
  },

  // Option Management
  addOption: async (questionId: number, data: any) => {
    // Validate required fields
    if (!data.text || !data.text.trim()) {
      throw new Error('Option text is required');
    }
    if (data.is_correct === undefined || data.is_correct === null) {
      throw new Error('Please specify if this is the correct answer');
    }

    try {
      const response = await api.post(`/mock-exams/admin/options/`, {
        question: questionId,
        text: data.text.trim(),
        is_correct: Boolean(data.is_correct),
        order: data.order || 0,
      });
      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to add option: ${errorMessage}`);
      }
      throw error;
    }
  },

  updateOption: async (optionId: number, data: any) => {
    try {
      let updateData: any;

      if (data instanceof FormData) {
        // Already FormData, use it directly
        updateData = data;
      } else {
        // Regular object - convert to proper format
        updateData = {};
        if (data.text && data.text.trim()) {
          updateData.text = data.text.trim();
        } else if (data.option_text && data.option_text.trim()) {
          // Handle option_text field name
          updateData.text = data.option_text.trim();
        }
        if (data.is_correct !== undefined && data.is_correct !== null) {
          updateData.is_correct = Boolean(data.is_correct);
        }
        if (data.order !== undefined) {
          updateData.order = data.order;
        }
      }

      const response = await api.put(`/mock-exams/admin/options/${optionId}/`, updateData);
      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Backend validation error:', errorMessage);
        throw new Error(`Failed to update option: ${errorMessage}`);
      }
      throw error;
    }
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
