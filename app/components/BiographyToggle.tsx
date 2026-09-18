"use client";

import { useState } from "react";

type BiographyToggleProps = {
  biography: string;
};

export default function BiographyToggle({
  biography,
}: BiographyToggleProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-5 max-w-3xl md:mt-6">
      <p
        className={`whitespace-pre-line text-sm leading-6 text-neutral-700 md:text-base md:leading-7 ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {biography}
      </p>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mt-4 border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:px-5 sm:py-3 sm:text-xs"
      >
        {expanded ? "Read Less ←" : "Read More →"}
      </button>
    </div>
  );
}