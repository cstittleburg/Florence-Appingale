import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle, FolderOpen } from 'lucide-react'
import { parsePPTX } from '../utils/pptxParser'
import { useApp } from '../context/AppContext'

export default function UploadCenter() {
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useApp()
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const fileInputRef              = useRef()
  const [meta, setMeta]           = useState({ courseName: '', examDate: '' })

  async function handleFiles(files) {
    const pptxFiles = [...files].filter(f =>
      f.name.endsWith('.pptx') ||
      f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
    if (pptxFiles.length === 0) { setError('Please upload .pptx files only.'); return }
    setError('')
    setLoading(true)
    try {
      for (const file of pptxFiles) {
        const slides = await parsePPTX(file)
        addUploadedFile({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          courseName: meta.courseName || 'Unnamed Course',
          examDate: meta.examDate || '',
          uploadedAt: new Date().toISOString(),
          slides,
          slideCount: slides.length,
        })
      }
      setMeta({ courseName: '', examDate: '' })
    } catch (err) {
      setError(`Failed to parse file: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Course Materials</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Center</h1>
        <p className="text-slate-500 text-sm mt-1">Upload PowerPoint files — slide content is extracted automatically for your study plan.</p>
      </div>

      {/* Metadata */}
      <div className="card p-5 mb-5">
        <p className="section-header">
          <FileText className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
          File Details
          <span className="normal-case tracking-normal font-normal text-slate-400 ml-1">(optional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Course Name</label>
            <input
              className="input"
              placeholder="e.g. Pharmacology, Patho I…"
              value={meta.courseName}
              onChange={e => setMeta(m => ({ ...m, courseName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Exam Date</label>
            <input
              type="date"
              className="input"
              value={meta.examDate}
              onChange={e => setMeta(m => ({ ...m, examDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-150"
        style={{
          border: `2px dashed ${dragging ? '#0091cd' : '#cbd5e1'}`,
          background: dragging ? '#e0f2fe' : '#f8fafc',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef} type="file" accept=".pptx" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#0091cd' }} />
            <p className="text-slate-600 font-medium">Extracting slide content…</p>
            <p className="text-slate-400 text-sm">This may take a moment for large files</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: '#e0f2fe' }}>
              <Upload className="w-7 h-7" style={{ color: '#0091cd' }} />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-base">Drop .pptx files here</p>
              <p className="text-slate-400 text-sm mt-1">or tap to browse your files</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* File list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <p className="section-header">
            <FileText className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
            Uploaded Files
            <span className="ml-auto normal-case tracking-normal font-semibold text-slate-600">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</span>
          </p>
          <div className="space-y-3">
            {uploadedFiles.map(file => (
              <div key={file.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#fff7ed' }}>
                    <FileText className="w-5 h-5" style={{ color: '#ea580c' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate text-sm">{file.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#e0f2fe', color: '#0074a4' }}>{file.courseName}</span>
                      <span className="text-xs text-slate-400">{file.slideCount} slides</span>
                      {file.examDate && (
                        <span className="text-xs text-slate-400">
                          Exam: {new Date(file.examDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setExpandedId(expandedId === file.id ? null : file.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {expandedId === file.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeUploadedFile(file.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 transition-colors"
                      style={{ ':hover': { color: '#dc2626' } }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedId === file.id && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 max-h-64 overflow-y-auto">
                    <p className="section-header mb-3">
                      Extracted Slide Content
                    </p>
                    <div className="space-y-2">
                      {file.slides.map(slide => (
                        <div key={slide.slideNumber} className="bg-white rounded-lg px-3 py-2.5"
                          style={{ border: '1px solid #e2e8f0' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#0074a4' }}>Slide {slide.slideNumber}</p>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {slide.text || <em className="text-slate-400">No text found</em>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && !loading && (
        <p className="text-center text-slate-400 text-sm mt-8">No files uploaded yet. Drop your PowerPoints above to get started.</p>
      )}
    </div>
  )
}
