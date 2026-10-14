// Discreet brand credit on every served guest invitation. Server-rendered
// follow link so shared couple subdomains pass discovery + authority to the
// marketing site. Kept tiny and translucent to never fight the invitation
// design; wrapper ignores pointer events except the link itself.
export default function InvitationCredit() {
  return (
    <div
      aria-hidden={false}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 6,
        zIndex: 60,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <a
        href="https://wedding.aksaraa.com/"
        title="Buat undangan pernikahan digital di Aksaraa Wedding"
        style={{
          pointerEvents: "auto",
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.08em",
          color: "rgba(120, 113, 108, 0.85)",
          background: "rgba(255, 255, 255, 0.65)",
          padding: "3px 10px",
          borderRadius: "999px",
          textDecoration: "none",
        }}
      >
        Undangan Pernikahan Digital oleh Aksaraa
      </a>
    </div>
  )
}
