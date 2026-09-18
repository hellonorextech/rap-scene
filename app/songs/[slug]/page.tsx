import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Artist = {
  id?: string;
  name: string;
  slug: string;
  photo_url: string | null;
};

type FeaturedArtist = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
};

type Song = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  apple_music_url: string | null;
  artists: Artist[] | Artist | null;
};

export default async function SongPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  // Get the song and its main artist
  const { data: song, error } = await supabase
    .from("songs")
    .select(
      `
        id,
        title,
        slug,
        cover_url,
        release_date,
        spotify_url,
        youtube_url,
        apple_music_url,
        artists (
          id,
          name,
          slug,
          photo_url
        )
      `
    )
    .eq("slug", slug)
    .single();

  if (error || !song) {
    notFound();
  }

  const typedSong = song as Song;

  const artist = Array.isArray(typedSong.artists)
    ? typedSong.artists[0] ?? null
    : typedSong.artists ?? null;

  // Get featuring artists
  const { data: featuringData, error: featuringError } = await supabase
    .from("song_featured_artists")
    .select(
      `
        id,
        artist_id,
        artists (
          id,
          name,
          slug,
          photo_url
        )
      `
    )
    .eq("song_id", typedSong.id)
    .order("created_at", { ascending: true });

  if (featuringError) {
    console.error(
      "Failed to load featuring artists:",
      featuringError
    );
  }

  const featuringArtists: FeaturedArtist[] = (
    featuringData ?? []
  )
    .map((item) => {
      const artistData = Array.isArray(item.artists)
        ? item.artists[0]
        : item.artists;

      if (!artistData) {
        return null;
      }

      return {
        id: artistData.id,
        name: artistData.name,
        slug: artistData.slug,
        photo_url: artistData.photo_url,
      };
    })
    .filter(
      (artist): artist is FeaturedArtist => artist !== null
    );

  const releaseDate = typedSong.release_date
    ? new Date(
        `${typedSong.release_date}T00:00:00`
      ).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-white text-black">
      {/* HEADER */}
      <header className="border-b border-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight sm:text-3xl"
          >
            RAP SCENE
          </Link>

          <nav className="flex items-center gap-4 text-sm font-bold sm:gap-6">
            <Link
              href="/"
              className="transition hover:opacity-60"
            >
              HOME
            </Link>

            <Link
              href="/charts"
              className="transition hover:opacity-60"
            >
              CHARTS
            </Link>

            <Link
              href="/artists"
              className="transition hover:opacity-60"
            >
              ARTISTS
            </Link>

            <Link
              href="/news"
              className="transition hover:opacity-60"
            >
              NEWS
            </Link>
          </nav>
        </div>
      </header>

      {/* SONG */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[320px_1fr] md:items-start lg:grid-cols-[400px_1fr]">
          {/* COVER */}
          <div>
            {typedSong.cover_url ? (
              <div className="overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={typedSong.cover_url}
                  alt={typedSong.title}
                  className="aspect-square w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-black">
                <span className="text-4xl font-black text-white">
                  RAP SCENE
                </span>
              </div>
            )}
          </div>

          {/* INFORMATION */}
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500">
              Song
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {typedSong.title}
            </h1>

            {/* MAIN ARTIST */}
            {artist && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xl font-bold sm:text-2xl">
                <Link
                  href={`/artists/${artist.slug}`}
                  className="underline decoration-2 underline-offset-4 transition hover:opacity-60"
                >
                  {artist.name}
                </Link>

                {/* FEATURING ARTISTS */}
                {featuringArtists.length > 0 && (
                  <>
                    <span className="font-normal text-gray-400">
                      feat.
                    </span>

                    {featuringArtists.map(
                      (featuredArtist, index) => (
                        <span
                          key={featuredArtist.id}
                          className="flex items-center"
                        >
                          <Link
                            href={`/artists/${featuredArtist.slug}`}
                            className="underline decoration-2 underline-offset-4 transition hover:opacity-60"
                          >
                            {featuredArtist.name}
                          </Link>

                          {index <
                            featuringArtists.length - 1 && (
                            <span className="ml-2 font-normal text-gray-400">
                              &
                            </span>
                          )}
                        </span>
                      )
                    )}
                  </>
                )}
              </div>
            )}

            {releaseDate && (
              <p className="mt-5 text-sm text-gray-500">
                Released {releaseDate}
              </p>
            )}

            {/* STREAMING LINKS */}
            <div className="mt-8 flex flex-wrap gap-3">
              {typedSong.spotify_url && (
                <a
                  href={typedSong.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
                >
                  SPOTIFY
                </a>
              )}

              {typedSong.youtube_url && (
                <a
                  href={typedSong.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white"
                >
                  YOUTUBE
                </a>
              )}

              {typedSong.apple_music_url && (
                <a
                  href={typedSong.apple_music_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white"
                >
                  APPLE MUSIC
                </a>
              )}
            </div>

            {/* MAIN ARTIST INFORMATION */}
            {artist && (
              <div className="mt-12 border-t-2 border-black pt-6">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Artist
                </p>

                <div className="mt-4 flex items-center gap-4">
                  {artist.photo_url ? (
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artist.photo_url}
                        alt={artist.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                      RS
                    </div>
                  )}

                  <div>
                    <Link
                      href={`/artists/${artist.slug}`}
                      className="font-black underline underline-offset-4 transition hover:opacity-60"
                    >
                      {artist.name}
                    </Link>

                    <p className="mt-1 text-sm text-gray-500">
                      Main artist
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURING ARTISTS INFORMATION */}
            {featuringArtists.length > 0 && (
              <div className="mt-10 border-t border-black pt-6">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Featuring
                </p>

                <div className="mt-4 space-y-4">
                  {featuringArtists.map((featuredArtist) => (
                    <div
                      key={featuredArtist.id}
                      className="flex items-center gap-4"
                    >
                      {featuredArtist.photo_url ? (
                        <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={featuredArtist.photo_url}
                            alt={featuredArtist.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                          RS
                        </div>
                      )}

                      <div>
                        <Link
                          href={`/artists/${featuredArtist.slug}`}
                          className="font-black underline underline-offset-4 transition hover:opacity-60"
                        >
                          {featuredArtist.name}
                        </Link>

                        <p className="mt-1 text-sm text-gray-500">
                          Featured artist
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BACK LINKS */}
        <div className="mt-14 flex flex-wrap gap-3 border-t border-black pt-6">
          <Link
            href="/charts"
            className="bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
          >
            ← TOP 50
          </Link>

          <Link
            href="/artists"
            className="border-2 border-black px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white"
          >
            VIEW ARTISTS
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">
            © {new Date().getFullYear()} RAP SCENE
          </p>

          <p className="text-xs text-gray-400">
            Filipino Rap & Hip-Hop Music
          </p>
        </div>
      </footer>
    </main>
  );
}