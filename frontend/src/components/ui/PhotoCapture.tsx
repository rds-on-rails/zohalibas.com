'use client'

import React from 'react'

type PhotoCaptureProps = {
  label?: string
  onFileSelected: (file: File | null) => void
  value?: File | null
}

export default function PhotoCapture({ label = 'Add Photo', onFileSelected, value }: PhotoCaptureProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />
        {value ? (
          <span className="text-xs text-gray-500 truncate max-w-[160px]">{value.name}</span>
        ) : null}
      </div>
    </div>
  )
}


