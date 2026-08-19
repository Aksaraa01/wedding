"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type ElementNode = {
  id: string
  elType: string
  widgetType: string | null
  settings: Record<string, any>
  settings_keys?: string[]
  _preview?: string
  children: ElementNode[]
}

type Popup = { popup_title: string; popup_id: number; elements: ElementNode[] }

const EXCLUDED_WIDGETS = new Set(["spacer", "divider", "icon", "icon-box"])

function isMappable(el: ElementNode, allowContainers: boolean): boolean {
  const preview = el._preview || ""
  const isWidget = !!el.widgetType
  const excluded = isWidget && EXCLUDED_WIDGETS.has(el.widgetType!)
  // Section/container that should be targetable (e.g. a whole gift section to hide).
  if (!isWidget && allowContainers && (el.elType === "section" || el.elType === "container")) return true
  if (isWidget && !excluded) return true
  if (!isWidget && (preview.startsWith("bg: ") || preview.startsWith("slideshow"))) return true
  return false
}

function elementLabel(el: ElementNode): string {
  return `${el.id} · ${el.widgetType || el.elType}${el._preview ? ` — ${el._preview}` : ""}`
}

function searchableText(el: ElementNode): string {
  // Only human-readable text — element id / widget type / el type / preview.
  // settings_keys are excluded so internal keys like `eae_slider_cover` don't
  // make unrelated elements match searches like "cover".
  return [el.id, el.widgetType || "", el.elType || "", el._preview || ""].join(" ").toLowerCase()
}

export default function ElementSelect({
  value,
  onChange,
  elements,
  popups,
  usedIds,
  placeholder = "— pilih elemen —",
  allowContainers = false,
}: {
  value: string
  onChange: (id: string) => void
  elements: ElementNode[]
  popups: Popup[]
  usedIds: Set<string>
  placeholder?: string
  allowContainers?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Flatten all elements (id -> node) for label lookup + search results.
  const flatById = useMemo(() => {
    const map = new Map<string, ElementNode>()
    const walk = (nodes: ElementNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n)
        if (n.children?.length) walk(n.children)
      }
    }
    walk(elements)
    for (const p of popups) walk(p.elements)
    return map
  }, [elements, popups])

  const current = value ? flatById.get(value) : null
  const currentLabel = current ? elementLabel(current) : null

  const q = search.trim().toLowerCase()
  // An element may be selected here only if it's the current value of this
  // dropdown or it's not mapped to another field yet. Mapped-elsewhere elements
  // are hidden entirely (tree + search) so they can't be double-mapped.
  const isSelectable = (id: string) => id === value || !usedIds.has(id)

  const Row = ({ id, indent }: { id: string; indent: number }) => {
    const el = flatById.get(id)!
    return (
      <button
        type="button"
        onClick={() => {
          onChange(id)
          setOpen(false)
          setSearch("")
        }}
        title={elementLabel(el)}
        className={`w-full text-left px-2 py-1 font-mono text-[10px] border-b border-outline-variant/20 truncate ${
          id === value ? "bg-primary text-on-primary" : "hover:bg-surface-container-high cursor-pointer"
        }`}
        style={{ paddingLeft: 8 + indent * 14 }}
      >
        {elementLabel(el)}
      </button>
    )
  }

  // Non-search mode: render the tree, showing containers as group headers and
  // only displaying subtrees that contain at least one selectable element.
  const renderTree = (nodes: ElementNode[], indent: number): React.ReactNode => {
    return nodes.map((n) => {
      const mappable = isMappable(n, allowContainers)
      const kids = n.children?.length ? renderTree(n.children, indent + 1) : null
      const kidsNonEmpty = Array.isArray(kids) && kids.some((k) => k !== null)
      if (mappable && !isSelectable(n.id)) return kids || null
      return (
        <div key={n.id}>
          {mappable ? <Row id={n.id} indent={indent} /> : kidsNonEmpty ? (
            <div
              className="px-2 py-1 font-label-md text-[9px] uppercase tracking-wider text-secondary font-semibold bg-surface-container-lowest border-b border-outline-variant/20"
              style={{ paddingLeft: 8 + indent * 14 }}
            >
              ▣ {elementLabel(n)}
            </div>
          ) : null}
          {kids}
        </div>
      )
    })
  }

  // Search mode: walk tree and collect every node whose text matches the query
  // and is still selectable (not mapped to another field).
  const searchHits = useMemo(() => {
    if (!q) return []
    const hits: { id: string; indent: number }[] = []
    const walk = (nodes: ElementNode[], indent: number) => {
      for (const n of nodes) {
        if (isMappable(n, allowContainers) && isSelectable(n.id) && searchableText(n).includes(q)) hits.push({ id: n.id, indent })
        if (n.children?.length) walk(n.children, indent + 1)
      }
    }
    walk(elements, 0)
    for (const p of popups) walk(p.elements, 0)
    return hits
  }, [q, elements, popups, allowContainers])

  const renderSource = (title: string, nodes: ElementNode[]) => {
    if (q) {
      const hits = searchHitsFor(nodes)
      if (hits.length === 0) return null
      return (
        <div>
          <div className="px-2 py-1 font-label-md text-[9px] uppercase tracking-wider text-on-surface-variant bg-surface-container-low">{title}</div>
          {hits.map((h) => (
            <Row key={h.id} id={h.id} indent={h.indent} />
          ))}
        </div>
      )
    }
    return (
      <div>
        <div className="px-2 py-1 font-label-md text-[9px] uppercase tracking-wider text-on-surface-variant bg-surface-container-low">{title}</div>
        {renderTree(nodes, 0)}
      </div>
    )
  }

  const searchHitsFor = (nodes: ElementNode[]) => {
    const hits: { id: string; indent: number }[] = []
    const walk = (list: ElementNode[], indent: number) => {
      for (const n of list) {
        if (isMappable(n, allowContainers) && isSelectable(n.id) && searchableText(n).includes(q)) hits.push({ id: n.id, indent })
        if (n.children?.length) walk(n.children, indent + 1)
      }
    }
    walk(nodes, 0)
    return hits
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          setSearch("")
        }}
        className="w-full text-left border border-outline-variant px-1.5 py-1 bg-background font-mono text-[10px] flex items-center justify-between gap-1 hover:border-secondary transition-colors"
      >
        <span className={`truncate ${currentLabel ? "" : "text-on-surface-variant/50"}`}>{currentLabel || placeholder}</span>
        <span className="material-symbols-outlined text-[12px] shrink-0 text-on-surface-variant">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-outline-variant shadow-lg max-h-72 overflow-y-auto">
          <div className="sticky top-0 bg-surface p-1.5 border-b border-outline-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant shrink-0">search</span>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari elemen / container..."
              className="w-full bg-transparent border-none outline-none text-[11px] font-body-md py-0.5"
            />
          </div>
          {renderSource("Post", elements)}
          {popups.map((p) => renderSource(`Popup: ${p.popup_title}`, p.elements))}
          {(elements.length === 0 && popups.length === 0) || (q && searchHits.length === 0) ? (
            <p className="px-2 py-2 text-[10px] text-on-surface-variant/50">{q ? "Tidak ada elemen yang cocok." : "Belum ada elemen."}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
