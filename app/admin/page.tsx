import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/login");
  }

  const [
    artistsResult,
    songsResult,
    chartsResult,
    trendingResult,
    albumsResult,
    videosResult,
    newsResult,
    heroResult,
  ] = await Promise.all([
    supabase.from("artists").select("*", { count: "exact", head: true }),

    supabase.from("songs").select("*", { count: "exact", head: true }),

    supabase.from("charts").select("*", { count: "exact", head: true }),

    supabase
      .from("artist_trending")
      .select("*", { count: "exact", head: true }),

    supabase.from("albums").select("*", { count: "exact", head: true }),

    supabase
      .from("music_videos")
      .select("*", { count: "exact", head: true }),

    supabase.from("news").select("*", { count: "exact", head: true }),

    supabase
      .from("hero_settings")
      .select("*", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      title: "Hero",
      description: "Manage the main hero image displayed on RAP SCENE.",
      count: heroResult.count ?? 0,
      href: "/admin/hero",
      icon: "🖼️",
    },
    {
      title: "Artists",
      description: "Manage Filipino rap and hip-hop artists.",
      count: artistsResult.count ?? 0,
      href: "/admin/artists",
      icon: "🎤",
    },
    {
      title: "Songs",
      description: "Add and manage songs and releases.",
      count: songsResult.count ?? 0,
      href: "/admin/songs",
      icon: "🎵",
    },
    {
      title: "RAP SCENE TOP 50",
      description: "Manage weekly chart rankings.",
      count: chartsResult.count ?? 0,
      href: "/admin/charts",
      icon: "📊",
    },
    {
      title: "Trending Artists",
      description: "Manage weekly artist rankings.",
      count: trendingResult.count ?? 0,
      href: "/admin/trending",
      icon: "🔥",
    },
    {
      title: "Albums",
      description: "Manage albums and projects.",
      count: albumsResult.count ?? 0,
      href: "/admin/albums",
      icon: "💿",
    },
    {
      title: "Music Videos",
      description: "Manage music videos and YouTube links.",
      count: videosResult.count ?? 0,
      href: "/admin/videos",
      icon: "🎬",
    },
    {
      title: "News",
      description: "Publish RAP SCENE news and features.",
      count: newsResult.count ?? 0,
      href: "/admin/news",
      icon: "📰",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter md:text-3xl"
          >
            RAP SCENE
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-400 sm:block">
              {profile.name || user.email}
            </span>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:border-white hover:bg-white hover:text-black"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-zinc-500">
            Administration
          </p>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Manage the artists, music, charts, videos, and news published on
            RAP SCENE.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-2xl">
                  {card.icon}
                </div>

                <span className="text-2xl font-black">
                  {card.count}
                </span>
              </div>

              <h2 className="mt-6 text-xl font-black">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {card.description}
              </p>

              <div className="mt-6 text-sm font-bold text-white transition group-hover:translate-x-1">
                Manage →
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Access */}
        <div className="mt-12 border-t border-zinc-800 pt-8">
          <h2 className="text-xl font-black">
            Quick Access
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:border-white hover:bg-white hover:text-black"
            >
              View Website
            </Link>

            <Link
              href="/admin/hero"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:border-white hover:bg-white hover:text-black"
            >
              Manage Hero
            </Link>

            <Link
              href="/admin/charts"
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-zinc-200"
            >
              Manage TOP 50
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}