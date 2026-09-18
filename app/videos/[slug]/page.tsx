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

type MusicVideo = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  release_date: string | null;
  artists: Artist[];
};

function getYouTubeEmbedUrl(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname === "youtu.be" ||
      parsedUrl.hostname === "www.youtu.be"
    ) {
      const videoId = parsedUrl.pathname.slice(1);

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (
      parsedUrl.hostname === "youtube.com" ||
      parsedUrl.hostname === "www.youtube.com" ||
      parsedUrl.hostname === "m.youtube.com"
    ) {
      const videoId = parsedUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      const pathParts = parsedUrl.pathname.split("/");

      const embedIndex = pathParts.indexOf("embed");

      if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
        return `https://www.youtube.com/embed/${pathParts[embedIndex + 1]}`;
      }

      const shortsIndex = pathParts.indexOf("shorts");

      if (shortsIndex !== -1 && pathParts[shortsIndex + 1]) {
        return `https://www.youtube.com/embed/${pathParts[shortsIndex + 1]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default async function MusicVideoPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: video, error } = await supabase
    .from("music_videos")
    .select(
      `
        id,
        title,
        slug,
        thumbnail_url,
        youtube_url,
        release_date,
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

  if (error || !video) {
    notFound();
  }

  const typedVideo = video as MusicVideo;
  const artist = typedVideo.artists?.[0] ?? null;

  const embedUrl = getYouTubeEmbedUrl(
    typedVideo.youtube_url
  );

  const releaseDate = typedVideo.release_date
    ? new Date(
        `${typedVideo.release_date}T00:00:00`
      ).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-white text-black">
      

      {/* VIDEO */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {/* VIDEO PLAYER */}
        {embedUrl ? (
          <div className="overflow-hidden bg-black">
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                title={typedVideo.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : typedVideo.thumbnail_url ? (
          <div className="overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={typedVideo.thumbnail_url}
              alt={typedVideo.title}
              className="aspect-video w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-black">
            <span className="text-4xl font-black text-white sm:text-6xl">
              RAP SCENE
            </span>
          </div>
        )}

        {/* VIDEO INFORMATION */}
        <div className="mt-8">
          <p className="text-sm font-black uppercase tracking-widest text-gray-500">
            Music Video
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {typedVideo.title}
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
            <p className="mt-4 text-sm text-gray-500">
              Released {releaseDate}
            </p>
          )}

          {/* YOUTUBE BUTTON */}
          {typedVideo.youtube_url && (
            <div className="mt-7">
              <a
                href={typedVideo.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
              >
                WATCH ON YOUTUBE ↗
              </a>
            </div>
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