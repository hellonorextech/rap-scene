import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type HeroSettings = {
  id: string;
  image_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

type ChartEntry = {
  id: string;
  rank: number;
  last_week_rank: number | null;
  peak_rank: number | null;
  weeks_on_chart: number;
  songs: {
    title: string;
    slug: string;
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
    slug: string;
    photo_url: string | null;
  } | null;
};

type Song = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
  artists: {
    name: string;
    slug: string;
  } | null;
};

type Album = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
  artists: {
    name: string;
    slug: string;
  } | null;
};

type MusicVideo = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  release_date: string | null;
  artists: {
    name: string;
    slug: string;
  } | null;
};

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  featured_image_url: string | null;
  excerpt: string | null;
  published_at: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMovement(
  rank: number,
  lastWeekRank: number | null
): string {
  if (lastWeekRank === null) {
    return "NEW";
  }

  if (rank < lastWeekRank) {
    return `▲ ${lastWeekRank - rank}`;
  }

  if (rank > lastWeekRank) {
    return `▼ ${rank - lastWeekRank}`;
  }

  return "—";
}

export default async function HomePage() {
  const supabase = await createClient();

  // --------------------------------------------------
  // HERO
  // --------------------------------------------------

  const { data: heroData } = await supabase
    .from("hero_settings")
    .select("id, image_url, is_visible, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hero = heroData as HeroSettings | null;

  // --------------------------------------------------
  // CHART
  // --------------------------------------------------

  const { data: latestChart } = await supabase
    .from("charts")
    .select("id, name, chart_date")
    .eq("name", "RAP SCENE TOP 50")
    .order("chart_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let chartEntries: ChartEntry[] = [];

  if (latestChart) {
    const { data } = await supabase
      .from("chart_entries")
      .select(`
        id,
        rank,
        last_week_rank,
        peak_rank,
        weeks_on_chart,
        songs (
          title,
          slug,
          artists (
            name
          )
        )
      `)
      .eq("chart_id", latestChart.id)
      .order("rank", { ascending: true })
      .limit(10);

    chartEntries = (data ?? []) as unknown as ChartEntry[];
  }

  // --------------------------------------------------
  // TRENDING ARTISTS
  // --------------------------------------------------

  const { data: latestTrending } = await supabase
    .from("artist_trending")
    .select("chart_date")
    .order("chart_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let trendingArtists: TrendingArtist[] = [];

  if (latestTrending) {
    const { data } = await supabase
      .from("artist_trending")
      .select(`
        id,
        rank,
        score,
        artists (
          name,
          slug,
          photo_url
        )
      `)
      .eq("chart_date", latestTrending.chart_date)
      .order("rank", { ascending: true })
      .limit(4);

    trendingArtists = (data ?? []) as unknown as TrendingArtist[];
  }

  // --------------------------------------------------
  // NEW RELEASES
  // --------------------------------------------------

  const { data: songsData } = await supabase
    .from("songs")
    .select(`
      id,
      title,
      slug,
      cover_url,
      release_date,
      artists (
        name,
        slug
      )
    `)
    .order("release_date", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(4);

  const newReleases = (songsData ?? []) as unknown as Song[];

  // --------------------------------------------------
  // MUSIC VIDEOS
  // --------------------------------------------------

  const { data: videosData } = await supabase
    .from("music_videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      youtube_url,
      release_date,
      artists (
        name,
        slug
      )
    `)
    .order("release_date", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(4);

  const musicVideos = (videosData ?? []) as unknown as MusicVideo[];

  // --------------------------------------------------
  // ALBUMS
  // --------------------------------------------------

  const { data: albumsData } = await supabase
    .from("albums")
    .select(`
      id,
      title,
      slug,
      cover_url,
      release_date,
      artists (
        name,
        slug
      )
    `)
    .order("release_date", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(4);

  const albums = (albumsData ?? []) as unknown as Album[];

  // --------------------------------------------------
  // NEWS
  // --------------------------------------------------

  const { data: newsData } = await supabase
    .from("news")
    .select(`
      id,
      title,
      slug,
      category,
      featured_image_url,
      excerpt,
      published_at
    `)
    .eq("is_published", true)
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(3);

  const newsArticles = (newsData ?? []) as NewsArticle[];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-black">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">

          {/* LOGO */}

          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tighter sm:text-2xl"
          >
            RAP SCENE
          </Link>

          {/* DESKTOP NAVIGATION */}

          <nav className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wide md:flex">
            <a
              href="#charts"
              className="transition hover:underline"
            >
              Charts
            </a>

            <a
              href="#artists"
              className="transition hover:underline"
            >
              Artists
            </a>

            <a
              href="#music"
              className="transition hover:underline"
            >
              Music
            </a>

            <a
              href="#news"
              className="transition hover:underline"
            >
              News
            </a>
          </nav>

          {/* MOBILE NAVIGATION */}

          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center border border-black text-xl font-black [&::-webkit-details-marker]:hidden">
              ☰
            </summary>

            <div className="absolute right-0 top-12 z-[60] w-48 border border-black bg-white shadow-xl">

              <a
                href="#charts"
                className="block border-b border-black px-5 py-4 text-sm font-black uppercase transition hover:bg-black hover:text-white"
              >
                Charts
              </a>

              <a
                href="#artists"
                className="block border-b border-black px-5 py-4 text-sm font-black uppercase transition hover:bg-black hover:text-white"
              >
                Artists
              </a>

              <a
                href="#music"
                className="block border-b border-black px-5 py-4 text-sm font-black uppercase transition hover:bg-black hover:text-white"
              >
                Music
              </a>

              <a
                href="#news"
                className="block px-5 py-4 text-sm font-black uppercase transition hover:bg-black hover:text-white"
              >
                News
              </a>

            </div>
          </details>

        </div>
      </header>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative min-h-[60vh] overflow-hidden border-b border-black bg-black text-white sm:min-h-[70vh]">

        {hero?.is_visible && hero.image_url && (
          <div className="absolute inset-0">

            <Image
              src={hero.image_url}
              alt="RAP SCENE featured hero"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />

            <div className="absolute inset-0 bg-black/50" />

          </div>
        )}

        <div className="relative z-10 flex min-h-[60vh] items-end px-4 py-12 sm:min-h-[70vh] sm:px-6 sm:py-20 lg:py-24">

          <div className="mx-auto w-full max-w-7xl">

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] sm:mb-5 sm:text-sm sm:tracking-[0.3em]">
              Filipino Hip-Hop & Rap
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-none tracking-tighter sm:text-7xl lg:text-8xl">
              RAP SCENE
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-300 sm:mt-8 sm:text-lg">
              The home of Filipino rap charts, artists, music videos,
              albums, releases, and the latest stories from the scene.
            </p>

          </div>

        </div>

      </section>

      {/* ==================================================
          TOP 50
      ================================================== */}

      <section
        id="charts"
        className="border-b border-black px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest sm:text-sm">
                RAP SCENE
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter sm:text-4xl">
                TOP 50
              </h2>

              {latestChart && (
                <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
                  Week of {formatDate(latestChart.chart_date)}
                </p>
              )}
            </div>

            <Link
              href="/charts"
              className="w-fit border border-black px-4 py-2.5 text-xs font-bold uppercase transition hover:bg-black hover:text-white sm:px-5 sm:py-3 sm:text-sm"
            >
              View Full Top 50
            </Link>

          </div>

          {chartEntries.length === 0 ? (
            <div className="border border-black p-6 text-center sm:p-8">
              <p className="font-bold">
                No chart data available yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black border-y border-black">

              {chartEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[80px_minmax(0,1fr)_120px] sm:gap-4 sm:py-5"
                >

                  <div className="text-2xl font-black sm:text-3xl">
                    {entry.rank}
                  </div>

                  <div className="min-w-0">

                    <Link
                      href={`/songs/${entry.songs?.slug ?? ""}`}
                      className="block truncate text-sm font-black uppercase hover:underline sm:text-base"
                    >
                      {entry.songs?.title ?? "Unknown Song"}
                    </Link>

                    <p className="mt-1 truncate text-xs text-neutral-500 sm:text-sm">
                      {entry.songs?.artists?.name ?? "Unknown Artist"}
                    </p>

                  </div>

                  <div className="text-right text-xs font-bold sm:text-sm">
                    <span
                      className={
                        entry.last_week_rank === null
                          ? "text-black"
                          : entry.rank < entry.last_week_rank
                            ? "text-green-600"
                            : entry.rank > entry.last_week_rank
                              ? "text-red-600"
                              : "text-neutral-500"
                      }
                    >
                      {getMovement(
                        entry.rank,
                        entry.last_week_rank
                      )}
                    </span>
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </section>

      {/* ==================================================
          TRENDING ARTISTS
      ================================================== */}

      <section
        id="artists"
        className="border-b border-black bg-neutral-100 px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest sm:text-sm">
                RAP SCENE
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter sm:text-4xl">
                Trending Artists
              </h2>

              {latestTrending && (
                <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
                  Week of {formatDate(latestTrending.chart_date)}
                </p>
              )}
            </div>

            <Link
              href="/artists"
              className="w-fit border border-black px-4 py-2.5 text-xs font-bold uppercase transition hover:bg-black hover:text-white sm:px-5 sm:py-3 sm:text-sm"
            >
              View All Artists
            </Link>

          </div>

          {trendingArtists.length === 0 ? (
            <div className="border border-black bg-white p-6 text-center sm:p-8">
              <p className="font-bold">
                No trending artists available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">

              {trendingArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.artists?.slug ?? ""}`}
                  className="group min-w-0 border border-black bg-white"
                >

                  <div className="relative aspect-square overflow-hidden bg-black">

                    {artist.artists?.photo_url ? (
                      <Image
                        src={artist.artists.photo_url}
                        alt={artist.artists.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-3 text-center text-xl font-black text-white sm:text-3xl">
                        RAP SCENE
                      </div>
                    )}

                    <div className="absolute left-0 top-0 bg-black px-2 py-1 text-sm font-black text-white sm:px-4 sm:py-2 sm:text-xl">
                      #{artist.rank}
                    </div>

                  </div>

                  <div className="p-3 sm:p-5">

                    <h3 className="truncate text-sm font-black uppercase tracking-tight sm:text-xl">
                      {artist.artists?.name ?? "Unknown Artist"}
                    </h3>

                    <p className="mt-1 text-xs text-neutral-500 sm:mt-2 sm:text-sm">
                      Score: {artist.score}
                    </p>

                  </div>

                </Link>
              ))}

            </div>
          )}

        </div>
      </section>

      {/* ==================================================
          MUSIC
      ================================================== */}

      <section
        id="music"
        className="border-b border-black px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest sm:text-sm">
              RAP SCENE MUSIC
            </p>

            <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter sm:text-4xl">
              Music
            </h2>
          </div>

          {/* ------------------------------------------------
              NEW RELEASES
          ------------------------------------------------ */}

          <div className="mb-12 sm:mb-16">

            <div className="mb-5 flex items-end justify-between sm:mb-6">
              <h3 className="text-xl font-black uppercase tracking-tight sm:text-2xl">
                New Releases
              </h3>
            </div>

            {newReleases.length === 0 ? (
              <div className="border border-black p-6 text-center sm:p-8">
                <p className="font-bold">
                  No releases available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">

                {newReleases.map((song) => (
                  <Link
                    key={song.id}
                    href={`/songs/${song.slug}`}
                    className="group min-w-0 overflow-hidden border border-black"
                  >

                    <div className="relative aspect-square overflow-hidden bg-neutral-200">

                      {song.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-black p-3 text-center text-lg font-black text-white sm:p-6 sm:text-2xl">
                          RAP SCENE
                        </div>
                      )}

                    </div>

                    <div className="p-3 sm:p-5">

                      <h4 className="line-clamp-2 text-sm font-black uppercase leading-tight tracking-tight sm:text-base">
                        {song.title}
                      </h4>

                      <p className="mt-1 truncate text-xs text-neutral-500 sm:mt-2 sm:text-sm">
                        {song.artists?.name ?? "Unknown Artist"}
                      </p>

                      {song.release_date && (
                        <p className="mt-1 text-[10px] text-neutral-400 sm:text-xs">
                          {formatDate(song.release_date)}
                        </p>
                      )}

                    </div>

                  </Link>
                ))}

              </div>
            )}

          </div>

          {/* ------------------------------------------------
              MUSIC VIDEOS
          ------------------------------------------------ */}

          <div className="mb-12 sm:mb-16">

            <div className="mb-5 flex items-end justify-between sm:mb-6">

              <h3 className="text-xl font-black uppercase tracking-tight sm:text-2xl">
                Music Videos
              </h3>

              <Link
                href="/videos/test-song-official-music-video"
                className="text-xs font-bold uppercase hover:underline sm:text-sm"
              >
                View Video
              </Link>

            </div>

            {musicVideos.length === 0 ? (
              <div className="border border-black p-6 text-center sm:p-8">
                <p className="font-bold">
                  No music videos available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">

                {musicVideos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/videos/${video.slug}`}
                    className="group min-w-0 overflow-hidden border border-black"
                  >

                    <div className="relative aspect-video overflow-hidden bg-black">

                      {video.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-3 text-center text-lg font-black text-white sm:text-2xl">
                          RAP SCENE
                        </div>
                      )}

                      <div className="absolute bottom-1.5 left-1.5 bg-black px-2 py-1 text-[9px] font-bold uppercase text-white sm:bottom-3 sm:left-3 sm:px-3 sm:py-1 sm:text-xs">
                        MUSIC VIDEO
                      </div>

                    </div>

                    <div className="p-3 sm:p-5">

                      <h4 className="line-clamp-2 text-sm font-black uppercase leading-tight tracking-tight sm:text-base">
                        {video.title}
                      </h4>

                      <p className="mt-1 truncate text-xs text-neutral-500 sm:mt-2 sm:text-sm">
                        {video.artists?.name ?? "Unknown Artist"}
                      </p>

                      {video.release_date && (
                        <p className="mt-1 text-[10px] text-neutral-400 sm:text-xs">
                          {formatDate(video.release_date)}
                        </p>
                      )}

                    </div>

                  </Link>
                ))}

              </div>
            )}

          </div>

          {/* ------------------------------------------------
              ALBUMS
          ------------------------------------------------ */}

          <div>

            <div className="mb-5 flex items-end justify-between sm:mb-6">

              <h3 className="text-xl font-black uppercase tracking-tight sm:text-2xl">
                Albums
              </h3>

            </div>

            {albums.length === 0 ? (
              <div className="border border-black p-6 text-center sm:p-8">
                <p className="font-bold">
                  No albums available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">

                {albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${album.slug}`}
                    className="group min-w-0 overflow-hidden border border-black"
                  >

                    <div className="relative aspect-square overflow-hidden bg-neutral-200">

                      {album.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-black p-3 text-center text-lg font-black text-white sm:p-6 sm:text-2xl">
                          RAP SCENE
                        </div>
                      )}

                    </div>

                    <div className="p-3 sm:p-5">

                      <h4 className="line-clamp-2 text-sm font-black uppercase leading-tight tracking-tight sm:text-base">
                        {album.title}
                      </h4>

                      <p className="mt-1 truncate text-xs text-neutral-500 sm:mt-2 sm:text-sm">
                        {album.artists?.name ?? "Unknown Artist"}
                      </p>

                      {album.release_date && (
                        <p className="mt-1 text-[10px] text-neutral-400 sm:text-xs">
                          {formatDate(album.release_date)}
                        </p>
                      )}

                    </div>

                  </Link>
                ))}

              </div>
            )}

          </div>

        </div>
      </section>

      {/* ==================================================
          NEWS
      ================================================== */}

      <section
        id="news"
        className="border-b border-black bg-black px-4 py-12 text-white sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 sm:text-sm">
                RAP SCENE
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter sm:text-4xl">
                Latest News
              </h2>

            </div>

            <Link
              href="/news"
              className="w-fit border border-white px-4 py-2.5 text-xs font-bold uppercase transition hover:bg-white hover:text-black sm:px-5 sm:py-3 sm:text-sm"
            >
              View All News
            </Link>

          </div>

          {newsArticles.length === 0 ? (
            <div className="border border-white p-6 text-center sm:p-8">
              <p className="font-bold">
                No published news available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">

              {newsArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group min-w-0 overflow-hidden border border-white"
                >

                  <div className="relative aspect-video overflow-hidden bg-neutral-800">

                    {article.featured_image_url ? (
                      <Image
                        src={article.featured_image_url}
                        alt={article.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl font-black sm:text-2xl">
                        RAP SCENE
                      </div>
                    )}

                  </div>

                  <div className="p-4 sm:p-5">

                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 sm:text-xs">
                      {article.category}
                    </p>

                    <h3 className="mt-2 line-clamp-3 text-lg font-black uppercase leading-tight sm:mt-3 sm:text-xl">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neutral-400 sm:mt-3 sm:text-sm">
                        {article.excerpt}
                      </p>
                    )}

                    {article.published_at && (
                      <p className="mt-3 text-[10px] text-neutral-500 sm:mt-4 sm:text-xs">
                        {formatDate(article.published_at)}
                      </p>
                    )}

                  </div>

                </Link>
              ))}

            </div>
          )}

        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="bg-white px-4 py-8 sm:px-6 sm:py-10">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">

          <div>

            <p className="text-xl font-black tracking-tighter">
              RAP SCENE
            </p>

            <p className="mt-2 text-sm text-neutral-500">
              Filipino rap. Hip-hop. Culture.
            </p>

          </div>

          <div className="flex gap-5 text-xs font-bold uppercase sm:gap-6 sm:text-sm">

            <Link
              href="/charts"
              className="hover:underline"
            >
              Charts
            </Link>

            <Link
              href="/artists"
              className="hover:underline"
            >
              Artists
            </Link>

            <Link
              href="/news"
              className="hover:underline"
            >
              News
            </Link>

          </div>

        </div>

      </footer>

    </main>
  );
}