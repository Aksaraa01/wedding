"use client"

import { useEffect } from "react"

export default function CustomCursor() {
  useEffect(() => {
    const cursor = document.createElement("div")
    cursor.id = "cursor"
    cursor.className = "custom-cursor hidden md:block"
    cursor.style.cssText =
      "transform: translate(-50%, -50%) scale(1); background-color: transparent; position: fixed; width: 24px; height: 24px; border: 1px solid #f2ca50; border-radius: 50%; pointer-events: none; z-index: 9999; transition: transform 0.2s, background-color 0.2s;"
    document.body.appendChild(cursor)

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth > 768) {
        cursor.style.left = e.clientX + "px"
        cursor.style.top = e.clientY + "px"
      }
    }

    const handleMouseEnter = () => {
      if (window.innerWidth > 768) {
        cursor.style.transform = "translate(-50%, -50%) scale(2.5)"
        cursor.style.backgroundColor = "rgba(242, 202, 80, 0.15)"
        cursor.style.borderColor = "#f2ca50"
      }
    }

    const handleMouseLeave = () => {
      if (window.innerWidth > 768) {
        cursor.style.transform = "translate(-50%, -50%) scale(1)"
        cursor.style.backgroundColor = "transparent"
        cursor.style.borderColor = "#f2ca50"
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter)
      el.addEventListener("mouseleave", handleMouseLeave)
    })

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.querySelectorAll("a, button").forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter)
        el.removeEventListener("mouseleave", handleMouseLeave)
      })
      cursor.remove()
    }
  }, [])

  return null
}
