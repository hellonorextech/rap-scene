import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type TrendingArtist = {
  id: string;
  rank: number;
  score: number;
  chart_date: string;
  artists: {
    name: string;
    slug: string;
    photo_url: string | null;
    biography: string | null;
  } | null;
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ArtistsPage() {
  const supabase = await createClient();

  /*
   * Find the newest trending date.
   */
  const { data: latestDate } = await supabase
    .from("artist_trending")
    .select("chart_date")
    .order("chart_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let trendingArtists: TrendingArtist[] = [];

  if (latestDate) {
    const { data } = await supabase
      .from("artist_trending")
      .select(
        `
        id,
        rank,
        score,
        chart_date,
        artists (
          name,
          slug,
          photo_url,
          biography
        )
      `,
      )
      .eq("chart_date", latestDate.chart_date)
      .order("rank", { ascending: true });

    trendingArtists = (data ?? []) as unknown as TrendingArtist[];
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-black">
      

      {/* TITLE */}
      <section className="border-b border-black">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10 md:px-8 md:py-16">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500 sm:text-xs sm:tracking-[0.3em]">
            Artist Rankings
          </p>

          <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-8xl">
            Trending Artists
          </h1>

          {latestDate && (
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider sm:mt-5 sm:text-sm">
              Week of {formatDate(latestDate.chart_date)}
            </p>
          )}
        </div>
      </section>

      {/* ARTISTS */}
      {trendingArtists.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8">
          <p className="text-sm font-black uppercase">
            No trending artists available.
          </p>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-2">
            {trendingArtists.map((artist) => {
              const artistData = artist.artists;

              return (
                <article
                  key={artist.id}
                  className="min-w-0 border-b border-black p-3 sm:p-5 md:border-r md:p-8"
                >
                  {/* RANK */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-3xl font-black leading-none tracking-tighter sm:text-5xl md:text-7xl">
                      #{String(artist.rank).padStart(2, "0")}
                    </span>

                    <span className="hidden border border-black px-2 py-1 text-[8px] font-black uppercase tracking-wider sm:block sm:px-3 sm:py-2 sm:text-[10px]">
                      Trending
                    </span>
                  </div>

                  {/* PHOTO */}
                  <div className="mt-3 aspect-square overflow-hidden bg-neutral-200 sm:mt-5 md:mt-8 md:aspect-[4/3]">
                    {artistData?.photo_url ? (
                      <Image
                        src={artistData.photo_url}
                        alt={artistData.name}
                        width={1000}
                        height={750}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-black px-2 text-center text-sm font-black uppercase text-white sm:text-xl">
                        RAP SCENE
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="mt-3 sm:mt-5 md:mt-6">
                    {artistData ? (
                      <Link
                        href={`/artists/${artistData.slug}`}
                        className="block text-base font-black uppercase leading-tight tracking-tight hover:underline sm:text-2xl md:text-4xl"
                      >
                        {artistData.name}
                      </Link>
                    ) : (
                      <h2 className="text-base font-black uppercase leading-tight tracking-tight sm:text-2xl md:text-4xl">
                        Unknown Artist
                      </h2>
                    )}

                    {/* BIOGRAPHY
                        Hidden on mobile to keep the cards compact.
                        Limited to 3 lines on desktop.
                    */}
                    {artistData?.biography && (
                      <p
                        className="mt-3 hidden max-w-xl text-sm leading-6 text-neutral-600 md:block"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {artistData.biography}
                      </p>
                    )}

                    {/* SCORE */}
                    <div className="mt-3 flex items-center justify-between border-t border-black pt-3 sm:mt-5 sm:pt-4">
                      <span className="text-[8px] font-black uppercase tracking-wider text-neutral-500 sm:text-[10px]">
                        Score
                      </span>

                      <span className="text-xl font-black sm:text-2xl md:text-3xl">
                        {artist.score}
                      </span>
                    </div>

                    {/* VIEW ARTIST */}
                    {artistData && (
                      <Link
                        href={`/artists/${artistData.slug}`}
                        className="mt-3 block border-2 border-black px-2 py-2 text-center text-[8px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:mt-4 sm:px-4 sm:py-3 sm:text-[10px] md:mt-5 md:inline-block md:px-5 md:py-3"
                      >
                        View Artist →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="mt-8 bg-black px-4 py-10 text-white sm:mt-12 sm:px-6 sm:py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end md:gap-8">
            <div>
              <h2 className="text-4xl font-black tracking-tighter sm:text-5xl md:text-7xl">
                RAP SCENE
              </h2>

              <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400 sm:mt-3 sm:text-xs sm:tracking-[0.2em]">
                Filipino Music • Hip-Hop • Culture
              </p>
            </div>

            <Link
              href="/"
              className="text-[10px] font-black uppercase tracking-widest hover:underline sm:text-xs"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="mt-8 border-t border-neutral-700 pt-5 text-[9px] font-bold uppercase tracking-wider text-neutral-500 sm:mt-12 sm:text-[10px]">
            © 2026 RAP SCENE. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
