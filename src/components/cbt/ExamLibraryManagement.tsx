import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Archive, BookOpen, ChevronDown, ChevronRight, Eye, FolderPlus, Globe2, Pencil, Plus, Save, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
type Status = 'draft' | 'published' | 'scheduled' | 'archived'
type Country = { id: number; name: string; code: string; slug: string; status: Status; is_visible?: boolean; sort_order: number; available_from?: string | null; available_until?: string | null }
type Folder = { id: number; country: number; parent: number | null; name: string; slug: string; description: string; status: Status; is_visible?: boolean; sort_order: number; available_from?: string | null; available_until?: string | null }
type Exam = { id: number; title: string; slug: string; folder: number | null; description: string; time_limit_minutes: number; year: string; difficulty: string; institution: string; status: Status; is_visible?: boolean; provider?: string; exam_type?: string; available_from?: string | null; available_until?: string | null; question_count?: number; subject_count?: number; subjects?: Array<{ id: number; name: string; question_count?: number }> }

const emptyCountry = { name: '', code: '', slug: '', status: 'published' as Status, available_from: '', available_until: '' }
const emptyFolder = { country: '', parent: '', name: '', slug: '', description: '', status: 'published' as Status, available_from: '', available_until: '' }
const emptyExam = { title: '', slug: '', folder: '', description: '', time_limit_minutes: 120, year: '', difficulty: '', institution: '', status: 'draft' as Status, available_from: '', available_until: '' }

function listData(data: any) { return Array.isArray(data) ? data : (data?.results || []) }

export default function ExamLibraryManagement({ onManageExam }: { onManageExam?: (exam: Exam) => void }) {
  const [countries, setCountries] = useState<Country[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [countryForm, setCountryForm] = useState<any>(emptyCountry)
  const [folderForm, setFolderForm] = useState<any>(emptyFolder)
  const [examForm, setExamForm] = useState<any>(emptyExam)
  const [editing, setEditing] = useState<{ type: 'country' | 'folder' | 'exam'; id: number } | null>(null)
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set())
  const [draggedFolder, setDraggedFolder] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewExam, setPreviewExam] = useState<Exam | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('access')}` })
  const load = async () => {
    const [countryRes, folderRes, examRes] = await Promise.all([
      axios.get(`${API_BASE}/cbt/countries/?page_size=100`, { headers: headers() }),
      axios.get(`${API_BASE}/cbt/folders/?page_size=100`, { headers: headers() }),
      axios.get(`${API_BASE}/cbt/exams/?page_size=100`, { headers: headers() })
    ])
    setCountries(listData(countryRes.data)); setFolders(listData(folderRes.data)); setExams(listData(examRes.data))
  }
  useEffect(() => { load().catch(error => setMessage(error.response?.data?.detail || 'Unable to load the exam library.')) }, [])

  const rootFolders = folders.filter(folder => !folder.parent)
  const children = (parent: number) => folders.filter(folder => folder.parent === parent)
  const folderExams = (folderId: number) => exams.filter(exam => exam.folder === folderId)

  const resetForms = () => { setCountryForm(emptyCountry); setFolderForm(emptyFolder); setExamForm(emptyExam); setEditing(null) }
  const save = async (type: 'country' | 'folder' | 'exam', event: React.FormEvent) => {
    event.preventDefault(); setMessage('')
    try {
      const payload = type === 'country' ? { ...countryForm, available_from: countryForm.available_from || null, available_until: countryForm.available_until || null } : type === 'folder' ? { ...folderForm, country: Number(folderForm.country), parent: folderForm.parent ? Number(folderForm.parent) : null, available_from: folderForm.available_from || null, available_until: folderForm.available_until || null } : { ...examForm, folder: examForm.folder ? Number(examForm.folder) : null, time_limit_minutes: Number(examForm.time_limit_minutes), available_from: examForm.available_from || null, available_until: examForm.available_until || null }
      const path = type === 'country' ? 'countries' : type === 'folder' ? 'folders' : 'exams'
      if (editing?.type === type) await axios.patch(`${API_BASE}/cbt/${path}/${editing.id}/`, payload, { headers: headers() })
      else await axios.post(`${API_BASE}/cbt/${path}/`, payload, { headers: headers() })
      setMessage(`${type[0].toUpperCase() + type.slice(1)} saved.`); resetForms(); await load()
    } catch (error: any) {
      const data = error.response?.data
      const details = data && typeof data === 'object'
        ? Object.entries(data).map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`).join(' ')
        : ''
      setMessage(data?.detail || details || 'The item could not be saved.')
    }
  }

  const editCountry = (country: Country) => { setEditing({ type: 'country', id: country.id }); setCountryForm({ name: country.name, code: country.code, slug: country.slug, status: country.status, available_from: country.available_from?.slice(0, 16) || '', available_until: country.available_until?.slice(0, 16) || '' }) }
  const editFolder = (folder: Folder) => { setEditing({ type: 'folder', id: folder.id }); setFolderForm({ country: String(folder.country), parent: folder.parent ? String(folder.parent) : '', name: folder.name, slug: folder.slug, description: folder.description, status: folder.status, available_from: folder.available_from?.slice(0, 16) || '', available_until: folder.available_until?.slice(0, 16) || '' }) }
  const editExam = (exam: Exam) => { setEditing({ type: 'exam', id: exam.id }); setExamForm({ title: exam.title, slug: exam.slug, folder: exam.folder ? String(exam.folder) : '', description: exam.description, time_limit_minutes: exam.time_limit_minutes, year: exam.year || '', difficulty: exam.difficulty || '', institution: exam.institution || '', status: exam.status, available_from: exam.available_from?.slice(0, 16) || '', available_until: exam.available_until?.slice(0, 16) || '' }) }
  const archive = async (type: 'country' | 'folder' | 'exam', id: number) => { await axios.patch(`${API_BASE}/cbt/${type === 'country' ? 'countries' : type === 'folder' ? 'folders' : 'exams'}/${id}/`, { status: 'archived', is_visible: false }, { headers: headers() }); await load() }
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
  const reorder = async (folder: Folder) => {
    if (!draggedFolder || draggedFolder === folder.id) return
    const siblings = folders.filter(item => item.parent === folder.parent && item.country === folder.country)
    const source = siblings.find(item => item.id === draggedFolder)
    const target = siblings.find(item => item.id === folder.id)
    if (!source || !target) return
    const ordered = siblings.filter(item => item.id !== source.id)
    ordered.splice(Math.max(0, ordered.findIndex(item => item.id === target.id)), 0, source)
    await axios.post(`${API_BASE}/cbt/folders/reorder/`, { items: ordered.map((item, index) => ({ id: item.id, sort_order: index })) }, { headers: headers() })
    setDraggedFolder(null); await load()
  }

  const renderFolder = (folder: Folder, depth = 0): React.ReactNode => {
    const expanded = openFolders.has(folder.id)
    const nested = children(folder.id)
    return <div key={folder.id} className="border-l border-gray-200 ml-2" onDragOver={event => event.preventDefault()} onDrop={() => reorder(folder)}>
      <div draggable onDragStart={() => setDraggedFolder(folder.id)} className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg" style={{ marginLeft: depth * 14 }}>
        <button onClick={() => setOpenFolders(previous => { const next = new Set(previous); next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id); return next })} aria-label={expanded ? 'Collapse folder' : 'Expand folder'}>{expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
        <span className="text-yellow-600">📁</span><span className="font-medium flex-1">{folder.name}</span><span className="text-xs text-gray-500">{folderExams(folder.id).length} exams</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100">{folder.status}</span><button onClick={() => editFolder(folder)} title="Edit folder"><Pencil className="w-4 h-4 text-gray-500" /></button><button onClick={() => archive('folder', folder.id)} title="Archive folder"><Archive className="w-4 h-4 text-gray-500" /></button>
      </div>
      {expanded && <div>{folderExams(folder.id).map(exam => <div key={exam.id} className="flex items-center gap-2 py-2 px-3 ml-10 border-t border-gray-100"><span className="text-gray-400">•</span><span className="flex-1">{exam.title}</span><span className="text-xs text-gray-500">{exam.question_count || 0} questions</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100">{exam.status}</span><button onClick={() => openPreview(exam)} title="Preview exam"><Eye className="w-4 h-4 text-green-600" /></button>{onManageExam && <button onClick={() => onManageExam(exam)} title="Manage subjects"><BookOpen className="w-4 h-4 text-blue-600" /></button>}<button onClick={() => editExam(exam)} title="Edit exam"><Pencil className="w-4 h-4 text-gray-500" /></button><button onClick={() => archive('exam', exam.id)} title="Archive exam"><Archive className="w-4 h-4 text-gray-500" /></button></div>)}{nested.map(child => renderFolder(child, depth + 1))}</div>}
    </div>
  }

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 className="text-2xl font-bold text-gray-900">Exam Library</h2><p className="text-sm text-gray-500">Manage countries, folders, exams, publication, and ordering.</p></div><div className="flex flex-wrap gap-2"><button onClick={resetForms} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg"><Plus className="w-4 h-4" /> New item</button><button onClick={() => openPreview()} className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg"><Eye className="w-4 h-4" /> Preview library</button></div></div>
    {message && <div className="p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">{message}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
      <section className="bg-white border rounded-xl p-5"><div className="flex items-center gap-2 mb-4"><Globe2 className="w-5 h-5 text-yellow-600" /><h3 className="font-semibold">Library tree</h3></div>{countries.map(country => <div key={country.id} className="mb-4"><div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"><Globe2 className="w-4 h-4 text-yellow-600" /><span className="font-semibold flex-1">{country.name}</span><span className="text-xs text-gray-500">{country.status}</span><button onClick={() => editCountry(country)} title="Edit country"><Pencil className="w-4 h-4 text-gray-500" /></button><button onClick={() => archive('country', country.id)} title="Archive country"><Archive className="w-4 h-4 text-gray-500" /></button></div>{rootFolders.filter(folder => folder.country === country.id).map(folder => renderFolder(folder))}</div>)}{countries.length === 0 && <p className="text-sm text-gray-500">No countries yet.</p>}</section>
      <section className="space-y-5">
        <form onSubmit={event => save('country', event)} className="bg-white border rounded-xl p-5 space-y-3"><div className="flex items-center gap-2"><Globe2 className="w-4 h-4" /><h3 className="font-semibold">{editing?.type === 'country' ? 'Edit country' : 'Add country'}</h3></div><input required placeholder="Country name" value={countryForm.name} onChange={event => setCountryForm({ ...countryForm, name: event.target.value })} className="w-full border rounded-lg px-3 py-2" /><div className="grid grid-cols-2 gap-3"><input required placeholder="Code" value={countryForm.code} onChange={event => setCountryForm({ ...countryForm, code: event.target.value.toUpperCase() })} className="border rounded-lg px-3 py-2" /><input required placeholder="Slug" value={countryForm.slug} onChange={event => setCountryForm({ ...countryForm, slug: event.target.value })} className="border rounded-lg px-3 py-2" /></div><select value={countryForm.status} onChange={event => setCountryForm({ ...countryForm, status: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select><DateFields value={countryForm} onChange={setCountryForm} /><FormActions onCancel={resetForms} /></form>
        <form onSubmit={event => save('folder', event)} className="bg-white border rounded-xl p-5 space-y-3"><div className="flex items-center gap-2"><FolderPlus className="w-4 h-4" /><h3 className="font-semibold">{editing?.type === 'folder' ? 'Edit folder' : 'Add folder'}</h3></div><select required value={folderForm.country} onChange={event => setFolderForm({ ...folderForm, country: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select country</option>{countries.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}</select><select value={folderForm.parent} onChange={event => setFolderForm({ ...folderForm, parent: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Root folder</option>{folders.filter(folder => String(folder.id) !== String(editing?.id)).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><input required placeholder="Folder name" value={folderForm.name} onChange={event => setFolderForm({ ...folderForm, name: event.target.value })} className="w-full border rounded-lg px-3 py-2" /><input required placeholder="Slug" value={folderForm.slug} onChange={event => setFolderForm({ ...folderForm, slug: event.target.value })} className="w-full border rounded-lg px-3 py-2" /><textarea placeholder="Description" value={folderForm.description} onChange={event => setFolderForm({ ...folderForm, description: event.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /><DateFields value={folderForm} onChange={setFolderForm} /><FormActions onCancel={resetForms} /></form>
        <form onSubmit={event => save('exam', event)} className="bg-white border rounded-xl p-5 space-y-3"><div className="flex items-center gap-2"><Save className="w-4 h-4" /><h3 className="font-semibold">{editing?.type === 'exam' ? 'Edit exam' : 'Add exam'}</h3></div><input required placeholder="Exam title" value={examForm.title} onChange={event => setExamForm({ ...examForm, title: event.target.value })} className="w-full border rounded-lg px-3 py-2" /><select value={examForm.folder} onChange={event => setExamForm({ ...examForm, folder: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Unassigned</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><textarea placeholder="Description" value={examForm.description} onChange={event => setExamForm({ ...examForm, description: event.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /><div className="grid grid-cols-2 gap-3"><input placeholder="Year" value={examForm.year} onChange={event => setExamForm({ ...examForm, year: event.target.value })} className="border rounded-lg px-3 py-2" /><input placeholder="Difficulty" value={examForm.difficulty} onChange={event => setExamForm({ ...examForm, difficulty: event.target.value })} className="border rounded-lg px-3 py-2" /></div><input placeholder="Institution/provider" value={examForm.institution} onChange={event => setExamForm({ ...examForm, institution: event.target.value })} className="w-full border rounded-lg px-3 py-2" /><select value={examForm.status} onChange={event => setExamForm({ ...examForm, status: event.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select><DateFields value={examForm} onChange={setExamForm} /><FormActions onCancel={resetForms} /></form>
      </section>
    </div>
    <ExamPreviewModal open={previewOpen} exam={previewExam} loading={previewLoading} countries={countries} folders={folders} exams={exams} onClose={() => setPreviewOpen(false)} onSelectExam={openPreview} onBack={() => setPreviewExam(null)} />
  </div>
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
            const countryFolders = folders.filter(folder => folder.country === country.id && folder.status === 'published' && folder.is_visible !== false)
            return <section key={country.id}>
              <div className="mb-3 flex items-center gap-2"><Globe2 className="h-5 w-5 text-yellow-400" /><h4 className="text-lg font-semibold">{country.name}</h4></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {countryFolders.map(folder => {
                  const folderExams = exams.filter(item => item.folder === folder.id && item.status === 'published' && item.is_visible !== false)
                  return <div key={folder.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                    <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-yellow-400" /><span className="font-medium">{folder.name}</span></div>
                    <div className="mt-3 space-y-2">{folderExams.length ? folderExams.map(item => <button key={item.id} onClick={() => onSelectExam(item)} className="flex w-full items-center justify-between rounded-md bg-slate-700/70 px-3 py-2 text-left text-sm hover:bg-slate-700"><span>{item.title}</span><Eye className="h-4 w-4 text-slate-400" /></button>) : <p className="text-sm text-slate-500">No published exams</p>}</div>
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
