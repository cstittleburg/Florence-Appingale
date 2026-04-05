import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react'
import { parsePPTX } from '../utils/pptxParser'
import { useApp } from '../context/AppContext'

export default function UploadCenter() {
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useApp()
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const fileInputRef = useRef()

  // Form state for metadata
  const [meta, setMeta] = useState({ courseName: '', examDate: '' })

  async function handleFiles(files) {
    const pptxFiles = [...files].filter(f =>
      f.name.endsWith('.pptx') || f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
    if (pptxFiles.length === 0) {
      setError('Please upload .pptx files only.')
      return
    }
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
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upload Course Materials</h1>
        <p className="text-slate-500 mt-1 text-sm">Upload your PowerPoint files — the app will extract slide content to build your study plan.</p>
      </div>

      {/* Metadata form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">File Details (optional)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Course Name</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="e.g. Pharmacology, Patho I…"
              value={meta.courseName}
              onChange={e => setMeta(m => ({ ...m, courseName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Exam Date</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={meta.examDate}
              onChange={e => setMeta(m => ({ ...m, examDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-slate-500 text-sm">Extracting slide content…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-slate-700">Drop your .pptx files here</p>
              <p className="text-slate-400 text-sm mt-1">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-slate-800 mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h2>
          <div className="space-y-3">
            {uploadedFiles.map(file => (
              <div key={file.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-brand-600 font-medium">{file.courseName}</span>
                      <span className="text-xs text-slate-400">{file.slideCount} slides</span>
                      {file.examDate && (
                        <span className="text-xs text-slate-400">
                          Exam: {new Date(file.examDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === file.id ? null : file.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      title="Preview slides"
                    >
                      {expandedId === file.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeUploadedFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Slide preview */}
                {expandedId === file.id && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 max-h-72 overflow-y-auto">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Extracted Slide Content</p>
                    <div className="space-y-2">
                      {file.slides.map(slide => (
                        <div key={slide.slideNumber} className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                          <p className="text-xs font-semibold text-brand-600 mb-1">Slide {slide.slideNumber}</p>
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
        <p className="text-center text-slate-400 text-sm mt-8">No files uploaded yet. Start by uploading your class PowerPoints above.</p>
      )}
    </div>
  )
}
