export default function Footer() {
  return (
    <footer className="bg-white border-t border-outline-variant/20 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-edge-margin-mobile md:px-edge-margin-desktop py-16 md:py-20 max-w-container-max mx-auto gap-12 md:gap-0">
        <div className="flex flex-col gap-6 items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-1">
            <span className="font-headline-lg text-[32px] md:text-headline-lg text-on-surface">
              Aksaraa.
            </span>
            <div className="w-2 h-2 bg-secondary rounded-full mt-3 md:mt-4" />
          </div>
          <p className="font-body-md text-sm md:text-body-md text-on-surface/60 max-w-xs">
            Merajut janji menjadi cerita digital yang abadi. Crafted for
            Lifetime Memories.
          </p>
          <p className="font-label-md text-[10px] md:text-[11px] uppercase tracking-widest text-on-surface/40">
            &copy; 2026 Aksaraa Wedding Group.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16 font-label-md text-[10px] md:text-label-md uppercase tracking-[0.2em]">
          <a
            className="text-on-surface/70 hover:text-secondary transition-colors"
            href="#"
          >
            Kebijakan Privasi
          </a>
          <a
            className="text-on-surface/70 hover:text-secondary transition-colors"
            href="#"
          >
            Syarat &amp; Ketentuan
          </a>
          <a
            className="text-on-surface/70 hover:text-secondary transition-colors"
            href="#"
          >
            Kontak
          </a>
        </div>
        <div className="flex gap-4">
          <a
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-on-surface hover:text-background transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">language</span>
          </a>
          <a
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-on-surface hover:text-background transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">mail</span>
          </a>
        </div>
      </div>
    </footer>
  )
}