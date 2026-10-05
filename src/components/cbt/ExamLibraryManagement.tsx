import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderPlus,
  Globe2,
  Link2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Unlink,
  X,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
type Status = 'draft' | 'published' | 'scheduled' | 'archived'
type Country = { id: number; name: string; code: string; slug: string; status: Status; is_visible?: boolean; sort_order: number; available_from?: string | null; available_until?: string | null }
type Folder = { id: number; country?: number | null; country_tags?: number[]; country_tag_details?: Country[]; parent: number | null; name: string; slug: string; description: string; status: Status; is_visible?: boolean; sort_order: number; available_from?: string | null; available_until?: string | null; exam_count?: number; subject_count?: number; child_count?: number }
type Subject = { id: number; exam: number; name: string; description?: string; question_count?: number }
type Exam = { id: number; title: string; slug: string; folder: number | null; description: string; time_limit_minutes: number; year: string; difficulty: string; institution: string; status: Status; is_visible?: boolean; provider?: string; exam_type?: string; available_from?: string | null; available_until?: string | null; question_count?: number; subject_count?: number; subjects?: Subject[] }
type FolderContent = {
  exam_links: Array<{ id: number; exam: Exam; sort_order: number }>
  subject_links: Array<{ id: number; subject: Subject; exam: Exam; sort_order: number }>
}

const emptyCountry = { name: '', code: '', slug: '', status: 'published' as Status, available_from: '', available_until: '' }
const emptyFolder = { parent: '', country_tags: [] as string[], name: '', slug: '', description: '', status: 'published' as Status, available_from: '', available_until: '' }
const emptyContent: FolderContent = { exam_links: [], subject_links: [] }

function listData(data: any) { return Array.isArray(data) ? data : (data?.results || []) }
function formatError(error: any, fallback: string) {
  const data = error.response?.data
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') {
    return Object.entries(data).map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`).join(' ')
  }
  return fallback
}
function tagNames(folder: Folder) {
  return folder.country_tag_details?.map(tag => tag.name).join(', ') || 'No country tags'
}

export default function ExamLibraryManagement({ onManageExam }: { onManageExam?: (exam: Exam) => void }) {
  const [countries, setCountries] = useState<Country[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [countryForm, setCountryForm] = useState<any>(emptyCountry)
  const [folderForm, setFolderForm] = useState<any>(emptyFolder)
  const [editing, setEditing] = useState<{ type: 'country' | 'folder'; id: number } | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [folderContent, setFolderContent] = useState<FolderContent>(emptyContent)
  const [contentSearch, setContentSearch] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewExam, setPreviewExam] = useState<Exam | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('access')}` })
  const selectedFolder = folders.find(folder => folder.id === selectedFolderId) || null
  const linkedExamIds = useMemo(() => new Set(folderContent.exam_links.map(link => link.exam.id)), [folderContent.exam_links])
  const linkedSubjectIds = useMemo(() => new Set(folderContent.subject_links.map(link => link.subject.id)), [folderContent.subject_links])

  const filteredExams = useMemo(() => {
    const search = contentSearch.trim().toLowerCase()
    if (!search) return exams
    return exams.filter(exam => [
      exam.title,
      exam.description,
      exam.institution,
      exam.provider,
      exam.exam_type,
      exam.year,
      ...(exam.subjects || []).map(subject => subject.name),
    ].some(value => String(value || '').toLowerCase().includes(search)))
  }, [contentSearch, exams])

  const load = async () => {
    setLoading(true)
    try {
      const [countryRes, folderRes, examRes] = await Promise.all([
        axios.get(`${API_BASE}/cbt/countries/?page_size=100`, { headers: headers() }),
        axios.get(`${API_BASE}/cbt/folders/?page_size=100`, { headers: headers() }),
        axios.get(`${API_BASE}/cbt/exams/?page_size=100`, { headers: headers() }),
      ])
      const nextFolders = listData(folderRes.data)
      setCountries(listData(countryRes.data))
      setFolders(nextFolders)
      setExams(listData(examRes.data))
      if (!selectedFolderId && nextFolders.length) setSelectedFolderId(nextFolders[0].id)
    } catch (error: any) {
      setMessage(formatError(error, 'Unable to load the exam library.'))
    } finally {
      setLoading(false)
    }
  }

  const loadFolderContent = async (folderId: number | null) => {
    if (!folderId) {
      setFolderContent(emptyContent)
      return
    }
    setContentLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/cbt/folders/${folderId}/contents/`, { headers: headers() })
      setFolderContent({ exam_links: response.data?.exam_links || [], subject_links: response.data?.subject_links || [] })
    } catch (error: any) {
      setMessage(formatError(error, 'Unable to load folder contents.'))
      setFolderContent(emptyContent)
    } finally {
      setContentLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadFolderContent(selectedFolderId) }, [selectedFolderId])

  const resetForms = () => {
    setCountryForm(emptyCountry)
    setFolderForm(emptyFolder)
    setEditing(null)
  }

  const saveCountry = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    try {
      const payload = { ...countryForm, available_from: countryForm.available_from || null, available_until: countryForm.available_until || null }
      if (editing?.type === 'country') await axios.patch(`${API_BASE}/cbt/countries/${editing.id}/`, payload, { headers: headers() })
      else await axios.post(`${API_BASE}/cbt/countries/`, payload, { headers: headers() })
      setMessage('Country tag saved.')
      resetForms()
      await load()
    } catch (error: any) {
      setMessage(formatError(error, 'The country tag could not be saved.'))
    }
  }

  const saveFolder = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    try {
      const countryTags = folderForm.country_tags.map((id: string) => Number(id))
      const payload = {
        parent: folderForm.parent ? Number(folderForm.parent) : null,
        country: countryTags[0] || null,
        country_tags: countryTags,
        name: folderForm.name,
        slug: folderForm.slug,
        description: folderForm.description,
        status: folderForm.status,
        is_visible: folderForm.status !== 'draft' && folderForm.status !== 'archived',
        available_from: folderForm.available_from || null,
        available_until: folderForm.available_until || null,
      }
      const response = editing?.type === 'folder'
        ? await axios.patch(`${API_BASE}/cbt/folders/${editing.id}/`, payload, { headers: headers() })
        : await axios.post(`${API_BASE}/cbt/folders/`, payload, { headers: headers() })
      setMessage('Folder saved. Select it below to attach exams or subjects.')
      setSelectedFolderId(response.data?.id || selectedFolderId)
      resetForms()
      await load()
    } catch (error: any) {
      setMessage(formatError(error, 'The folder could not be saved.'))
    }
  }

  const editCountry = (country: Country) => {
    setEditing({ type: 'country', id: country.id })
    setCountryForm({ name: country.name, code: country.code, slug: country.slug, status: country.status, available_from: country.available_from?.slice(0, 16) || '', available_until: country.available_until?.slice(0, 16) || '' })
  }

  const editFolder = (folder: Folder) => {
    setEditing({ type: 'folder', id: folder.id })
    setSelectedFolderId(folder.id)
    setFolderForm({
      parent: folder.parent ? String(folder.parent) : '',
      country_tags: (folder.country_tags || []).map(String),
      name: folder.name,
      slug: folder.slug,
      description: folder.description,
      status: folder.status,
      available_from: folder.available_from?.slice(0, 16) || '',
      available_until: folder.available_until?.slice(0, 16) || '',
    })
  }

  const toggleFolderTag = (countryId: number) => {
    const value = String(countryId)
    setFolderForm((previous: any) => ({
      ...previous,
      country_tags: previous.country_tags.includes(value)
        ? previous.country_tags.filter((id: string) => id !== value)
        : [...previous.country_tags, value],
    }))
  }

  const folderAction = async (action: 'publish' | 'unpublish' | 'archive' | 'unarchive', folder: Folder) => {
    await axios.post(`${API_BASE}/cbt/folders/${folder.id}/${action}/`, {}, { headers: headers() })
    setMessage(`Folder ${action}d.`)
    await load()
    await loadFolderContent(folder.id)
  }

  const deleteFolder = async (folder: Folder) => {
    if (!window.confirm(`Delete "${folder.name}"? This removes only the folder container and links. Exams and subjects remain in the system.`)) return
    await axios.delete(`${API_BASE}/cbt/folders/${folder.id}/`, { headers: headers() })
    setMessage('Folder deleted. Attached exams and subjects were kept in the system.')
    if (selectedFolderId === folder.id) setSelectedFolderId(null)
    await load()
  }

  const archiveCountry = async (country: Country) => {
    await axios.patch(`${API_BASE}/cbt/countries/${country.id}/`, { status: 'archived', is_visible: false }, { headers: headers() })
    setMessage('Country tag archived.')
    await load()
  }

  const attach = async (type: 'exam' | 'subject', id: number) => {
    if (!selectedFolderId) return
    await axios.post(`${API_BASE}/cbt/folders/${selectedFolderId}/attach_${type}/`, { [`${type}_id`]: id }, { headers: headers() })
    setMessage(type === 'exam' ? 'Exam attached to folder.' : 'Subject attached to folder.')
    await load()
    await loadFolderContent(selectedFolderId)
  }

  const detach = async (type: 'exam' | 'subject', id: number) => {
    if (!selectedFolderId) return
    await axios.post(`${API_BASE}/cbt/folders/${selectedFolderId}/detach_${type}/`, { [`${type}_id`]: id }, { headers: headers() })
    setMessage(type === 'exam' ? 'Exam removed from folder. The exam still exists.' : 'Subject removed from folder. The subject still exists.')
    await load()
    await loadFolderContent(selectedFolderId)
  }

  const openPreview = async (exam?: Exam) => {
    setPreviewOpen(true)
    setPreviewExam(null)
    if (!exam) return
    setPreviewLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/cbt/exams/${exam.id}/preview/`, { headers: headers() })
      setPreviewExam(response.data)
    } catch {
      setPreviewExam(exam)
    } finally {
      setPreviewLoading(false)
    }
  }

  const statusClass = (status: Status) => {
    if (status === 'published') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (status === 'archived') return 'bg-gray-100 text-gray-600 border-gray-200'
    if (status === 'scheduled') return 'bg-blue-50 text-blue-700 border-blue-200'
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Exam Library</h2>
        <p className="text-sm text-gray-500">Create discovery folders, tag them by country, then attach existing exams or subjects.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={resetForms} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg"><Plus className="w-4 h-4" /> New setup</button>
        <button onClick={() => openPreview()} className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg"><Eye className="w-4 h-4" /> Preview library</button>
      </div>
    </div>

    {message && <div className="p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">{message}</div>}

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <WorkflowStep number="1" title="Country tags" text="Create reusable tags students can search by." />
      <WorkflowStep number="2" title="Folders" text="Create containers and publish, archive, or delete them safely." />
      <WorkflowStep number="3" title="Attach content" text="Use existing exams and subjects. Payments stay unchanged." />
    </div>

    {loading ? <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Loading exam library...</div> : (
      <div className="grid grid-cols-1 2xl:grid-cols-[0.85fr_1.15fr] gap-6">
        <section className="space-y-5">
          <form onSubmit={saveCountry} className="bg-white border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2"><Globe2 className="w-4 h-4 text-yellow-600" /><h3 className="font-semibold">{editing?.type === 'country' ? 'Edit country tag' : 'Add country tag'}</h3></div>
            <input required placeholder="Country name" value={countryForm.name} onChange={event => setCountryForm({ ...countryForm, name: event.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Code" value={countryForm.code} onChange={event => setCountryForm({ ...countryForm, code: event.target.value.toUpperCase() })} className="border rounded-lg px-3 py-2" /><input required placeholder="Slug" value={countryForm.slug} onChange={event => setCountryForm({ ...countryForm, slug: event.target.value })} className="border rounded-lg px-3 py-2" /></div>
            <select value={countryForm.status} onChange={event => setCountryForm({ ...countryForm, status: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select>
            <DateFields value={countryForm} onChange={setCountryForm} />
            <FormActions onCancel={resetForms} />
          </form>

          <form onSubmit={saveFolder} className="bg-white border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2"><FolderPlus className="w-4 h-4 text-yellow-600" /><h3 className="font-semibold">{editing?.type === 'folder' ? 'Edit folder' : 'Add folder'}</h3></div>
            <input required placeholder="Folder name, e.g. Assessment" value={folderForm.name} onChange={event => setFolderForm({ ...folderForm, name: event.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input required placeholder="Slug, e.g. assessment" value={folderForm.slug} onChange={event => setFolderForm({ ...folderForm, slug: event.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <textarea placeholder="Short student-facing description" value={folderForm.description} onChange={event => setFolderForm({ ...folderForm, description: event.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
            <select value={folderForm.parent} onChange={event => setFolderForm({ ...folderForm, parent: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Root folder</option>{folders.filter(folder => String(folder.id) !== String(editing?.id)).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Country tags</p>
              <div className="flex flex-wrap gap-2">
                {countries.map(country => <button key={country.id} type="button" onClick={() => toggleFolderTag(country.id)} className={`rounded-full border px-3 py-1 text-sm ${folderForm.country_tags.includes(String(country.id)) ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : 'border-gray-200 text-gray-600'}`}>{country.name}</button>)}
                {!countries.length && <span className="text-sm text-gray-500">Create a country tag first if you want country search.</span>}
              </div>
            </div>
            <select value={folderForm.status} onChange={event => setFolderForm({ ...folderForm, status: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select>
            <DateFields value={folderForm} onChange={setFolderForm} />
            <FormActions onCancel={resetForms} />
          </form>

          <section className="bg-white border rounded-xl p-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Country tags</h3><span className="text-xs text-gray-500">{countries.length} tags</span></div>
            <div className="space-y-2">
              {countries.map(country => <div key={country.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-3">
                <Globe2 className="h-4 w-4 text-yellow-600" />
                <span className="flex-1 font-medium">{country.name}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(country.status)}`}>{country.status}</span>
                <button onClick={() => editCountry(country)} title="Edit country tag"><Pencil className="h-4 w-4 text-gray-500" /></button>
                <button onClick={() => archiveCountry(country)} title="Archive country tag"><Archive className="h-4 w-4 text-gray-500" /></button>
              </div>)}
              {!countries.length && <p className="text-sm text-gray-500">No country tags yet.</p>}
            </div>
          </section>
        </section>

        <section className="space-y-5">
          <section className="bg-white border rounded-xl p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-semibold">Folders</h3><p className="text-sm text-gray-500">Select a folder to manage what appears inside it.</p></div>
              <span className="text-xs text-gray-500">{folders.length} folders</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {folders.map(folder => <button key={folder.id} type="button" onClick={() => setSelectedFolderId(folder.id)} className={`text-left rounded-xl border p-4 transition ${selectedFolderId === folder.id ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div><h4 className="font-semibold text-gray-900">{folder.name}</h4><p className="text-xs text-gray-500">{tagNames(folder)}</p></div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(folder.status)}`}>{folder.status}</span>
                </div>
                <p className="min-h-[2.5rem] text-sm text-gray-600 line-clamp-2">{folder.description || 'No description yet.'}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{folder.exam_count || 0} exams</span><span>{folder.subject_count || 0} subjects</span><span>{folder.child_count || 0} subfolders</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <IconButton onClick={(event) => { event.stopPropagation(); editFolder(folder) }} title="Edit"><Pencil className="h-4 w-4" /></IconButton>
                  {folder.status === 'published'
                    ? <IconButton onClick={(event) => { event.stopPropagation(); folderAction('unpublish', folder) }} title="Unpublish"><EyeOff className="h-4 w-4" /></IconButton>
                    : <IconButton onClick={(event) => { event.stopPropagation(); folderAction('publish', folder) }} title="Publish"><CheckCircle2 className="h-4 w-4" /></IconButton>}
                  {folder.status === 'archived'
                    ? <IconButton onClick={(event) => { event.stopPropagation(); folderAction('unarchive', folder) }} title="Unarchive"><RotateCcw className="h-4 w-4" /></IconButton>
                    : <IconButton onClick={(event) => { event.stopPropagation(); folderAction('archive', folder) }} title="Archive folder only"><Archive className="h-4 w-4" /></IconButton>}
                  <IconButton onClick={(event) => { event.stopPropagation(); deleteFolder(folder) }} title="Delete folder only"><Trash2 className="h-4 w-4 text-red-600" /></IconButton>
                </div>
              </button>)}
              {!folders.length && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No folders yet. Create one on the left, then attach existing exams here.</div>}
            </div>
          </section>

          <section className="bg-white border rounded-xl p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold">Folder builder</h3>
                <p className="text-sm text-gray-500">{selectedFolder ? `Attaching content to ${selectedFolder.name}` : 'Select a folder above to attach exams or subjects.'}</p>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={contentSearch} onChange={event => setContentSearch(event.target.value)} placeholder="Search existing exams or subjects" className="w-full rounded-lg border px-9 py-2 text-sm" />
              </div>
            </div>
            {!selectedFolder ? <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">Choose a folder to start attaching exams and subjects.</div> : (
              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-xl border p-4">
                  <h4 className="mb-3 font-semibold">Currently in this folder</h4>
                  {contentLoading ? <p className="text-sm text-gray-500">Loading folder contents...</p> : <div className="space-y-3">
                    {folderContent.exam_links.map(link => <div key={`exam-${link.id}`} className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                      <BookOpen className="h-4 w-4 text-yellow-600" /><span className="flex-1 text-sm font-medium">{link.exam.title}</span>
                      <button onClick={() => detach('exam', link.exam.id)} title="Detach exam"><Unlink className="h-4 w-4 text-gray-500" /></button>
                    </div>)}
                    {folderContent.subject_links.map(link => <div key={`subject-${link.id}`} className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                      <span className="rounded bg-white px-2 py-1 text-xs text-gray-500">{link.exam.title}</span><span className="flex-1 text-sm font-medium">{link.subject.name}</span>
                      <button onClick={() => detach('subject', link.subject.id)} title="Detach subject"><Unlink className="h-4 w-4 text-gray-500" /></button>
                    </div>)}
                    {!folderContent.exam_links.length && !folderContent.subject_links.length && <p className="text-sm text-gray-500">Nothing attached yet.</p>}
                  </div>}
                </div>

                <div className="max-h-[720px] overflow-y-auto rounded-xl border p-4">
                  <h4 className="mb-3 font-semibold">Existing exams in the system</h4>
                  <div className="space-y-4">
                    {filteredExams.map(exam => <div key={exam.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900">{exam.title}</h5>
                          <p className="text-sm text-gray-500">{exam.subject_count || exam.subjects?.length || 0} subjects • {exam.question_count || 0} questions {exam.year ? `• ${exam.year}` : ''}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button disabled={linkedExamIds.has(exam.id)} onClick={() => attach('exam', exam.id)} className="inline-flex items-center gap-1 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300"><Link2 className="h-4 w-4" /> {linkedExamIds.has(exam.id) ? 'Attached' : 'Add exam'}</button>
                          {onManageExam && <button onClick={() => onManageExam(exam)} className="rounded-lg border px-3 py-2 text-sm">Manage subjects</button>}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(exam.subjects || []).map(subject => <div key={subject.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
                          <span className="flex-1 text-sm">{subject.name}</span>
                          <button disabled={linkedExamIds.has(exam.id) || linkedSubjectIds.has(subject.id)} onClick={() => attach('subject', subject.id)} className="rounded-md border bg-white px-2 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40">{linkedSubjectIds.has(subject.id) ? 'Added' : 'Add subject'}</button>
                        </div>)}
                        {!exam.subjects?.length && <p className="text-sm text-gray-500">No subjects under this exam yet.</p>}
                      </div>
                    </div>)}
                    {!filteredExams.length && <p className="text-sm text-gray-500">No exams match this search.</p>}
                  </div>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    )}

    <ExamPreviewModal open={previewOpen} exam={previewExam} loading={previewLoading} countries={countries} folders={folders} exams={exams} onClose={() => setPreviewOpen(false)} onSelectExam={openPreview} onBack={() => setPreviewExam(null)} />
  </div>
}

function WorkflowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="rounded-xl border bg-white p-4"><div className="mb-2 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700">{number}</span><h3 className="font-semibold text-gray-900">{title}</h3></div><p className="text-sm text-gray-500">{text}</p></div>
}

function IconButton({ children, onClick, title }: { children: React.ReactNode; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; title: string }) {
  return <button type="button" onClick={onClick} title={title} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:border-yellow-400 hover:text-yellow-700">{children}</button>
}

function FormActions({ onCancel }: { onCancel: () => void }) { return <div className="flex gap-2 pt-2"><button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg"><Save className="w-4 h-4" /> Save</button><button type="button" onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"><X className="w-4 h-4" /> Cancel</button></div> }

function DateFields({ value, onChange }: { value: { available_from: string; available_until: string }; onChange: (next: any) => void }) {
  return <div className="grid grid-cols-2 gap-3"><label className="text-xs text-gray-500">Available from<input type="datetime-local" value={value.available_from || ''} onChange={event => onChange({ ...value, available_from: event.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></label><label className="text-xs text-gray-500">Available until<input type="datetime-local" value={value.available_until || ''} onChange={event => onChange({ ...value, available_until: event.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></label></div>
}

function ExamPreviewModal({
  open,
  exam,
  loading,
  countries,
  folders,
  exams,
  onClose,
  onSelectExam,
  onBack,
}: {
  open: boolean
  exam: Exam | null
  loading: boolean
  countries: Country[]
  folders: Folder[]
  exams: Exam[]
  onClose: () => void
  onSelectExam: (exam: Exam) => void
  onBack: () => void
}) {
  if (!open) return null

  const publishedCountries = countries.filter(country => country.status === 'published' && country.is_visible !== false)

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Student library preview" onClick={onClose}>
    <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl bg-slate-900 text-white shadow-2xl" onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Student preview</p>
          <h3 className="text-xl font-bold">{exam ? exam.title : 'Exam Library'}</h3>
          <p className="text-sm text-slate-400">This preview stays inside the master admin dashboard.</p>
        </div>
        <button onClick={onClose} title="Close preview" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">
        {loading ? <div className="py-16 text-center text-slate-400">Loading preview...</div> : exam ? <div className="space-y-6">
          <button onClick={onBack} className="text-sm text-yellow-400 hover:text-yellow-300">Back to library</button>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><h4 className="text-2xl font-bold">{exam.title}</h4><p className="mt-2 text-slate-300">{exam.description || `Practice ${exam.title}`}</p></div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">{exam.status}</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-300 sm:grid-cols-4">
              <div><span className="block text-xs text-slate-500">Duration</span>{exam.time_limit_minutes} mins</div>
              <div><span className="block text-xs text-slate-500">Questions</span>{exam.question_count || 0}</div>
              <div><span className="block text-xs text-slate-500">Year</span>{exam.year || 'Not set'}</div>
              <div><span className="block text-xs text-slate-500">Difficulty</span>{exam.difficulty || 'Not set'}</div>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-lg font-semibold">Subjects</h4>
            {exam.subjects?.length ? <div className="grid gap-3 sm:grid-cols-2">{exam.subjects.map(subject => <div key={subject.id} className="rounded-lg border border-slate-700 bg-slate-800/70 p-4"><div className="font-medium">{subject.name}</div><div className="mt-1 text-sm text-slate-400">{subject.question_count || 0} questions</div></div>)}</div> : <p className="text-sm text-slate-400">No subjects have been added yet.</p>}
          </div>
        </div> : <div className="space-y-6">
          {publishedCountries.map(country => {
            const countryFolders = folders.filter(folder => (folder.country_tags || []).includes(country.id) && folder.status === 'published' && folder.is_visible !== false)
            return <section key={country.id}>
              <div className="mb-3 flex items-center gap-2"><Globe2 className="h-5 w-5 text-yellow-400" /><h4 className="text-lg font-semibold">{country.name}</h4></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {countryFolders.map(folder => {
                  const folderExams = exams.filter(item => item.status === 'published' && item.is_visible !== false)
                  return <div key={folder.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                    <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-yellow-400" /><span className="font-medium">{folder.name}</span></div>
                    <div className="mt-3 space-y-2">{folderExams.length ? folderExams.slice(0, 5).map(item => <button key={item.id} onClick={() => onSelectExam(item)} className="flex w-full items-center justify-between rounded-md bg-slate-700/70 px-3 py-2 text-left text-sm hover:bg-slate-700"><span>{item.title}</span><Eye className="h-4 w-4 text-slate-400" /></button>) : <p className="text-sm text-slate-500">No published exams</p>}</div>
                  </div>
                })}
              </div>
            </section>
          })}
          {!publishedCountries.length && <p className="py-12 text-center text-slate-400">No published content is available in the student preview.</p>}
        </div>}
      </div>
    </div>
  </div>
}
