import { createSignal } from 'solid-js';

interface NavProps {
  currentSection: 'alchemy' | 'enchanting' | 'home';
}

export default function Nav(props: NavProps) {
  const [open, setOpen] = createSignal(false);

  const links: { section: NavProps['currentSection']; label: string; href: string }[] = [
    { section: 'alchemy', label: '⚗ Alchemy', href: '/skyrim/alchemy' },
    { section: 'enchanting', label: '✨ Enchanting', href: '/skyrim/enchanting' },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        class="nav-hamburger"
        aria-label="Open navigation menu"
        aria-expanded={open()}
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      {/* Overlay backdrop (mobile) */}
      <div
        class={`nav-overlay${open() ? ' visible' : ''}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Slide-out sidebar (mobile) */}
      <nav class={`nav-sidebar${open() ? ' open' : ''}`} aria-label="Main navigation">
        {links.map((link) => (
          <a
            href={link.href}
            class={`nav-link${props.currentSection === link.section ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Desktop horizontal strip */}
      <nav class="nav-desktop" aria-label="Main navigation">
        {links.map((link) => (
          <a
            href={link.href}
            class={`nav-link${props.currentSection === link.section ? ' active' : ''}`}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </>
  );
}
