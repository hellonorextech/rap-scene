"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { name: "Home", href: "/" },
    { name: "Charts", href: "/charts" },
    { name: "Artists", href: "/artists" },
    { name: "Albums", href: "/albums" },
    { name: "News", href: "/news" },
    { name: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-[9999] border-b border-black bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">

        {/* LOGO */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 items-center"
        >
          <Image
            src="/images/logo.png"
            alt="RAP SCENE"
            width={200}
            height={70}
            className="h-12 w-auto object-contain sm:h-14"
            priority
          />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-black uppercase tracking-wide text-black transition hover:underline"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black md:hidden"
        >
          <span className="relative block h-5 w-5">

            {/* TOP */}
            <span
              className={`absolute left-0 top-1 block h-0.5 w-5 bg-black transition-transform duration-200 ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />

            {/* MIDDLE */}
            <span
              className={`absolute left-0 top-2.5 block h-0.5 w-5 bg-black transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />

            {/* BOTTOM */}
            <span
              className={`absolute left-0 top-4 block h-0.5 w-5 bg-black transition-transform duration-200 ${
                menuOpen ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />

          </span>
        </button>
      </div>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <div className="border-t border-black bg-white md:hidden">
          <nav className="mx-auto max-w-7xl">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block border-b border-black px-5 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}