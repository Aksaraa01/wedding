export default function BackgroundElements() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(#f2ca50 0.5px, transparent 0.5px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#131315]/20 to-[#131315]" />
      </div>
    </>
  )
}
