'use client'

import { useState } from 'react'

interface Props {
  onChange: (range: { from: string; to: string }) => void
}

export default function DateRangePicker({ onChange }: Props) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const handleChange = () => {
    if (from && to) onChange({ from, to })
  }

  return (
    <div className="flex gap-2 items-center">
      <input 
        type="date" 
        value={from} 
        onChange={e => setFrom(e.target.value)} 
        onBlur={handleChange}
        className="border px-2 py-1 rounded"
      />
      <span>-</span>
      <input 
        type="date" 
        value={to} 
        onChange={e => setTo(e.target.value)} 
        onBlur={handleChange}
        className="border px-2 py-1 rounded"
      />
    </div>
  )
}
