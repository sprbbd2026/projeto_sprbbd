import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { SatellitePoint } from '../../services/satelliteService'
import { ALL_SATELLITES_LABEL, ALL_SATELLITES_VALUE } from '../../utils/satelliteConstants'
import styles from './SatelliteSearchSelect.module.css'

export type SatelliteSearchSelectProps = {
  options: SatellitePoint[]
  value: string
  onChange: (satelliteId: string) => void
  labelFor: (sat: SatellitePoint) => string
  placeholder?: string
  disabled?: boolean
  showAllOption?: boolean
}

export function SatelliteSearchSelect({
  options,
  value,
  onChange,
  labelFor,
  placeholder = 'Pesquisar ou selecionar satélite…',
  disabled = false,
  showAllOption = false,
}: SatelliteSearchSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((sat) => String(sat.sat_id) === value)
  const isAll = value === ALL_SATELLITES_VALUE

  useEffect(() => {
    if (isAll) {
      setQuery(ALL_SATELLITES_LABEL)
      return
    }
    if (selected) {
      setQuery(labelFor(selected))
    } else if (!value) {
      setQuery('')
    }
  }, [selected, value, labelFor, isAll])

  const selectedLabel = isAll
    ? ALL_SATELLITES_LABEL
    : selected
      ? labelFor(selected)
      : ''

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const selectedTerm = selectedLabel.trim().toLowerCase()

    // Mantém todos os satélites visíveis ao abrir ou quando o texto é o rótulo selecionado
    if (!term || term === selectedTerm) return options

    return options.filter((sat) => labelFor(sat).toLowerCase().includes(term))
  }, [options, query, labelFor, selectedLabel])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        if (isAll) setQuery(ALL_SATELLITES_LABEL)
        else if (selected) setQuery(labelFor(selected))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selected, labelFor, isAll])

  function pick(sat: SatellitePoint) {
    onChange(String(sat.sat_id))
    setQuery(labelFor(sat))
    setOpen(false)
  }

  function pickAll() {
    onChange(ALL_SATELLITES_VALUE)
    setQuery(ALL_SATELLITES_LABEL)
    setOpen(false)
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.inputWrap}>
        <Search size={16} className={styles.searchIcon} aria-hidden />
        <input
          id="satelite-rota"
          className={styles.input}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          list={listId}
          value={query}
          placeholder={placeholder}
          disabled={disabled || options.length === 0}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              if (isAll) setQuery(ALL_SATELLITES_LABEL)
              else if (selected) setQuery(labelFor(selected))
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              if (showAllOption && query.toLowerCase().includes('todos')) {
                pickAll()
                return
              }
              if (filtered.length > 0) pick(filtered[0])
            }
          }}
        />
        <button
          type="button"
          className={styles.toggleBtn}
          aria-label="Abrir lista de satélites"
          disabled={disabled || options.length === 0}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {open && (
        <ul id={listId} className={styles.listbox} role="listbox">
          {showAllOption && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={isAll}
                className={`${styles.option} ${styles.optionAll} ${isAll ? styles.optionSelected : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={pickAll}
              >
                {ALL_SATELLITES_LABEL}
              </button>
            </li>
          )}
          {filtered.map((sat) => {
            const id = String(sat.sat_id)
            const isSelected = id === value
            return (
              <li key={id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(sat)}
                >
                  {labelFor(sat)}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {open && filtered.length === 0 && !showAllOption && (
        <div className={styles.emptyList}>Nenhum satélite encontrado.</div>
      )}
    </div>
  )
}
