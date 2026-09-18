import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NewsArticlePage({
  params,
}: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from("news")
    .select(
      `
        id,
        title,
        slug,
        category,
        featured_image_url,
        excerpt,
        content,
        author,
        published_at
      `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !article) {
    notFound();
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <main className="min-h-screen bg-white text-black">
      

      {/* ARTICLE */}
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* CATEGORY */}
        <div className="mb-5">
          <span className="inline-block bg-black px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
            {article.category}
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {article.title}
        </h1>

        {/* EXCERPT */}
        {article.excerpt && (
          <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
            {article.excerpt}
          </p>
        )}

        {/* META */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-gray-200 py-4 text-sm">
          {article.author && (
            <span className="font-bold">
              By {article.author}
            </span>
          )}

          {publishedDate && (
            <span className="text-gray-500">
              {publishedDate}
            </span>
          )}
        </div>

        {/* FEATURED IMAGE */}
        {article.featured_image_url ? (
          <div className="mt-8 overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-8 flex aspect-video items-center justify-center bg-black">
            <span className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              RAP SCENE
            </span>
          </div>
        )}

        {/* ARTICLE CONTENT */}
        {article.content && (
          <div className="mt-10">
            <div className="whitespace-pre-wrap text-base leading-8 text-gray-800 sm:text-lg sm:leading-9">
              {article.content}
            </div>
          </div>
        )}

        {/* BACK BUTTON */}
        <div className="mt-12 border-t border-black pt-6">
          <Link
            href="/news"
            className="inline-flex items-center bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
          >
            ← BACK TO NEWS
          </Link>
        </div>
      </article>

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