import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FolderOpen,
  FolderPlus,
  Globe2,
  Link2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Unlink,
  X,
} from 'lucide-react'

/* ───────────────────────── constants & types ───────────────────────── */

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

/* ───────────────────────── utilities ───────────────────────── */

const toSlug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const toCode = (name: string) => name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'XX'
function listData(d: any) { return Array.isArray(d) ? d : (d?.results || []) }
function fmtErr(err: any, fallback: string) {
  const d = err?.response?.data
  if (d?.detail) return d.detail
  if (d && typeof d === 'object') return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' | ')
  return fallback
}

const STEPS = ['Country Tags', 'Folder Details', 'Attach Content', 'Review & Publish'] as const

const emptyForm = { name: '', description: '', parent: '' as string, countryTags: [] as number[], status: 'published' as Status, availableFrom: '', availableUntil: '' }

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function ExamLibraryManagement({ onManageExam }: { onManageExam?: (exam: Exam) => void }) {
  /* ── data ── */
  const [countries, setCountries] = useState<Country[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  /* ── wizard ── */
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [saving, setSaving] = useState(false)

  /* step 1 – country tags */
  const [newTagName, setNewTagName] = useState('')
  const [editTagId, setEditTagId] = useState<number | null>(null)
  const [editTagName, setEditTagName] = useState('')

  /* step 2 – folder form */
  const [form, setForm] = useState(emptyForm)
  const [folderId, setFolderId] = useState<number | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  /* step 3 – attach */
  const [search, setSearch] = useState('')
  const [content, setContent] = useState<FolderContent>({ exam_links: [], subject_links: [] })
  const [contentLoading, setContentLoading] = useState(false)

  /* preview */
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewExam, setPreviewExam] = useState<Exam | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  /* delete confirmation modal */
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* messages */
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' | 'info' } | null>(null)
  const flash = (text: string, type: 'ok' | 'err' | 'info' = 'info') => { setMsg({ text, type }); if (type !== 'err') setTimeout(() => setMsg(null), 4000) }

  /* ── helpers ── */
  const hdr = () => ({ Authorization: `Bearer ${localStorage.getItem('access')}` })
  const linkedExams = useMemo(() => new Set(content.exam_links.map(l => l.exam.id)), [content.exam_links])
  const linkedSubjects = useMemo(() => new Set(content.subject_links.map(l => l.subject.id)), [content.subject_links])
  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return exams
    return exams.filter(e => [e.title, e.description, e.institution, e.provider, e.exam_type, e.year, ...(e.subjects || []).map(s => s.name)].some(v => String(v || '').toLowerCase().includes(q)))
  }, [search, exams])

  /* ── loaders ── */
  const load = async () => {
    setLoading(true)
    try {
      const [c, f, e] = await Promise.all([
        axios.get(`${API_BASE}/cbt/countries/?page_size=100`, { headers: hdr() }),
        axios.get(`${API_BASE}/cbt/folders/?page_size=100`, { headers: hdr() }),
        axios.get(`${API_BASE}/cbt/exams/?page_size=100`, { headers: hdr() }),
      ])
      setCountries(listData(c.data)); setFolders(listData(f.data)); setExams(listData(e.data))
    } catch (e: any) { flash(fmtErr(e, 'Unable to load exam library.'), 'err') }
    finally { setLoading(false) }
  }
  const loadContent = async (id: number | null) => {
    if (!id) { setContent({ exam_links: [], subject_links: [] }); return }
    setContentLoading(true)
    try { const r = await axios.get(`${API_BASE}/cbt/folders/${id}/contents/`, { headers: hdr() }); setContent({ exam_links: r.data?.exam_links || [], subject_links: r.data?.subject_links || [] }) }
    catch { setContent({ exam_links: [], subject_links: [] }) }
    finally { setContentLoading(false) }
  }
  useEffect(() => { load() }, [])

  /* ── wizard controls ── */
  const openCreate = () => { setMode('create'); setStep(1); setFolderId(null); setForm(emptyForm); setContent({ exam_links: [], subject_links: [] }); setSearch(''); setShowAdvanced(false); setWizardOpen(true); setMsg(null) }
  const openEdit = (f: Folder) => {
    setMode('edit'); setStep(2); setFolderId(f.id)
    setForm({ name: f.name, description: f.description, parent: f.parent ? String(f.parent) : '', countryTags: f.country_tags || [], status: f.status, availableFrom: f.available_from?.slice(0, 16) || '', availableUntil: f.available_until?.slice(0, 16) || '' })
    setShowAdvanced(!!(f.available_from || f.available_until)); setSearch(''); setWizardOpen(true); setMsg(null)
    loadContent(f.id)
  }
  const close = () => { setWizardOpen(false); setMsg(null) }

  /* ── country CRUD ── */
  const addTag = async () => {
    const n = newTagName.trim(); if (!n) return
    setSaving(true)
    try { await axios.post(`${API_BASE}/cbt/countries/`, { name: n, code: toCode(n), slug: toSlug(n), status: 'published', available_from: null, available_until: null }, { headers: hdr() }); setNewTagName(''); flash('Country tag added.', 'ok'); await load() }
    catch (e: any) { flash(fmtErr(e, 'Could not add country tag.'), 'err') }
    finally { setSaving(false) }
  }
  const saveTag = async (id: number) => {
    const n = editTagName.trim(); if (!n) return
    setSaving(true)
    try { await axios.patch(`${API_BASE}/cbt/countries/${id}/`, { name: n, code: toCode(n), slug: toSlug(n) }, { headers: hdr() }); setEditTagId(null); flash('Country tag updated.', 'ok'); await load() }
    catch (e: any) { flash(fmtErr(e, 'Could not update tag.'), 'err') }
    finally { setSaving(false) }
  }
  const archiveTag = async (c: Country) => {
    try { await axios.patch(`${API_BASE}/cbt/countries/${c.id}/`, { status: 'archived', is_visible: false }, { headers: hdr() }); flash('Country tag archived.', 'ok'); await load() }
    catch (e: any) { flash(fmtErr(e, 'Could not archive tag.'), 'err') }
  }

  /* ── folder CRUD ── */
  const saveFolder = async (): Promise<number | null> => {
    setSaving(true)
    try {
      const payload = { parent: form.parent ? Number(form.parent) : null, country: form.countryTags[0] || null, country_tags: form.countryTags, name: form.name, slug: toSlug(form.name), description: form.description, status: form.status, is_visible: form.status !== 'draft' && form.status !== 'archived', available_from: form.availableFrom || null, available_until: form.availableUntil || null }
      if (folderId) { await axios.patch(`${API_BASE}/cbt/folders/${folderId}/`, payload, { headers: hdr() }); await load(); return folderId }
      const r = await axios.post(`${API_BASE}/cbt/folders/`, payload, { headers: hdr() }); const id = r.data.id; setFolderId(id); await load(); return id
    } catch (e: any) { flash(fmtErr(e, 'Could not save folder.'), 'err'); return null }
    finally { setSaving(false) }
  }
  const goStep3 = async () => {
    if (!form.name.trim()) { flash('Please enter a folder name.', 'err'); return }
    const id = await saveFolder()
    if (id) { await loadContent(id); setStep(3); flash('Folder saved. Now attach your content.', 'ok') }
  }
  const publishFolder = async () => {
    if (!folderId) return; setSaving(true)
    try { await axios.post(`${API_BASE}/cbt/folders/${folderId}/publish/`, {}, { headers: hdr() }); flash('Folder published! Students can now discover it.', 'ok'); await load(); close() }
    catch (e: any) { flash(fmtErr(e, 'Could not publish.'), 'err') }
    finally { setSaving(false) }
  }
  const finishDraft = async () => {
    if (folderId) {
      try { await axios.patch(`${API_BASE}/cbt/folders/${folderId}/`, { status: 'draft', is_visible: false }, { headers: hdr() }); await load() }
      catch { /* already saved */ }
    }
    flash('Saved as draft. You can publish anytime from the table below.', 'ok'); close()
  }

  /* folder table quick-actions */
  const folderAction = async (action: 'publish' | 'unpublish' | 'archive' | 'unarchive', f: Folder) => {
    try { await axios.post(`${API_BASE}/cbt/folders/${f.id}/${action}/`, {}, { headers: hdr() }); flash(`Folder ${action}ed.`, 'ok'); await load() }
    catch (e: any) { flash(fmtErr(e, `Could not ${action} folder.`), 'err') }
  }
  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return
    setDeleting(true)
    try {
      await axios.delete(`${API_BASE}/cbt/folders/${folderToDelete.id}/`, { headers: hdr() })
      flash(`"${folderToDelete.name}" deleted.`, 'ok')
      setFolderToDelete(null)
      await load()
    } catch (e: any) {
      flash(fmtErr(e, 'Could not delete folder.'), 'err')
    } finally {
      setDeleting(false)
    }
  }

  /* attach / detach */
  const attach = async (type: 'exam' | 'subject', id: number) => {
    if (!folderId) return
    try { await axios.post(`${API_BASE}/cbt/folders/${folderId}/attach_${type}/`, { [`${type}_id`]: id }, { headers: hdr() }); flash(`${type === 'exam' ? 'Exam' : 'Subject'} attached.`, 'ok'); await load(); await loadContent(folderId) }
    catch (e: any) { flash(fmtErr(e, `Could not attach ${type}.`), 'err') }
  }
  const detach = async (type: 'exam' | 'subject', id: number) => {
    if (!folderId) return
    try { await axios.post(`${API_BASE}/cbt/folders/${folderId}/detach_${type}/`, { [`${type}_id`]: id }, { headers: hdr() }); flash(`${type === 'exam' ? 'Exam' : 'Subject'} removed.`, 'ok'); await load(); await loadContent(folderId) }
    catch (e: any) { flash(fmtErr(e, `Could not detach ${type}.`), 'err') }
  }

  /* preview */
  const openPreview = async (exam?: Exam) => {
    setPreviewOpen(true); setPreviewExam(null)
    if (!exam) return
    setPreviewLoading(true)
    try { const r = await axios.get(`${API_BASE}/cbt/exams/${exam.id}/preview/`, { headers: hdr() }); setPreviewExam(r.data) }
    catch { setPreviewExam(exam) }
    finally { setPreviewLoading(false) }
  }

  /* derived */
  const parentName = folders.find(f => String(f.id) === form.parent)?.name || 'Root (top level)'
  const tagNames = countries.filter(c => form.countryTags.includes(c.id)).map(c => c.name)

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FolderOpen className="w-6 h-6 text-yellow-600" /> Exam Library</h2>
          <p className="text-sm text-gray-500 mt-1">Organise exams into folders by country so students can discover them.</p>
        </div>
        <div className="flex gap-3">
          {!wizardOpen && <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl shadow-sm transition-all"><Plus className="w-4 h-4" /> Create Folder</button>}
          <button onClick={() => openPreview()} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-700 font-medium"><Eye className="w-4 h-4" /> Preview Library</button>
        </div>
      </div>

      {/* ── flash message ── */}
      {msg && (
        <div className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : msg.type === 'err' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
          {msg.type === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{msg.text}</span>
          <button onClick={() => setMsg(null)} className="shrink-0 ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-white p-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-yellow-600 border-t-transparent" />
          <p className="mt-4 text-gray-500 font-medium">Loading exam library…</p>
        </div>
      ) : (
        <>
          {/* ═══════════════ WIZARD ═══════════════ */}
          {wizardOpen && (
            <div className="rounded-2xl border-2 border-yellow-300 bg-white shadow-xl overflow-hidden">
              {/* stepper header */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{mode === 'create' ? 'Create Library Folder' : 'Edit Library Folder'}</h3>
                  <button onClick={close} className="p-1.5 rounded-lg hover:bg-yellow-100 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <Stepper current={step} steps={[...STEPS]} />
              </div>

              {/* step body */}
              <div className="p-6 min-h-[320px]">
                {step === 1 && <Step1_Tags countries={countries} newName={newTagName} setNewName={setNewTagName} onAdd={addTag} editId={editTagId} editName={editTagName} setEditName={setEditTagName} onStartEdit={c => { setEditTagId(c.id); setEditTagName(c.name) }} onSaveEdit={saveTag} onCancelEdit={() => setEditTagId(null)} onArchive={archiveTag} saving={saving} />}
                {step === 2 && <Step2_Folder form={form} setForm={setForm} countries={countries} folders={folders} editingId={folderId} showAdv={showAdvanced} setShowAdv={setShowAdvanced} />}
                {step === 3 && <Step3_Attach folderName={form.name} search={search} setSearch={setSearch} exams={filteredExams} content={content} contentLoading={contentLoading} linked={linkedExams} linkedSub={linkedSubjects} onAttach={attach} onDetach={detach} onManageExam={onManageExam} />}
                {step === 4 && <Step4_Review folderName={form.name} description={form.description} parentName={parentName} tagNames={tagNames} status={form.status} examLinks={content.exam_links} subjectLinks={content.subject_links} />}
              </div>

              {/* footer nav */}
              <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {step > 1 && <button onClick={() => setStep(s => (s - 1) as any)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors">← Back</button>}
                  <button onClick={close} className="px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                </div>
                <div className="flex gap-2">
                  {step === 1 && <button onClick={() => setStep(2)} className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">Next: Folder Details →</button>}
                  {step === 2 && <button onClick={goStep3} disabled={saving || !form.name.trim()} className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">{saving ? 'Saving…' : 'Save & Attach Content →'}</button>}
                  {step === 3 && <button onClick={() => setStep(4)} className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">Next: Review →</button>}
                  {step === 4 && (
                    <>
                      <button onClick={finishDraft} disabled={saving} className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors">Save as Draft</button>
                      <button onClick={publishFolder} disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">{saving ? 'Publishing…' : '✓ Publish Folder'}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat icon={<Globe2 className="w-5 h-5 text-yellow-600" />} label="Country Tags" value={countries.filter(c => c.status !== 'archived').length} />
            <Stat icon={<FolderPlus className="w-5 h-5 text-blue-600" />} label="Total Folders" value={folders.length} />
            <Stat icon={<BookOpen className="w-5 h-5 text-emerald-600" />} label="Exams in System" value={exams.length} />
            <Stat icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />} label="Published" value={folders.filter(f => f.status === 'published').length} />
          </div>

          {/* ── folder table ── */}
          <section className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Library Folders</h3>
                <p className="text-sm text-gray-500">Click any folder to edit it in the wizard.</p>
              </div>
              {!wizardOpen && <button onClick={openCreate} className="text-sm font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1"><Plus className="w-4 h-4" /> New Folder</button>}
            </div>
            {folders.length === 0 ? (
              <div className="p-16 text-center">
                <FolderPlus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="font-semibold text-gray-700">No folders yet</p>
                <p className="text-sm text-gray-500 mt-1 mb-5">Create your first folder to start organising exams for students.</p>
                {!wizardOpen && <button onClick={openCreate} className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl shadow-sm transition-all"><Plus className="w-4 h-4 inline mr-1" />Create Folder</button>}
              </div>
            ) : (
              <div className="divide-y">
                {folders.map(f => (
                  <div key={f.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => openEdit(f)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{f.name}</h4>
                        <Badge status={f.status} />
                        {(f.country_tag_details || []).map(t => <span key={t.id} className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">{t.name}</span>)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 truncate">{f.description || 'No description'} · {f.exam_count || 0} exams · {f.subject_count || 0} subjects · {f.child_count || 0} subfolders</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                      <TinyBtn onClick={() => openEdit(f)} tip="Edit"><Pencil className="w-3.5 h-3.5" /></TinyBtn>
                      {f.status === 'published'
                        ? <TinyBtn onClick={() => folderAction('unpublish', f)} tip="Unpublish"><EyeOff className="w-3.5 h-3.5" /></TinyBtn>
                        : <TinyBtn onClick={() => folderAction('publish', f)} tip="Publish"><CheckCircle2 className="w-3.5 h-3.5" /></TinyBtn>}
                      {f.status === 'archived'
                        ? <TinyBtn onClick={() => folderAction('unarchive', f)} tip="Unarchive"><RotateCcw className="w-3.5 h-3.5" /></TinyBtn>
                        : <TinyBtn onClick={() => folderAction('archive', f)} tip="Archive"><Archive className="w-3.5 h-3.5" /></TinyBtn>}
                      <TinyBtn onClick={() => setFolderToDelete(f)} tip="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></TinyBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" onClick={() => !deleting && setFolderToDelete(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Folder</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{folderToDelete.name}"</span>? Attached exams and subjects will remain safe in the system.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteFolder}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* preview modal (preserved) */}
      <PreviewModal open={previewOpen} exam={previewExam} loading={previewLoading} countries={countries} folders={folders} exams={exams} onClose={() => setPreviewOpen(false)} onSelectExam={openPreview} onBack={() => setPreviewExam(null)} />
    </div>
  )
}

/* ═══════════════════════ WIZARD STEPPER ═══════════════════════ */

function Stepper({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <React.Fragment key={n}>
            {i > 0 && <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${done ? 'bg-emerald-400' : active ? 'bg-yellow-400' : 'bg-gray-200'}`} />}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'bg-yellow-600 text-white ring-[3px] ring-yellow-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${active ? 'text-yellow-700' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ═══════════════════════ STEP 1 — COUNTRY TAGS ═══════════════════════ */

function Step1_Tags({ countries, newName, setNewName, onAdd, editId, editName, setEditName, onStartEdit, onSaveEdit, onCancelEdit, onArchive, saving }: {
  countries: Country[]; newName: string; setNewName: (v: string) => void; onAdd: () => void
  editId: number | null; editName: string; setEditName: (v: string) => void
  onStartEdit: (c: Country) => void; onSaveEdit: (id: number) => void; onCancelEdit: () => void; onArchive: (c: Country) => void; saving: boolean
}) {
  const active = countries.filter(c => c.status !== 'archived')
  const archived = countries.filter(c => c.status === 'archived')

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Country Tags</h3>
        <p className="text-sm text-gray-500 mt-1">Country tags let students filter the library by region. You can skip this if tags already exist, or add more later.</p>
      </div>

      {/* add row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} placeholder="Type a country name, e.g. Nigeria" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" />
        </div>
        <button onClick={onAdd} disabled={saving || !newName.trim()} className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl text-sm transition-colors shrink-0 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Tag
        </button>
      </div>

      {/* tag list */}
      {active.length > 0 && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {active.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
              <Globe2 className="w-4 h-4 text-yellow-600 shrink-0" />
              {editId === c.id ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(c.id); if (e.key === 'Escape') onCancelEdit() }} className="flex-1 border border-yellow-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" autoFocus />
                  <button onClick={() => onSaveEdit(c.id)} disabled={saving} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
                  <button onClick={onCancelEdit} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-gray-900 text-sm">{c.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{c.code}</span>
                  <Badge status={c.status} />
                  <button onClick={() => onStartEdit(c)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onArchive(c)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500 text-sm">No country tags yet. Add one above, or skip this step.</div>}
      {archived.length > 0 && <p className="text-xs text-gray-400">{archived.length} archived tag{archived.length > 1 ? 's' : ''} hidden.</p>}
    </div>
  )
}

/* ═══════════════════════ STEP 2 — FOLDER DETAILS ═══════════════════════ */

function Step2_Folder({ form, setForm, countries, folders, editingId, showAdv, setShowAdv }: {
  form: typeof emptyForm; setForm: (v: any) => void; countries: Country[]; folders: Folder[]; editingId: number | null; showAdv: boolean; setShowAdv: (v: boolean) => void
}) {
  const toggleTag = (id: number) => setForm((p: any) => ({ ...p, countryTags: p.countryTags.includes(id) ? p.countryTags.filter((x: number) => x !== id) : [...p.countryTags, id] }))
  const activeTags = countries.filter(c => c.status !== 'archived')

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Folder' : 'Create Folder'}</h3>
        <p className="text-sm text-gray-500 mt-1">Give the folder a name and optionally tag it with countries so students can find it.</p>
      </div>

      {/* name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Folder Name <span className="text-red-400">*</span></label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. WAEC Past Questions" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" />
      </div>

      {/* description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A short student-facing description" rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all resize-none" />
      </div>

      {/* parent */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent Folder</label>
        <select value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all bg-white">
          <option value="">Root (top level)</option>
          {folders.filter(f => f.id !== editingId).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* country tags */}
      {activeTags.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Country Tags</label>
          <div className="flex flex-wrap gap-2">
            {activeTags.map(c => {
              const on = form.countryTags.includes(c.id)
              return <button key={c.id} type="button" onClick={() => toggleTag(c.id)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${on ? 'border-yellow-500 bg-yellow-50 text-yellow-800 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{on && <Check className="w-3 h-3 inline mr-1" />}{c.name}</button>
            })}
          </div>
        </div>
      )}

      {/* status */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Status</label>
        <div className="flex gap-3">
          <button type="button" onClick={() => setForm({ ...form, status: 'published' })} className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold text-center transition-all ${form.status === 'published' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}><CheckCircle2 className="w-4 h-4 inline mr-1.5" />Published</button>
          <button type="button" onClick={() => setForm({ ...form, status: 'draft' })} className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold text-center transition-all ${form.status === 'draft' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}><Pencil className="w-4 h-4 inline mr-1.5" />Draft</button>
        </div>
      </div>

      {/* advanced */}
      <div>
        <button type="button" onClick={() => setShowAdv(!showAdv)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium">
          {showAdv ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Advanced Scheduling
        </button>
        {showAdv && (
          <div className="mt-3 grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Available from</label>
              <input type="datetime-local" value={form.availableFrom} onChange={e => setForm({ ...form, availableFrom: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Available until</label>
              <input type="datetime-local" value={form.availableUntil} onChange={e => setForm({ ...form, availableUntil: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════ STEP 3 — ATTACH CONTENT ═══════════════════════ */

function Step3_Attach({ folderName, search, setSearch, exams, content, contentLoading, linked, linkedSub, onAttach, onDetach, onManageExam }: {
  folderName: string; search: string; setSearch: (v: string) => void
  exams: Exam[]; content: FolderContent; contentLoading: boolean
  linked: Set<number>; linkedSub: Set<number>
  onAttach: (t: 'exam' | 'subject', id: number) => void; onDetach: (t: 'exam' | 'subject', id: number) => void
  onManageExam?: (e: Exam) => void
}) {
  const attachedCount = content.exam_links.length + content.subject_links.length

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Attach Content to <span className="text-yellow-700">{folderName}</span></h3>
          <p className="text-sm text-gray-500 mt-1">Search existing exams on the left, and see what's in this folder on the right.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams or subjects…" className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* LEFT – available exams */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b"><h4 className="font-semibold text-gray-800 text-sm">Available Exams</h4></div>
          <div className="max-h-[520px] overflow-y-auto divide-y">
            {exams.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="font-medium">No exams in the system yet</p>
                <p className="text-xs mt-1">Create exams in the Exams tab first, then come back to attach them.</p>
              </div>
            ) : exams.map(e => (
              <div key={e.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="font-semibold text-gray-900 text-sm truncate">{e.title}</h5>
                    <p className="text-xs text-gray-500">{e.subject_count || e.subjects?.length || 0} subjects · {e.question_count || 0} questions{e.year ? ` · ${e.year}` : ''}</p>
                  </div>
                  <button disabled={linked.has(e.id)} onClick={() => onAttach('exam', e.id)} className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${linked.has(e.id) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}>
                    {linked.has(e.id) ? <><Check className="w-3 h-3" /> Attached</> : <><Link2 className="w-3 h-3" /> Add Exam</>}
                  </button>
                </div>
                {(e.subjects || []).length > 0 && (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {e.subjects!.map(s => (
                      <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs">
                        <span className="text-gray-700 truncate">{s.name}</span>
                        <button disabled={linked.has(e.id) || linkedSub.has(s.id)} onClick={() => onAttach('subject', s.id)} className={`shrink-0 font-semibold ${linked.has(e.id) || linkedSub.has(s.id) ? 'text-gray-400' : 'text-yellow-700 hover:text-yellow-800'}`}>
                          {linkedSub.has(s.id) ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {onManageExam && <button onClick={() => onManageExam(e)} className="text-xs text-gray-500 hover:text-yellow-700 font-medium">Manage subjects →</button>}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT – folder contents */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 text-sm">In This Folder</h4>
            <span className="text-xs text-gray-400">{attachedCount} item{attachedCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {contentLoading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading contents…</div>
            ) : attachedCount === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <FolderOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="font-medium">Nothing attached yet</p>
                <p className="text-xs mt-1">Use the panel on the left to add exams or subjects.</p>
              </div>
            ) : (
              <div className="divide-y">
                {content.exam_links.map(l => (
                  <div key={`e-${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <BookOpen className="w-4 h-4 text-yellow-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{l.exam.title}</p>
                      <p className="text-xs text-gray-500">{l.exam.question_count || 0} questions</p>
                    </div>
                    <button onClick={() => onDetach('exam', l.exam.id)} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove"><Unlink className="w-4 h-4" /></button>
                  </div>
                ))}
                {content.subject_links.map(l => (
                  <div key={`s-${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center shrink-0"><span className="text-[9px] font-bold text-gray-500">S</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{l.subject.name}</p>
                      <p className="text-xs text-gray-500">from {l.exam.title}</p>
                    </div>
                    <button onClick={() => onDetach('subject', l.subject.id)} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove"><Unlink className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ STEP 4 — REVIEW ═══════════════════════ */

function Step4_Review({ folderName, description, parentName, tagNames, status, examLinks, subjectLinks }: {
  folderName: string; description: string; parentName: string; tagNames: string[]; status: Status
  examLinks: FolderContent['exam_links']; subjectLinks: FolderContent['subject_links']
}) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Review & Publish</h3>
        <p className="text-sm text-gray-500 mt-1">Double-check everything before publishing. Students will be able to see published folders.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-xl font-bold text-gray-900">{folderName}</h4>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          <Badge status={status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SummaryField label="Parent" value={parentName} />
          <SummaryField label="Country Tags" value={tagNames.length ? tagNames.join(', ') : 'None'} />
          <SummaryField label="Exams Attached" value={String(examLinks.length)} />
          <SummaryField label="Subjects Attached" value={String(subjectLinks.length)} />
        </div>

        {(examLinks.length > 0 || subjectLinks.length > 0) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Attached Content</p>
            <div className="space-y-2">
              {examLinks.map(l => (
                <div key={l.id} className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="text-gray-800 font-medium">{l.exam.title}</span>
                  <span className="text-xs text-gray-400">({l.exam.question_count || 0} questions)</span>
                </div>
              ))}
              {subjectLinks.map(l => (
                <div key={l.id} className="flex items-center gap-2 text-sm">
                  <div className="w-3.5 h-3.5 rounded bg-gray-200 flex items-center justify-center"><span className="text-[8px] font-bold text-gray-500">S</span></div>
                  <span className="text-gray-800 font-medium">{l.subject.name}</span>
                  <span className="text-xs text-gray-400">from {l.exam.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {examLinks.length === 0 && subjectLinks.length === 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">⚠ No content attached. Students will see an empty folder. You can go back and attach exams.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════ SMALL HELPERS ═══════════════════════ */

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <div className="p-2 rounded-xl bg-gray-50">{icon}</div>
      <div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500 font-medium">{label}</p></div>
    </div>
  )
}

function Badge({ status }: { status: Status }) {
  const cls = status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : status === 'archived' ? 'bg-gray-100 text-gray-600 border-gray-200' : status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
  return <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>{status}</span>
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p><p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p></div>
}

function TinyBtn({ children, onClick, tip }: { children: React.ReactNode; onClick: () => void; tip: string }) {
  return <button type="button" onClick={onClick} title={tip} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-yellow-400 hover:text-yellow-700 transition-colors">{children}</button>
}

/* ═══════════════════════ PREVIEW MODAL ═══════════════════════ */

function PreviewModal({ open, exam, loading, countries, folders, exams, onClose, onSelectExam, onBack }: {
  open: boolean; exam: Exam | null; loading: boolean; countries: Country[]; folders: Folder[]; exams: Exam[]
  onClose: () => void; onSelectExam: (e: Exam) => void; onBack: () => void
}) {
  if (!open) return null
  const pubCountries = countries.filter(c => c.status === 'published' && c.is_visible !== false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Student library preview" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Student preview</p>
            <h3 className="text-xl font-bold">{exam ? exam.title : 'Exam Library'}</h3>
            <p className="text-sm text-slate-400">This preview stays inside the admin dashboard.</p>
          </div>
          <button onClick={onClose} title="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">
          {loading ? <div className="py-16 text-center text-slate-400">Loading preview…</div>
          : exam ? (
            <div className="space-y-6">
              <button onClick={onBack} className="text-sm text-yellow-400 hover:text-yellow-300">← Back to library</button>
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
                {exam.subjects?.length ? <div className="grid gap-3 sm:grid-cols-2">{exam.subjects.map(s => <div key={s.id} className="rounded-lg border border-slate-700 bg-slate-800/70 p-4"><div className="font-medium">{s.name}</div><div className="mt-1 text-sm text-slate-400">{s.question_count || 0} questions</div></div>)}</div>
                : <p className="text-sm text-slate-400">No subjects added yet.</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {pubCountries.map(c => {
                const cFolders = folders.filter(f => (f.country_tags || []).includes(c.id) && f.status === 'published' && f.is_visible !== false)
                return (
                  <section key={c.id}>
                    <div className="mb-3 flex items-center gap-2"><Globe2 className="h-5 w-5 text-yellow-400" /><h4 className="text-lg font-semibold">{c.name}</h4></div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {cFolders.map(f => {
                        const fExams = exams.filter(x => x.status === 'published' && x.is_visible !== false)
                        return (
                          <div key={f.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-yellow-400" /><span className="font-medium">{f.name}</span></div>
                            <div className="mt-3 space-y-2">{fExams.length ? fExams.slice(0, 5).map(x => <button key={x.id} onClick={() => onSelectExam(x)} className="flex w-full items-center justify-between rounded-md bg-slate-700/70 px-3 py-2 text-left text-sm hover:bg-slate-700"><span>{x.title}</span><Eye className="h-4 w-4 text-slate-400" /></button>) : <p className="text-sm text-slate-500">No published exams</p>}</div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
              {!pubCountries.length && <p className="py-12 text-center text-slate-400">No published content is available in the student preview.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
