import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export interface Choice {
  id?: number
  text: string
  is_correct: boolean
}

export interface Question {
  id: number
  subject: number
  text: string
  image?: string
  choices: Choice[]
  year?: string
  explanation?: string
  created_at?: string
  updated_at?: string
}

export interface PaginatedQuestions {
  count: number
  next: string | null
  previous: string | null
  results: Question[]
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('access')
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
}

/**
 * Fetch paginated questions for a subject
 */
export async function fetchQuestionsForSubject(
  subjectId: number,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<PaginatedQuestions> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  })

  if (search) {
    params.append('search', search)
  }

  const response = await axios.get(
    `${API_BASE}/cbt/subjects/${subjectId}/questions/?${params.toString()}`,
    getAuthHeaders()
  )

  return response.data
}

/**
 * Fetch a single question with all its choices
 */
export async function fetchQuestion(questionId: number): Promise<Question> {
  const response = await axios.get(
    `${API_BASE}/cbt/questions/${questionId}/`,
    getAuthHeaders()
  )

  return response.data
}

/**
 * Update question text and explanation
 */
export async function updateQuestionInfo(
  questionId: number,
  data: {
    text?: string
    explanation?: string
    year?: string
  }
): Promise<Question> {
  const response = await axios.patch(
    `${API_BASE}/cbt/questions/${questionId}/`,
    data,
    getAuthHeaders()
  )

  return response.data
}

/**
 * Update question text and explanation, and bulk update all choices
 */
export async function updateQuestionAndChoices(
  questionId: number,
  data: {
    text?: string
    explanation?: string
    year?: string
    choices: Choice[]
  }
): Promise<Question> {
  // First update the question info (text, explanation, and year)
  // Always send the update request to ensure fields are persisted
  const updateData: any = {}
  if (data.text !== undefined) updateData.text = data.text
  if (data.explanation !== undefined) updateData.explanation = data.explanation
  if (data.year !== undefined) updateData.year = data.year

  let updatedQuestion: Question | null = null

  if (Object.keys(updateData).length > 0) {
    updatedQuestion = await updateQuestionInfo(questionId, updateData)
  }

  // Then update choices
  const payload = {
    choices: data.choices.map(c => ({
      text: c.text,
      is_correct: c.is_correct
    }))
  }

  const response = await axios.post(
    `${API_BASE}/cbt/questions/${questionId}/update_choices/`,
    payload,
    getAuthHeaders()
  )

  // Return the updated question with all changes (merge both updates)
  return {
    ...response.data,
    ...updatedQuestion,
    choices: response.data.choices || updatedQuestion?.choices
  }
}

/**
 * Update question basic info (text, image, explanation, year)
 */
export async function updateQuestion(
  questionId: number,
  data: FormData | Record<string, any>
): Promise<Question> {
  const config = getAuthHeaders()

  const response = await axios.put(
    `${API_BASE}/cbt/questions/${questionId}/`,
    data,
    config
  )

  return response.data
}

/**
 * Upload image for a question
 */
export async function uploadQuestionImage(
  questionId: number,
  file: File
): Promise<{ image: string }> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await axios.patch(
    `${API_BASE}/cbt/questions/${questionId}/`,
    formData,
    getAuthHeaders()
  )

  return response.data
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: number): Promise<void> {
  await axios.delete(
    `${API_BASE}/cbt/questions/${questionId}/`,
    getAuthHeaders()
  )
}

/**
 * Bulk delete questions
 */
export async function deleteQuestionsInBulk(questionIds: number[]): Promise<void> {
  // Make parallel delete requests
  const promises = questionIds.map(id => deleteQuestion(id))
  await Promise.all(promises)
}
