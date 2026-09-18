import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Chart = {
  id: string;
  name: string;
  chart_date: string;
};

type ChartEntry = {
  id: string;
  rank: number;
  last_week_rank: number | null;
  peak_rank: number | null;
  weeks_on_chart: number;
  songs:
    | {
        title: string;
        slug: string;
        cover_url: string | null;
        artists:
          | {
              name: string;
              slug: string;
            }
          | null;
      }
    | null;
};

function getMovement(
  rank: number,
  lastWeekRank: number | null
): {
  type: "up" | "down" | "same" | "new";
  value: number | null;
} {
  if (lastWeekRank === null) {
    return {
      type: "new",
      value: null,
    };
  }

  if (rank < lastWeekRank) {
    return {
      type: "up",
      value: lastWeekRank - rank,
    };
  }

  if (rank > lastWeekRank) {
    return {
      type: "down",
      value: rank - lastWeekRank,
    };
  }

  return {
    type: "same",
    value: 0,
  };
}

function formatChartDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ChartsPage() {
  const supabase = await createClient();

  const { data: chart, error: chartError } = await supabase
    .from("charts")
    .select("id, name, chart_date")
    .eq("name", "RAP SCENE TOP 50")
    .order("chart_date", { ascending: false })
    .limit(1)
    .maybeSingle<Chart>();

  let entries: ChartEntry[] = [];
  let entriesError: string | null = null;

  if (chart) {
    const { data, error } = await supabase
      .from("chart_entries")
      .select(
        `
        id,
        rank,
        last_week_rank,
        peak_rank,
        weeks_on_chart,
        songs (
          title,
          slug,
          cover_url,
          artists (
            name,
            slug
          )
        )
      `
      )
      .eq("chart_id", chart.id)
      .order("rank", { ascending: true });

    if (error) {
      entriesError = error.message;
    } else {
      entries = (data ?? []) as unknown as ChartEntry[];
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">
      

      {/* TITLE */}
      <section className="border-b border-black bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-gray-500">
            RAP SCENE CHARTS
          </p>

          <h1 className="text-5xl font-black uppercase leading-none tracking-[-0.06em] sm:text-7xl">
            TOP 50
          </h1>

          {chart && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold uppercase">
              <span>
                Week of {formatChartDate(chart.chart_date)}
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-black sm:block" />

              <span>{entries.length} Songs</span>
            </div>
          )}
        </div>
      </section>

      {/* ERROR */}
      {chartError && (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="border border-red-300 bg-red-50 p-5 text-sm text-red-700">
            Unable to load the chart.
          </div>
        </section>
      )}

      {entriesError && (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="border border-red-300 bg-red-50 p-5 text-sm text-red-700">
            Unable to load chart entries.
          </div>
        </section>
      )}

      {/* NO CHART */}
      {!chart && !chartError && (
        <section className="mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
            No chart available yet.
          </p>
        </section>
      )}

      {/* CHART */}
      {chart && entries.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-8 sm:py-12">
          {/* DESKTOP HEADER */}
          <div className="mb-2 hidden grid-cols-[80px_minmax(0,1fr)_100px_100px_100px_110px] gap-4 border-b-2 border-black px-5 py-4 text-xs font-black uppercase tracking-widest md:grid">
            <span>Rank</span>
            <span>Song</span>
            <span>Last Week</span>
            <span>Peak</span>
            <span>Weeks</span>
            <span>Movement</span>
          </div>

          <div className="divide-y divide-gray-200 border-t border-black">
            {entries.map((entry) => {
              const movement = getMovement(
                entry.rank,
                entry.last_week_rank
              );

              const song = entry.songs;
              const artist = song?.artists;

              return (
                <article
                  key={entry.id}
                  className="grid grid-cols-1 gap-4 px-4 py-5 transition hover:bg-gray-50 md:grid-cols-[80px_minmax(0,1fr)_100px_100px_100px_110px] md:items-center md:gap-4 md:px-5"
                >
                  {/* RANK */}
                  <div className="flex items-center gap-4 md:block">
                    <span className="text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">
                      {String(entry.rank).padStart(2, "0")}
                    </span>

                    <div className="md:hidden">
                      {movement.type === "new" && (
                        <span className="inline-flex bg-black px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                          NEW
                        </span>
                      )}

                      {movement.type === "up" && (
                        <span className="text-xs font-black uppercase">
                          ↑ {movement.value}
                        </span>
                      )}

                      {movement.type === "down" && (
                        <span className="text-xs font-black uppercase">
                          ↓ {movement.value}
                        </span>
                      )}

                      {movement.type === "same" && (
                        <span className="text-xs font-black uppercase text-gray-400">
                          — 0
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SONG */}
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden bg-gray-100 sm:h-20 sm:w-20">
                      {song?.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black text-[10px] font-black uppercase text-white">
                          RAP
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      {song ? (
                        <Link
                          href={`/songs/${song.slug}`}
                          className="block truncate text-lg font-black uppercase tracking-tight transition hover:underline sm:text-xl"
                        >
                          {song.title}
                        </Link>
                      ) : (
                        <span className="text-lg font-black uppercase">
                          Unknown Song
                        </span>
                      )}

                      {artist ? (
                        <Link
                          href={`/artists/${artist.slug}`}
                          className="mt-1 block truncate text-sm font-bold text-gray-500 transition hover:text-black hover:underline"
                        >
                          {artist.name}
                        </Link>
                      ) : (
                        <span className="mt-1 block text-sm text-gray-500">
                          Unknown Artist
                        </span>
                      )}
                    </div>
                  </div>

                  {/* LAST WEEK */}
                  <div className="hidden md:block">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Last Week
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {entry.last_week_rank === null
                        ? "—"
                        : `#${String(entry.last_week_rank).padStart(2, "0")}`}
                    </p>
                  </div>

                  {/* PEAK */}
                  <div className="hidden md:block">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Peak
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {entry.peak_rank === null
                        ? "—"
                        : `#${String(entry.peak_rank).padStart(2, "0")}`}
                    </p>
                  </div>

                  {/* WEEKS */}
                  <div className="hidden md:block">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Weeks
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {entry.weeks_on_chart}
                    </p>
                  </div>

                  {/* MOVEMENT */}
                  <div className="hidden md:block">
                    {movement.type === "new" && (
                      <span className="inline-flex bg-black px-3 py-2 text-xs font-black uppercase tracking-wider text-white">
                        NEW
                      </span>
                    )}

                    {movement.type === "up" && (
                      <span className="text-sm font-black uppercase">
                        ↑ {movement.value}
                      </span>
                    )}

                    {movement.type === "down" && (
                      <span className="text-sm font-black uppercase">
                        ↓ {movement.value}
                      </span>
                    )}

                    {movement.type === "same" && (
                      <span className="text-sm font-black uppercase text-gray-400">
                        — 0
                      </span>
                    )}
                  </div>

                  {/* MOBILE DETAILS */}
                  <div className="grid grid-cols-3 gap-3 border-t border-gray-200 pt-4 md:hidden">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Last Week
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {entry.last_week_rank === null
                          ? "—"
                          : `#${String(entry.last_week_rank).padStart(
                              2,
                              "0"
                            )}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Peak
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {entry.peak_rank === null
                          ? "—"
                          : `#${String(entry.peak_rank).padStart(2, "0")}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Weeks
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {entry.weeks_on_chart}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* EMPTY ENTRIES */}
      {chart && entries.length === 0 && !entriesError && (
        <section className="mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
            This chart has no songs yet.
          </p>
        </section>
      )}

      {/* FOOTER */}
      <footer className="mt-12 border-t border-black bg-black px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-black tracking-[-0.04em]">
              RAP SCENE
            </p>

            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              Filipino Rap & Hip-Hop
            </p>
          </div>

          <Link
            href="/"
            className="text-xs font-black uppercase tracking-widest transition hover:text-gray-300"
          >
            Back to Home →
          </Link>
        </div>
      </footer>
    </main>
  );
}