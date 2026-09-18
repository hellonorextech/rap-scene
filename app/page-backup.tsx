import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type ChartEntry = {
  id: string;
  rank: number;
  last_week_rank: number | null;
  peak_rank: number | null;
  weeks_on_chart: number;
  songs: {
    title: string;
    artists: {
      name: string;
    } | null;
  } | null;
};

type TrendingArtist = {
  id: string;
  rank: number;
  score: number;
  artists: {
    name: string;
    photo_url: string | null;
  } | null;
};

type NewsArticle = {
  id: string;
  title: string;
  category: string;
  featured_image_url: string | null;
  excerpt: string | null;
};

export default async function Home() {
  const supabase = await createClient();

  /*
   * Find the newest RAP SCENE chart.
   */
  const { data: latestChart } = await supabase
    .from("charts")
    .select("id, name, chart_date")
    .eq("name", "RAP SCENE TOP 50")
    .order("chart_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  /*
   * Get the songs from the newest chart.
   */
  let chartSongs: ChartEntry[] = [];

  if (latestChart) {
    const { data } = await supabase
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
          artists (
            name
          )
        )
      `
      )
      .eq("chart_id", latestChart.id)
      .order("rank", { ascending: true });

    chartSongs = (data ?? []) as unknown as ChartEntry[];
  }

  /*
   * Get the newest trending artist rankings.
   */
  const { data: latestTrendingDate } = await supabase
    .from("artist_trending")
    .select("chart_date")
    .order("chart_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let trendingArtists: TrendingArtist[] = [];

  if (latestTrendingDate) {
    const { data } = await supabase
      .from("artist_trending")
      .select(
        `
        id,
        rank,
        score,
        artists (
          name,
          photo_url
        )
      `
      )
      .eq("chart_date", latestTrendingDate.chart_date)
      .order("rank", { ascending: true })
      .limit(4);

    trendingArtists = (data ?? []) as unknown as TrendingArtist[];
  }

  /*
   * Get latest published news.
   */
  const { data: latestNews } = await supabase
    .from("news")
    .select(
      `
      id,
      title,
      category,
      featured_image_url,
      excerpt
    `
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);

  const newsArticles = (latestNews ?? []) as NewsArticle[];

  /*
   * Format chart date.
   */
  const chartDate = latestChart
    ? new Date(`${latestChart.chart_date}T00:00:00`).toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      )
    : "No chart available";

  return (
    <main className="min-h-screen bg-white text-black">
      {/* HEADER */}
      <header className="border-b border-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link
  href="/"
  className="text-3xl font-black tracking-tighter md:text-4xl"
>
  RAP SCENE
</Link>

          <nav className="hidden items-center gap-7 text-sm font-bold uppercase tracking-wide md:flex">
            <a href="#charts" className="hover:underline">
              Charts
            </a>

            <a href="#artists" className="hover:underline">
              Artists
            </a>

            <a href="#music" className="hover:underline">
              Music
            </a>

            <a href="#news" className="hover:underline">
              News
            </a>
          </nav>

          <button className="border border-black px-4 py-2 text-xs font-bold uppercase md:hidden">
            Menu
          </button>
        </div>

        <div className="border-t border-black bg-black px-5 py-2 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-white">
          Filipino Music • Hip-Hop • Culture
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-black bg-neutral-100">
        <div className="mx-auto grid max-w-7xl md:grid-cols-2">
          <div className="flex min-h-[500px] flex-col justify-end border-b border-black p-6 md:min-h-[620px] md:border-b-0 md:border-r md:p-10">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em]">
              Featured Story
            </p>

            <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.9] tracking-tighter md:text-7xl lg:text-8xl">
              The Sound of Filipino Hip-Hop
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-6 text-neutral-600 md:text-base">
              Discover the artists, songs, stories and culture shaping the
              Filipino music scene.
            </p>

            <button className="mt-8 w-fit bg-black px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-neutral-800">
              Explore RAP SCENE
            </button>
          </div>

          <div className="flex min-h-[350px] items-end bg-neutral-800 p-6 text-white md:min-h-[620px] md:p-10">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
                RAP SCENE
              </p>

              <p className="text-6xl font-black uppercase leading-none tracking-tighter md:text-8xl">
                Music.
                <br />
                Culture.
                <br />
                Scene.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RAP SCENE TOP 50 */}
      <section id="charts" className="border-b border-black">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 border-b border-black p-6 md:flex-row md:items-end md:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em]">
                Weekly Chart
              </p>

              <h2 className="mt-2 text-5xl font-black uppercase tracking-tighter md:text-7xl">
                RAP SCENE TOP 50
              </h2>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              {chartDate}
            </p>
          </div>

          {chartSongs.length === 0 ? (
            <div className="p-8">
              <p className="text-sm font-bold uppercase">
                No chart entries available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[70px_1fr_110px_90px_90px] border-b border-black bg-black px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white">
                  <div>Rank</div>
                  <div>Song / Artist</div>
                  <div>Last Week</div>
                  <div>Peak</div>
                  <div>Weeks</div>
                </div>

                {chartSongs.map((entry) => {
                  const currentRank = entry.rank;
                  const lastWeek = entry.last_week_rank;

                  const movement =
                    lastWeek !== null ? lastWeek - currentRank : 0;

                  const songTitle =
                    entry.songs?.title ?? "Unknown Song";

                  const artistName =
                    entry.songs?.artists?.name ?? "Unknown Artist";

                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[70px_1fr_110px_90px_90px] items-center border-b border-black px-5 py-5 transition hover:bg-neutral-100"
                    >
                      <div className="text-4xl font-black tracking-tighter">
                        {String(currentRank).padStart(2, "0")}
                      </div>

                      <div>
                        <h3 className="text-lg font-black uppercase">
                          {songTitle}
                        </h3>

                        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
                          {artistName}
                        </p>
                      </div>

                      <div className="text-sm font-bold">
                        {lastWeek === null ? (
                          <span className="text-xs">NEW</span>
                        ) : (
                          <>
                            {lastWeek}

                            {movement > 0 && (
                              <span className="ml-2 text-xs">
                                ↑{movement}
                              </span>
                            )}

                            {movement < 0 && (
                              <span className="ml-2 text-xs">
                                ↓{Math.abs(movement)}
                              </span>
                            )}

                            {movement === 0 && (
                              <span className="ml-2 text-xs text-neutral-400">
                                —
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="text-sm font-bold">
                        #{entry.peak_rank ?? currentRank}
                      </div>

                      <div className="text-sm font-bold">
                        {entry.weeks_on_chart}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6 md:p-8">
  <Link
    href="/charts"
    className="inline-block border-2 border-black px-6 py-3 text-xs font-black uppercase tracking-wider transition hover:bg-black hover:text-white"
  >
    View Full Top 50
  </Link>
</div>
        </div>
      </section>

      {/* TRENDING ARTISTS */}
      <section id="artists" className="border-b border-black">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-black p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em]">
              Artist Rankings
            </p>

            <h2 className="mt-2 text-5xl font-black uppercase tracking-tighter md:text-7xl">
              Trending Artists
            </h2>
          </div>

          {trendingArtists.length === 0 ? (
            <div className="p-8">
              <p className="text-sm font-bold uppercase">
                No trending artists available.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2">
              {trendingArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="border-b border-black p-6 md:border-r md:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-5xl font-black tracking-tighter">
                      #{artist.rank}
                    </span>

                    <span className="border border-black px-3 py-1 text-[10px] font-black uppercase">
                      Trending
                    </span>
                  </div>

                  <div className="mt-10">
                    <div className="mb-5 aspect-[4/3] overflow-hidden bg-neutral-200">
                      {artist.artists?.photo_url ? (
                        <Image
  src={artist.artists.photo_url}
  alt={artist.artists.name}
  width={800}
  height={600}
  className="h-full w-full object-cover"
/>
                      ) : null}
                    </div>

                    <h3 className="text-3xl font-black uppercase tracking-tight">
                      {artist.artists?.name ?? "Unknown Artist"}
                    </h3>

                    <div className="mt-4 flex items-center justify-between border-t border-black pt-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Trending Score
                      </span>

                      <span className="text-2xl font-black">
                        {artist.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
  href="/artists"
  className="inline-block border-2 border-black px-6 py-3 text-xs font-black uppercase tracking-wider transition hover:bg-black hover:text-white"
>
  View All Artists
</Link>
        </div>
      </section>

      {/* MUSIC */}
      <section id="music" className="border-b border-black bg-black text-white">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-neutral-700 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400">
              Discover
            </p>

            <h2 className="mt-2 text-5xl font-black uppercase tracking-tighter md:text-7xl">
              Latest Music
            </h2>
          </div>

          <div className="grid md:grid-cols-3">
            {["New Releases", "Music Videos", "Albums"].map((item) => (
              <div
                key={item}
                className="border-b border-neutral-700 p-6 md:border-r md:p-8"
              >
                <div className="aspect-square bg-neutral-800"></div>

                <h3 className="mt-5 text-2xl font-black uppercase">
                  {item}
                </h3>

                <button className="mt-5 text-xs font-black uppercase tracking-wider underline underline-offset-4">
                  Explore →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section id="news" className="border-b border-black">
        <div className="mx-auto max-w-7xl">
          <div className="border-b border-black p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em]">
              RAP SCENE
            </p>

            <h2 className="mt-2 text-5xl font-black uppercase tracking-tighter md:text-7xl">
              Latest News
            </h2>
          </div>

          {newsArticles.length === 0 ? (
            <div className="p-8">
              <p className="text-sm font-bold uppercase">
                No published news yet.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3">
              {newsArticles.map((article) => (
                <article
                  key={article.id}
                  className="border-b border-black p-6 md:border-r md:p-8"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-neutral-200">
                    {article.featured_image_url ? (
                      <Image
  src={article.featured_image_url}
  alt={article.title}
  width={800}
  height={600}
  className="h-full w-full object-cover"
/>
                    ) : null}
                  </div>

                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.25em]">
                    {article.category}
                  </p>

                  <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-tight">
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                      {article.excerpt}
                    </p>
                  )}

                  <button className="mt-5 text-xs font-black uppercase underline underline-offset-4">
                    Read More →
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black px-6 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div>
              <h2 className="text-5xl font-black tracking-tighter md:text-7xl">
                RAP SCENE
              </h2>

              <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                Filipino Music • Hip-Hop • Culture
              </p>
            </div>

            <div className="flex gap-8 text-xs font-bold uppercase tracking-wider">
              <a href="#" className="hover:underline">
                Instagram
              </a>

              <a href="#" className="hover:underline">
                YouTube
              </a>

              <a href="#" className="hover:underline">
                Facebook
              </a>
            </div>
          </div>

          <div className="mt-12 border-t border-neutral-700 pt-5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            © 2026 RAP SCENE. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}