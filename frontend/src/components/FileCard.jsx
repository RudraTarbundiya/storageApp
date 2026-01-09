"use client"

export default function FileCard({ item, onSelect, onDelete, onRename, isFile }) {
  const getFileIcon = (extension) => {
    const ext = extension?.toLowerCase() || ""
    if ([".pdf"].includes(ext)) return "📄"
    if ([".doc", ".docx"].includes(ext)) return "📝"
    if ([".xls", ".xlsx", ".csv"].includes(ext)) return "📊"
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) return "🖼️"
    if ([".mp4", ".mov", ".avi"].includes(ext)) return "🎬"
    if ([".mp3", ".wav", ".flac"].includes(ext)) return "🎵"
    if ([".zip", ".rar", ".7z"].includes(ext)) return "📦"
    return "📄"
  }

  return (
    <div className="group bg-surface hover:bg-surface-hover border border-border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onSelect(item)}>
          <div className="text-2xl flex-shrink-0">{isFile ? getFileIcon(item.extension) : "📁"}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary truncate">{item.name}</p>
            {isFile && <p className="text-sm text-text-secondary">{item.extension || "File"}</p>}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isFile ? (
            <>
              <a
                href={`http://localhost:4000/file/${item._id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 hover:bg-surface hover:text-primary rounded transition-colors"
                title="Preview"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3c-4.5 0-8 3.5-9 7 1 3.5 4.5 7 9 7s8-3.5 9-7c-1-3.5-4.5-7-9-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                </svg>
              </a>
              <a
                href={`http://localhost:4000/file/${item._id}?action=download`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 hover:bg-surface hover:text-primary rounded transition-colors"
                title="Download"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 14a2 2 0 012-2h2v2H5v2h10v-2h-2v-2h2a2 2 0 012 2v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm7-12a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4A1 1 0 115.707 8.293L8 10.586V3a1 1 0 011-1z"/>
                </svg>
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRename(item)
                }}
                className="p-1.5 hover:bg-primary hover:text-white rounded transition-colors"
                title="Rename"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item)
                }}
                className="p-1.5 hover:bg-error hover:text-white rounded transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          ) : (
            // Folder actions: currently only Delete
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item)
              }}
              className="p-1.5 hover:bg-error hover:text-white rounded transition-colors"
              title="Delete folder"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
