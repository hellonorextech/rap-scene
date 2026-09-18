import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Artist = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
};

type Album = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  artists: Artist[];
};

type AlbumSong = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
};

export default async function AlbumPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: album, error } = await supabase
    .from("albums")
    .select(
      `
        id,
        title,
        slug,
        cover_url,
        release_date,
        spotify_url,
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

  if (error || !album) {
    notFound();
  }

  const typedAlbum = album as Album;
  const artist = typedAlbum.artists?.[0] ?? null;

  let songs: AlbumSong[] = [];

  if (artist) {
    const { data: artistSongs } = await supabase
      .from("songs")
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
        ascending: true,
        nullsFirst: false,
      });

    songs = (artistSongs ?? []) as AlbumSong[];
  }

  const releaseDate = typedAlbum.release_date
    ? new Date(
        `${typedAlbum.release_date}T00:00:00`
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

      {/* ALBUM */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[320px_1fr] md:items-start lg:grid-cols-[400px_1fr]">
          {/* COVER */}
          <div>
            {typedAlbum.cover_url ? (
              <div className="overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={typedAlbum.cover_url}
                  alt={typedAlbum.title}
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
              Album
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {typedAlbum.title}
            </h1>

            {artist && (
              <Link
                href={`/artists/${artist.slug}`}
                className="mt-4 inline-block text-xl font-bold underline decoration-2 underline-offset-4 transition hover:opacity-60 sm:text-2xl"
              >
                {artist.name}
              </Link>
            )}

            {releaseDate && (
              <p className="mt-5 text-sm text-gray-500">
                Released {releaseDate}
              </p>
            )}

            {/* STREAMING LINKS */}
            <div className="mt-8 flex flex-wrap gap-3">
              {typedAlbum.spotify_url && (
                <a
                  href={typedAlbum.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
                >
                  SPOTIFY
                </a>
              )}

              {typedAlbum.apple_music_url && (
                <a
                  href={typedAlbum.apple_music_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-black px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white"
                >
                  APPLE MUSIC
                </a>
              )}
            </div>

            {/* ARTIST */}
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
                      View artist profile
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TRACKS */}
        <div className="mt-16 border-t-2 border-black pt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Music
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Songs by {artist?.name ?? "Artist"}
              </h2>
            </div>

            <span className="text-sm font-bold text-gray-500">
              {songs.length}{" "}
              {songs.length === 1 ? "song" : "songs"}
            </span>
          </div>

          {songs.length > 0 ? (
            <div className="mt-6 divide-y-2 divide-black border-y-2 border-black">
              {songs.map((song, index) => (
                <Link
                  key={song.id}
                  href={`/songs/${song.slug}`}
                  className="flex items-center gap-4 py-4 transition hover:bg-gray-100"
                >
                  <span className="w-8 text-center text-sm font-black text-gray-500">
                    {index + 1}
                  </span>

                  {song.cover_url ? (
                    <div className="h-14 w-14 shrink-0 overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={song.cover_url}
                        alt={song.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-black text-[9px] font-black text-white">
                      RAP SCENE
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-black">
                      {song.title}
                    </h3>

                    {song.release_date && (
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(
                          `${song.release_date}T00:00:00`
                        ).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  <span className="text-xl font-black">
                    →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 border-y-2 border-black py-10 text-center">
              <p className="font-bold text-gray-500">
                No songs have been added for this artist yet.
              </p>
            </div>
          )}
        </div>

        {/* BACK LINKS */}
        <div className="mt-12 flex flex-wrap gap-3 border-t border-black pt-6">
          <Link
            href="/artists"
            className="bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
          >
            ← ARTISTS
          </Link>

          <Link
            href="/"
            className="border-2 border-black px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white"
          >
            HOME
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