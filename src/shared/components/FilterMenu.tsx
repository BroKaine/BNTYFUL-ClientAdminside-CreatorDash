import { Check, ChevronDown, X } from 'lucide-react';
import type { TaxonomyOption } from '@/shared/lib/taxonomy';

interface FilterMenuProps {
  label: string;
  options: TaxonomyOption[];
  selected: string[];
  onChange(values: string[]): void;
}

export function FilterMenu({ label, options, selected, onChange }: FilterMenuProps) {
  const toggle = (key: string) => onChange(selected.includes(key) ? selected.filter(value => value !== key) : [...selected, key]);
  return (
    <details className="filter-menu">
      <summary className={selected.length ? 'filter-menu__trigger is-active' : 'filter-menu__trigger'}>
        {label}
        {selected.length > 0 && <span className="count-dot">{selected.length}</span>}
        <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <div className="filter-menu__popover">
        <div className="filter-menu__actions">
          <span>{options.length} available</span>
          {selected.length > 0 && <button type="button" onClick={() => onChange([])}><X size={12} /> Clear</button>}
        </div>
        <div className="filter-menu__options">
          {options.length === 0 ? <p className="empty-inline">No values in this list</p> : options.map(option => (
            <label key={option.key} className="filter-option">
              <input type="checkbox" checked={selected.includes(option.key)} onChange={() => toggle(option.key)} />
              <span className="filter-option__check"><Check size={12} /></span>
              <span title={option.label}>{option.label}</span>
              <small>{option.count}</small>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}
