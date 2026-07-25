export default function BackgroundElements() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(#1a1a1a 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <div className="artistic-frame fixed top-0 left-edge-margin-desktop bottom-0 w-[1px] hidden md:block bg-on-surface/5" />
      <div className="artistic-frame fixed top-0 right-edge-margin-desktop bottom-0 w-[1px] hidden md:block bg-on-surface/5" />
      <div className="artistic-frame absolute top-[80px] md:top-[100px] left-0 right-0 h-[1px] opacity-20 bg-on-surface" />
    </>
  )
}