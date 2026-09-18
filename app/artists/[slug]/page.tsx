import Link from "next/link";
import BiographyToggle from "@/app/components/BiographyToggle";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Artist = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  biography: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
};

type Song = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
  artist_id: string;
};

type Album = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
};

type MusicVideo = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  release_date: string | null;
};

type TrendingEntry = {
  rank: number;
  score: number;
  chart_date: string;
};

type ChartEntry = {
  rank: number;
  last_week_rank: number | null;
  peak_rank: number | null;
  weeks_on_chart: number;
  charts: {
    name: string;
    chart_date: string;
  }[];
  songs: {
    id: string;
    title: string;
    slug: string;
  }[];
};

type FeaturedArtistRecord = {
  song_id: string;
  artist_id: string;
  created_at?: string;
  artists:
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | {
        id: string;
        name: string;
        slug: string;
      }
    | null;
};

type MainArtist = {
  id: string;
  name: string;
  slug: string;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ArtistProfilePage({
  params,
}: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  // --------------------------------------------------
  // GET CURRENT ARTIST
  // --------------------------------------------------

  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select(
      `
        id,
        name,
        slug,
        photo_url,
        biography,
        instagram_url,
        facebook_url,
        youtube_url,
        spotify_url
      `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (artistError || !artist) {
    notFound();
  }

  // --------------------------------------------------
  // LOAD MAIN DATA
  // --------------------------------------------------

  const [
    songsResult,
    featuredSongsResult,
    albumsResult,
    videosResult,
    trendingResult,
    chartEntriesResult,
  ] = await Promise.all([
    // SONGS WHERE THIS ARTIST IS THE MAIN ARTIST
    supabase
      .from("songs")
      .select(
        `
          id,
          title,
          slug,
          cover_url,
          release_date,
          artist_id
        `
      )
      .eq("artist_id", artist.id)
      .order("release_date", {
        ascending: false,
        nullsFirst: false,
      }),

    // SONGS WHERE THIS ARTIST IS A FEATURING ARTIST
    supabase
      .from("song_featured_artists")
      .select(
        `
          song_id,
          artist_id
        `
      )
      .eq("artist_id", artist.id),

    // ALBUMS
    supabase
      .from("albums")
      .select(
        `
          id,
          title,
          slug,
          cover_url,
          release_date
        `
      )
      .eq("artist_id", artist.id)
      .order("release_date", {
        ascending: false,
        nullsFirst: false,
      }),

    // MUSIC VIDEOS
    supabase
      .from("music_videos")
      .select(
        `
          id,
          title,
          slug,
          thumbnail_url,
          youtube_url,
          release_date
        `
      )
      .eq("artist_id", artist.id)
      .order("release_date", {
        ascending: false,
        nullsFirst: false,
      }),

    // CURRENT TRENDING
    supabase
      .from("artist_trending")
      .select(
        `
          rank,
          score,
          chart_date
        `
      )
      .eq("artist_id", artist.id)
      .order("chart_date", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    // CHART HISTORY
    supabase
      .from("chart_entries")
      .select(
        `
          rank,
          last_week_rank,
          peak_rank,
          weeks_on_chart,
          charts (
            name,
            chart_date
          ),
          songs (
            id,
            title,
            slug
          )
        `
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(100),
  ]);

  // --------------------------------------------------
  // MAIN ARTIST SONGS
  // --------------------------------------------------

  const mainArtistSongs = (songsResult.data ?? []) as Song[];

  // --------------------------------------------------
  // FEATURED SONG IDs
  // --------------------------------------------------

  const featuredSongRecords =
    (featuredSongsResult.data ?? []) as {
      song_id: string;
      artist_id: string;
    }[];

  const featuredSongIds = Array.from(
    new Set(
      featuredSongRecords.map(
        (record) => record.song_id
      )
    )
  );

  // --------------------------------------------------
  // LOAD FULL SONG DATA FOR FEATURED SONGS
  // --------------------------------------------------

  let featuredSongs: Song[] = [];

  if (featuredSongIds.length > 0) {
    const { data: featuredSongData } = await supabase
      .from("songs")
      .select(
        `
          id,
          title,
          slug,
          cover_url,
          release_date,
          artist_id
        `
      )
      .in("id", featuredSongIds)
      .order("release_date", {
        ascending: false,
        nullsFirst: false,
      });

    featuredSongs = (featuredSongData ?? []) as Song[];
  }

  // --------------------------------------------------
  // COMBINE MAIN + FEATURING SONGS
  // --------------------------------------------------

  const songMap = new Map<string, Song>();

  for (const song of mainArtistSongs) {
    songMap.set(song.id, song);
  }

  for (const song of featuredSongs) {
    songMap.set(song.id, song);
  }

  const songs = Array.from(songMap.values()).sort(
    (a, b) => {
      if (!a.release_date && !b.release_date) {
        return 0;
      }

      if (!a.release_date) {
        return 1;
      }

      if (!b.release_date) {
        return -1;
      }

      return (
        new Date(b.release_date).getTime() -
        new Date(a.release_date).getTime()
      );
    }
  );

  // --------------------------------------------------
  // GET MAIN ARTISTS FOR ALL SONGS
  // --------------------------------------------------

  const mainArtistIds = Array.from(
    new Set(
      songs.map((song) => song.artist_id)
    )
  );

  const mainArtistsById = new Map<
    string,
    MainArtist
  >();

  if (mainArtistIds.length > 0) {
    const { data: mainArtistsData } = await supabase
      .from("artists")
      .select(
        `
          id,
          name,
          slug
        `
      )
      .in("id", mainArtistIds);

    for (const mainArtist of mainArtistsData ?? []) {
      mainArtistsById.set(mainArtist.id, {
        id: mainArtist.id,
        name: mainArtist.name,
        slug: mainArtist.slug,
      });
    }
  }

  // --------------------------------------------------
  // GET ALL FEATURING ARTISTS FOR DISPLAYED SONGS
  // --------------------------------------------------

  const featuringArtistsBySong = new Map<
    string,
    MainArtist[]
  >();

  const songIds = songs.map(
    (song) => song.id
  );

  if (songIds.length > 0) {
    const { data: allFeaturedArtists } =
      await supabase
        .from("song_featured_artists")
        .select(
          `
            song_id,
            artist_id,
            created_at,
            artists (
              id,
              name,
              slug
            )
          `
        )
        .in("song_id", songIds)
        .order("created_at", {
          ascending: true,
        });

    const records =
      (allFeaturedArtists ?? []) as FeaturedArtistRecord[];

    for (const record of records) {
      const artistData = Array.isArray(
        record.artists
      )
        ? record.artists[0]
        : record.artists;

      if (!artistData) {
        continue;
      }

      // Do not display the main artist again as "feat."
      const song = songMap.get(record.song_id);

      if (
        song &&
        artistData.id === song.artist_id
      ) {
        continue;
      }

      const existing =
        featuringArtistsBySong.get(
          record.song_id
        ) ?? [];

      // Prevent duplicate featuring artists
      if (
        !existing.some(
          (existingArtist) =>
            existingArtist.id ===
            artistData.id
        )
      ) {
        existing.push({
          id: artistData.id,
          name: artistData.name,
          slug: artistData.slug,
        });
      }

      featuringArtistsBySong.set(
        record.song_id,
        existing
      );
    }
  }

  // --------------------------------------------------
  // OTHER DATA
  // --------------------------------------------------

  const albums =
    (albumsResult.data ?? []) as Album[];

  const videos =
    (videosResult.data ?? []) as MusicVideo[];

  const trending =
    trendingResult.data as TrendingEntry | null;

  const allChartEntries =
    (chartEntriesResult.data ??
      []) as ChartEntry[];

  // --------------------------------------------------
  // CHART HISTORY
  //
  // Includes songs where artist is:
  // 1. Main artist
  // 2. Featuring artist
  // --------------------------------------------------

  const artistSongIds = new Set(
    songs.map((song) => song.id)
  );

  const artistChartEntries =
    allChartEntries.filter((entry) => {
      const song = entry.songs?.[0];

      if (!song) {
        return false;
      }

      return artistSongIds.has(song.id);
    });

  // --------------------------------------------------
  // DATE FORMAT
  // --------------------------------------------------

  const formatDate = (
    date: string | null
  ) => {
    if (!date) {
      return "Release date unavailable";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // BUILD ARTIST CREDIT
  //
  // Main Artist
  //
  // OR
  //
  // Main Artist feat. Artist B
  //
  // OR
  //
  // Main Artist feat. Artist B & Artist C
  // --------------------------------------------------

  const getArtistCredit = (
    song: Song
  ) => {
    const mainArtist =
      mainArtistsById.get(
        song.artist_id
      );

    const mainArtistName =
      mainArtist?.name ||
      "Unknown Artist";

    const featuringArtists =
      featuringArtistsBySong.get(
        song.id
      ) ?? [];

    if (
      featuringArtists.length === 0
    ) {
      return mainArtistName;
    }

    return `${mainArtistName} feat. ${featuringArtists
      .map(
        (featuringArtist) =>
          featuringArtist.name
      )
      .join(" & ")}`;
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-black">
      {/* HEADER */}
      <header className="border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-5 sm:py-5 md:px-8">
          <Link
  href="/"
  className="shrink-0 flex items-center"
>
  <Image
    src="/images/logo.png"
    alt="RAP SCENE"
    width={200}
    height={70}
    className="h-10 w-auto object-contain"
    priority
  />
</Link>

          <nav className="hidden items-center gap-6 text-xs font-black uppercase tracking-wider md:flex">
            <Link
              href="/"
              className="transition hover:underline"
            >
              Home
            </Link>

            <Link
              href="/charts"
              className="transition hover:underline"
            >
              Charts
            </Link>

            <Link
              href="/artists"
              className="transition hover:underline"
            >
              Artists
            </Link>
          </nav>

          {/* MOBILE MENU */}
          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center border-2 border-black text-xl font-black [&::-webkit-details-marker]:hidden">
              ☰
            </summary>

            <div className="absolute right-0 top-12 z-50 w-44 border-2 border-black bg-white shadow-xl">
              <Link
                href="/"
                className="block border-b border-black px-4 py-4 text-xs font-black uppercase"
              >
                Home
              </Link>

              <Link
                href="/charts"
                className="block border-b border-black px-4 py-4 text-xs font-black uppercase"
              >
                Charts
              </Link>

              <Link
                href="/artists"
                className="block px-4 py-4 text-xs font-black uppercase"
              >
                Artists
              </Link>
            </div>
          </details>
        </div>
      </header>

      {/* ARTIST HERO */}
      <section className="border-b-2 border-black">
        <div className="mx-auto grid max-w-7xl md:grid-cols-[320px_1fr]">
          <div className="relative aspect-square bg-black">
            {artist.photo_url ? (
              <Image
                src={artist.photo_url}
                alt={artist.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-white">
                <span className="text-4xl font-black uppercase tracking-[-0.06em]">
                  RAP
                  <br />
                  SCENE
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-6 md:p-10">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs">
              Artist
            </p>

            <h1 className="text-3xl font-black uppercase tracking-[-0.06em] sm:text-4xl md:text-7xl">
              {artist.name}
            </h1>

            {artist.biography && (
  <BiographyToggle biography={artist.biography} />
)}

            {/* SOCIAL LINKS */}
            <div className="mt-6 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
              {artist.instagram_url && (
                <a
                  href={artist.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black px-3 py-2 text-[10px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:px-4 sm:text-xs"
                >
                  Instagram
                </a>
              )}

              {artist.facebook_url && (
                <a
                  href={artist.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black px-3 py-2 text-[10px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:px-4 sm:text-xs"
                >
                  Facebook
                </a>
              )}

              {artist.youtube_url && (
                <a
                  href={artist.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black px-3 py-2 text-[10px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:px-4 sm:text-xs"
                >
                  YouTube
                </a>
              )}

              {artist.spotify_url && (
                <a
                  href={artist.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black px-3 py-2 text-[10px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:px-4 sm:text-xs"
                >
                  Spotify
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CURRENT TRENDING */}
      {trending && (
        <section className="border-b-2 border-black">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-10">
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              <div className="border-2 border-black p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-wider sm:text-xs">
                  Trending Rank
                </p>

                <p className="mt-1 text-4xl font-black sm:mt-2 sm:text-5xl">
                  #{trending.rank}
                </p>
              </div>

              <div className="border-2 border-black p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-wider sm:text-xs">
                  Trending Score
                </p>

                <p className="mt-1 text-4xl font-black sm:mt-2 sm:text-5xl">
                  {trending.score}
                </p>
              </div>

              <div className="border-2 border-black p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-wider sm:text-xs">
                  Chart Date
                </p>

                <p className="mt-2 text-sm font-black uppercase sm:text-lg">
                  {formatDate(
                    trending.chart_date
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SONGS */}
      <section className="border-b-2 border-black">
        <div className="mx-auto max-w-7xl">
          <div className="border-b-2 border-black p-4 sm:p-6 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs">
              Music
            </p>

            <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.06em] sm:mt-2 sm:text-4xl md:text-6xl">
              Songs
            </h2>
          </div>

          {songs.length > 0 ? (
            <div className="grid grid-cols-2 gap-0 md:grid-cols-1">
              {songs.map(
                (song, index) => (
                  <Link
                    key={song.id}
                    href={`/songs/${song.slug}`}
                    className="group border-b-2 border-black p-3 transition hover:bg-black hover:text-white sm:p-4 md:grid md:grid-cols-[70px_90px_1fr_auto] md:items-center md:gap-5 md:p-6"
                  >
                    {/* MOBILE NUMBER */}
                    <div className="mb-2 flex items-center justify-between md:mb-0">
                      <span className="text-sm font-black sm:text-lg md:text-2xl">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <span className="text-[9px] font-black uppercase md:hidden">
                        →
                      </span>
                    </div>

                    {/* COVER */}
                    <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 md:w-auto">
                      {song.cover_url ? (
                        <Image
                          src={song.cover_url}
                          alt={song.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 90px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-black text-center text-[8px] font-black text-white sm:text-[10px]">
                          RAP
                          <br />
                          SCENE
                        </div>
                      )}
                    </div>

                    {/* SONG INFORMATION */}
                    <div className="mt-3 min-w-0 md:mt-0">
                      <h3 className="line-clamp-2 text-sm font-black uppercase leading-tight sm:text-base md:text-xl">
                        {song.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-[9px] font-black uppercase leading-tight sm:text-[10px] md:mt-2 md:text-xs">
                        {getArtistCredit(song)}
                      </p>

                      <p className="mt-1 text-[9px] font-bold uppercase opacity-60 sm:text-[10px] md:text-xs">
                        {formatDate(
                          song.release_date
                        )}
                      </p>
                    </div>

                    {/* DESKTOP ACTION */}
                    <span className="hidden text-xs font-black uppercase md:block">
                      View Song →
                    </span>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="p-5 text-xs font-bold uppercase text-neutral-500 sm:p-6 md:p-10">
              No songs available.
            </div>
          )}
        </div>
      </section>

      {/* ALBUMS */}
      <section className="border-b-2 border-black">
        <div className="mx-auto max-w-7xl">
          <div className="border-b-2 border-black p-4 sm:p-6 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs">
              Releases
            </p>

            <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.06em] sm:mt-2 sm:text-4xl md:text-6xl">
              Albums
            </h2>
          </div>

          {albums.length > 0 ? (
            <div className="grid grid-cols-2 gap-0 md:grid-cols-3">
              {albums.map(
                (album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${album.slug}`}
                    className="group border-b-2 border-r-2 border-black p-3 transition hover:bg-black hover:text-white sm:p-4 md:p-6"
                  >
                    <div className="relative aspect-square overflow-hidden bg-neutral-100">
                      {album.cover_url ? (
                        <Image
                          src={album.cover_url}
                          alt={album.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-black text-center text-white">
                          <span className="text-sm font-black uppercase sm:text-2xl">
                            RAP
                            <br />
                            SCENE
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-sm font-black uppercase leading-tight sm:mt-4 sm:text-base md:mt-5 md:text-xl">
                      {album.title}
                    </h3>

                    <p className="mt-1 text-[9px] font-bold uppercase opacity-60 sm:text-xs">
                      {formatDate(
                        album.release_date
                      )}
                    </p>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="p-5 text-xs font-bold uppercase text-neutral-500 sm:p-6 md:p-10">
              No albums available.
            </div>
          )}
        </div>
      </section>

      {/* MUSIC VIDEOS */}
      <section className="border-b-2 border-black">
        <div className="mx-auto max-w-7xl">
          <div className="border-b-2 border-black p-4 sm:p-6 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs">
              Visuals
            </p>

            <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.06em] sm:mt-2 sm:text-4xl md:text-6xl">
              Music Videos
            </h2>
          </div>

          {videos.length > 0 ? (
            <div className="grid grid-cols-2 gap-0 md:grid-cols-2">
              {videos.map(
                (video) => (
                  <a
                    key={video.id}
                    href={
                      video.youtube_url ||
                      `/videos/${video.slug}`
                    }
                    target={
                      video.youtube_url
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      video.youtube_url
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="group border-b-2 border-r-2 border-black p-3 transition hover:bg-black hover:text-white sm:p-4 md:p-6"
                  >
                    <div className="relative aspect-video overflow-hidden bg-neutral-100">
                      {video.thumbnail_url ? (
                        <Image
                          src={
                            video.thumbnail_url
                          }
                          alt={
                            video.title
                          }
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 50vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-black text-white">
                          <span className="text-sm font-black uppercase sm:text-2xl">
                            RAP SCENE
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4 md:mt-5">
                      <h3 className="line-clamp-2 text-sm font-black uppercase leading-tight sm:text-base md:text-xl">
                        {video.title}
                      </h3>

                      <p className="mt-1 text-[9px] font-bold uppercase opacity-60 sm:text-xs">
                        {formatDate(
                          video.release_date
                        )}
                      </p>

                      <span className="mt-2 block text-[9px] font-black uppercase sm:text-xs">
                        Watch →
                      </span>
                    </div>
                  </a>
                )
              )}
            </div>
          ) : (
            <div className="p-5 text-xs font-bold uppercase text-neutral-500 sm:p-6 md:p-10">
              No music videos available.
            </div>
          )}
        </div>
      </section>

      {/* CHART HISTORY */}
      <section className="border-b-2 border-black">
        <div className="mx-auto max-w-7xl">
          <div className="border-b-2 border-black p-4 sm:p-6 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs">
              Chart History
            </p>

            <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.06em] sm:mt-2 sm:text-4xl md:text-6xl">
              Chart Appearances
            </h2>
          </div>

          {artistChartEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-black text-xs font-black uppercase tracking-wider">
                    <th className="p-4">
                      Rank
                    </th>

                    <th className="p-4">
                      Song
                    </th>

                    <th className="p-4">
                      Last Week
                    </th>

                    <th className="p-4">
                      Peak
                    </th>

                    <th className="p-4">
                      Weeks
                    </th>

                    <th className="p-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {artistChartEntries.map(
                    (
                      entry,
                      index
                    ) => {
                      const song =
                        entry.songs?.[0];

                      const chart =
                        entry.charts?.[0];

                      return (
                        <tr
                          key={`${song?.slug ?? "song"}-${index}`}
                          className="border-b border-neutral-300 text-sm"
                        >
                          <td className="p-4 text-2xl font-black">
                            {
                              entry.rank
                            }
                          </td>

                          <td className="p-4 font-black uppercase">
                            {song ? (
                              <Link
                                href={`/songs/${song.slug}`}
                                className="hover:underline"
                              >
                                {
                                  song.title
                                }
                              </Link>
                            ) : (
                              "Unknown Song"
                            )}
                          </td>

                          <td className="p-4 font-bold">
                            {
                              entry.last_week_rank ??
                              "NEW"
                            }
                          </td>

                          <td className="p-4 font-bold">
                            {
                              entry.peak_rank ??
                              "-"
                            }
                          </td>

                          <td className="p-4 font-bold">
                            {
                              entry.weeks_on_chart
                            }
                          </td>

                          <td className="p-4 font-bold uppercase">
                            {chart
                              ? formatDate(
                                  chart.chart_date
                                )
                              : "-"}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-xs font-bold uppercase text-neutral-500 sm:p-6 md:p-10">
              No chart appearances available.
            </div>
          )}
        </div>
      </section>

      {/* BACK */}
      <section className="mx-auto max-w-7xl p-5 sm:p-6 md:p-10">
        <Link
          href="/artists"
          className="inline-block border-2 border-black px-5 py-3 text-[10px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:px-6 sm:text-xs"
        >
          ← Back to Artists
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t-2 border-black bg-black px-5 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xl font-black tracking-[-0.08em] sm:text-2xl">
              RAP SCENE
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:mt-2 sm:text-xs">
              Filipino Rap & Hip-Hop
            </p>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:text-xs">
            © {new Date().getFullYear()} RAP SCENE
          </p>
        </div>
      </footer>
    </main>
  );
}