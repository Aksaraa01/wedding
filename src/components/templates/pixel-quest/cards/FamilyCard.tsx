"use client"

import { FONT_PIXEL } from "../../shared/Skin"
import CardShell from "./CardShell"

export default function FamilyCard({ families, onHide }: { families: string[]; onHide: () => void }) {
  if (!families || families.length === 0) return null
  return (
    <CardShell icon="family_restroom" eyebrow="STOP 2: KELUARGA BESAR" title="Turut Mengundang" badge="HONORS" onHide={onHide}>
      <div className="rounded-xl bg-[#090e1c]/90 border border-cyan-400/40 p-2.5">
        <div className="space-y-1 text-[11px] text-slate-200">
          {families.map((f, i) => (
            <p key={i}>• {f}</p>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-[#090e1c]/90 border border-dashed border-cyan-400/40 p-2 text-center">
        <p className="italic text-[10.5px] text-slate-300">
          &ldquo;Merupakan kehormatan &amp; kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.&rdquo;
        </p>
      </div>
    </CardShell>
  )
}