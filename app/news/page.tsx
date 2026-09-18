import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  featured_image_url: string | null;
  excerpt: string | null;
  author: string | null;
  published_at: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function NewsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news")
    .select(
      `
      id,
      title,
      slug,
      category,
      featured_image_url,
      excerpt,
      author,
      published_at
    `
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const articles = (data || []) as NewsArticle[];

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      {/* HEADER */}
      <header className="border-b border-neutral-200 bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-block text-sm font-bold text-neutral-400 transition hover:text-white"
          >
            ← RAP SCENE
          </Link>

          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400">
              Latest Stories
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">
              NEWS
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
              The latest news, stories, releases, interviews, and
              updates from the Filipino rap and hip-hop scene.
            </p>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Unable to load news articles.
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-10 text-center">
            <h2 className="text-2xl font-black">
              No published articles yet.
            </h2>

            <p className="mt-3 text-sm text-neutral-500">
              Published RAP SCENE stories will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* IMAGE */}
                <Link href={`/news/${article.slug}`}>
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {article.featured_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center">
                        <span className="text-3xl font-black tracking-tight text-white">
                          RAP SCENE
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* ARTICLE INFO */}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      {article.category}
                    </span>

                    {article.published_at && (
                      <span className="text-xs text-neutral-500">
                        {formatDate(article.published_at)}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-black leading-tight">
                    <Link
                      href={`/news/${article.slug}`}
                      className="transition hover:text-neutral-500"
                    >
                      {article.title}
                    </Link>
                  </h2>

                  {article.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                    <span className="text-xs font-medium text-neutral-500">
                      By {article.author || "RAP SCENE"}
                    </span>

                    <Link
                      href={`/news/${article.slug}`}
                      className="text-xs font-black uppercase tracking-wider text-black hover:underline"
                    >
                      Read Story →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 bg-black px-4 py-8 text-center text-sm text-neutral-500">
        <Link
          href="/"
          className="font-black tracking-wider text-white"
        >
          RAP SCENE
        </Link>

        <p className="mt-2">
          Filipino Rap & Hip-Hop Music Publication
        </p>

        <p className="mt-4 text-xs text-neutral-600">
          © {new Date().getFullYear()} RAP SCENE. All rights reserved.
        </p>
      </footer>
    </main>
  );
}