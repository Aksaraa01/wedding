"use client"

import { useParams } from "next/navigation"
import AntrianDetail from "@/components/ops/AntrianDetail"

export default function AntrianDetailPage() {
  const params = useParams<{ id: string }>()
  return <AntrianDetail id={params.id} />
}