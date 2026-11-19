"use client"

import type { CSSProperties } from "react"

export type OrnNode = {
  cls?: string
  aos?: string
  dur?: number
  delay?: number
  img?: string
  w?: number
  h?: number
  children?: OrnNode[]
}

// Decorative art lives next to the component on the public origin; every file
// was vendored from the reference's own ornament set and re-encoded to WebP.
export function ornAsset(name: string): string {
  return `/templates/swan-garden/${name.replace(/\.(png|jpe?g)$/i, ".webp")}`
}

export function Orn({ node, eager = false }: { node: OrnNode; eager?: boolean }) {
  if (node.img) {
    return (
      <img
        src={ornAsset(node.img)}
        alt=""
        aria-hidden="true"
        width={node.w || undefined}
        height={node.h || undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
      />
    )
  }
  const style =
    node.dur || node.delay
      ? ({
          ["--aos-duration" as string]: `${node.dur || 900}ms`,
          ["--aos-delay" as string]: `${node.delay || 0}ms`,
        } as CSSProperties)
      : undefined
  return (
    <div className={node.cls} data-aos={node.aos} style={style}>
      {node.children?.map((child, i) => (
        <Orn key={i} node={child} eager={eager} />
      ))}
    </div>
  )
}

// One ornament layer. The reference wraps each group in `.ornaments-wrapper`
// (absolute, inset 0); children keep their own reference classes so the
// vendored CSS places them exactly where the design drew them.
export function Backdrop({ items, eager = false }: { items: OrnNode[]; eager?: boolean }) {
  return (
    <div className="ornaments-wrapper" aria-hidden="true">
      {items.map((node, i) => (
        <Orn key={i} node={node} eager={eager} />
      ))}
    </div>
  )
}
