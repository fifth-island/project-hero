import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReportViewerProps {
  reportPath: string        // e.g. '/reports/Q3.md'
  title: string             // e.g. 'Q3 — Distribution Analysis'
  onClose: () => void
}

export default function ReportViewer({ reportPath, title, onClose }: ReportViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setContent(null)
    setError(false)
    fetch(reportPath)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.text()
      })
      .then(text => setContent(text))
      .catch(() => setError(true))
  }, [reportPath])

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10 overflow-y-auto"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#6f070f] text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              description
            </span>
            <h2 className="font-bold text-lg leading-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Close report"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 overflow-x-auto">
          {!content && !error && (
            <div className="flex items-center justify-center py-24 text-stone-400">
              <span className="material-symbols-outlined animate-spin text-4xl mr-3">progress_activity</span>
              Loading report…
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-24 text-stone-400 gap-3">
              <span className="material-symbols-outlined text-5xl">error</span>
              <p>Could not load the report. Please try again later.</p>
            </div>
          )}
          {content && (
            <article className="prose prose-stone max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-[#6f070f] prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-table:text-sm prose-code:text-[#6f070f] prose-code:bg-stone-100 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt }) => {
                    // Resolve figure paths relative to /reports/
                    const resolvedSrc = src?.startsWith('./') ? `/reports/${src.slice(2)}` : src
                    return (
                      <img
                        src={resolvedSrc}
                        alt={alt ?? ''}
                        className="rounded-xl shadow-md mx-auto my-6 max-w-full"
                        loading="lazy"
                      />
                    )
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-8 py-4 flex justify-between items-center text-xs text-stone-400 rounded-b-2xl">
          <span>Chinatown HEROS — Boston, MA · July–August 2023</span>
          <button
            onClick={onClose}
            className="text-[#6f070f] font-semibold uppercase tracking-widest text-xs hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
