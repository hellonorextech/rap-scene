"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  featured_image_url: string | null;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  published_at: string | null;
  is_published: boolean;
  created_at: string;
};

type NewsForm = {
  title: string;
  slug: string;
  category: string;
  featured_image_url: string;
  excerpt: string;
  content: string;
  author: string;
  published_at: string;
  is_published: boolean;
};

const emptyForm: NewsForm = {
  title: "",
  slug: "",
  category: "News",
  featured_image_url: "",
  excerpt: "",
  content: "",
  author: "",
  published_at: "",
  is_published: false,
};

const categories = [
  "News",
  "Artists",
  "Music",
  "Music Videos",
  "Albums",
  "Charts",
  "Industry",
  "Events",
  "Features",
  "Interviews",
];

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(date: string | null) {
  if (!date) return "Not published";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminNewsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [form, setForm] = useState<NewsForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadArticles() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
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
        published_at,
        is_published,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setArticles([]);
    } else {
      setArticles((data || []) as NewsArticle[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadArticles();
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function startEdit(article: NewsArticle) {
    let localPublishedAt = "";

    if (article.published_at) {
      const date = new Date(article.published_at);

      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        localPublishedAt = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }

    setEditingId(article.id);

    setForm({
      title: article.title,
      slug: article.slug,
      category: article.category,
      featured_image_url: article.featured_image_url || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      author: article.author || "",
      published_at: localPublishedAt,
      is_published: article.is_published,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const title = event.target.value;

    setForm((current) => ({
      ...current,
      title,
      slug: editingId ? current.slug : makeSlug(title),
    }));
  }

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePublishedChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setForm((current) => ({
      ...current,
      is_published: event.target.checked,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const slug = form.slug.trim() || makeSlug(title);

    if (!title) {
      setError("Please enter a headline.");
      return;
    }

    if (!slug) {
      setError("Please enter a valid slug.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (
      form.featured_image_url.trim() &&
      !(
        form.featured_image_url.trim().startsWith("https://") ||
        form.featured_image_url.trim().startsWith("http://")
      )
    ) {
      setError(
        "Featured image URL must start with http:// or https://."
      );
      return;
    }

    if (form.is_published && !form.published_at) {
      setError(
        "Please choose a publication date and time before publishing."
      );
      return;
    }

    setSaving(true);

    let publishedAt: string | null = null;

    if (form.published_at) {
      const date = new Date(form.published_at);

      if (Number.isNaN(date.getTime())) {
        setError("Please enter a valid publication date and time.");
        setSaving(false);
        return;
      }

      publishedAt = date.toISOString();
    }

    const payload = {
      title,
      slug,
      category: form.category,
      featured_image_url: form.featured_image_url.trim() || null,
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim() || null,
      author: form.author.trim() || null,
      published_at: publishedAt,
      is_published: form.is_published,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("news")
        .update(payload)
        .eq("id", editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess("News article updated successfully.");
    } else {
      const { error: insertError } = await supabase
        .from("news")
        .insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setSuccess("News article added successfully.");
    }

    resetForm();

    await loadArticles();

    setSaving(false);
  }

  async function handleDelete(id: string) {
    const article = articles.find((item) => item.id === id);

    if (!article) return;

    const confirmed = window.confirm(
      `Delete "${article.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    const { error: deleteError } = await supabase
      .from("news")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setSuccess("News article deleted successfully.");

    await loadArticles();

    setDeletingId(null);
  }

  async function togglePublished(article: NewsArticle) {
    setError("");
    setSuccess("");

    if (!article.is_published && !article.published_at) {
      setError(
        "This article has no publication date. Edit it first and add a publication date."
      );
      return;
    }

    const { error: updateError } = await supabase
      .from("news")
      .update({
        is_published: !article.is_published,
      })
      .eq("id", article.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(
      article.is_published
        ? "Article unpublished."
        : "Article published."
    );

    await loadArticles();
  }

  const filteredArticles = articles.filter((article) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      article.title.toLowerCase().includes(query) ||
      article.slug.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      (article.author || "").toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href="/admin"
              className="mb-3 inline-block text-sm font-medium text-neutral-500 hover:text-neutral-950"
            >
              ← Back to Dashboard
            </a>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              News
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Manage RAP SCENE news, features, interviews, and stories.
            </p>
          </div>

          <button
            type="button"
            onClick={startAdd}
            className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800"
          >
            + Add News
          </button>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* FORM */}
        <section className="mb-10 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {editingId ? "Edit News Article" : "Add News Article"}
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Create a story for the RAP SCENE website.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={startAdd}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TITLE */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-bold"
              >
                Headline
              </label>

              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. Filipino Rap Artist Announces New Album"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            {/* SLUG + CATEGORY */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-bold"
                >
                  Slug
                </label>

                <input
                  id="slug"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="filipino-rap-artist-new-album"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                />

                <p className="mt-2 text-xs text-neutral-500">
                  Public URL: /news/{form.slug || "article-slug"}
                </p>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-bold"
                >
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* IMAGE */}
            <div>
              <label
                htmlFor="featured_image_url"
                className="mb-2 block text-sm font-bold"
              >
                Featured Image URL
              </label>

              <input
                id="featured_image_url"
                name="featured_image_url"
                type="url"
                value={form.featured_image_url}
                onChange={handleChange}
                placeholder="https://example.com/news-image.jpg"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Use a direct image URL. We can add Supabase image
                uploads later.
              </p>
            </div>

            {/* EXCERPT */}
            <div>
              <label
                htmlFor="excerpt"
                className="mb-2 block text-sm font-bold"
              >
                Excerpt
              </label>

              <textarea
                id="excerpt"
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                rows={3}
                placeholder="Short description that appears on news cards..."
                className="w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            {/* CONTENT */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-bold"
              >
                Article Content
              </label>

              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={12}
                placeholder="Write the full article here..."
                className="w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Plain text is supported for now. We can add a rich text
                editor later.
              </p>
            </div>

            {/* AUTHOR */}
            <div className="max-w-md">
              <label
                htmlFor="author"
                className="mb-2 block text-sm font-bold"
              >
                Author
              </label>

              <input
                id="author"
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="e.g. RAP SCENE"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            {/* PUBLISH DATE */}
            <div className="max-w-md">
              <label
                htmlFor="published_at"
                className="mb-2 block text-sm font-bold"
              >
                Publication Date & Time
              </label>

              <input
                id="published_at"
                name="published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Required when publishing an article.
              </p>
            </div>

            {/* PUBLISH TOGGLE */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={handlePublishedChange}
                className="mt-1 h-4 w-4"
              />

              <span>
                <span className="block text-sm font-bold">
                  Publish this article
                </span>

                <span className="mt-1 block text-xs text-neutral-500">
                  Published articles can appear on the public RAP
                  SCENE website.
                </span>
              </span>
            </label>

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Article"
                    : "Save Article"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* ARTICLES */}
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">
                Articles ({filteredArticles.length})
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage all RAP SCENE news articles.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              Loading articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
              <h3 className="text-lg font-black">
                No articles found
              </h3>

              <p className="mt-2 text-sm text-neutral-500">
                Add your first news article above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* IMAGE */}
                    <div className="relative aspect-video w-full bg-neutral-200 md:aspect-auto md:h-52 md:w-80 md:flex-shrink-0">
                      {article.featured_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-52 items-center justify-center bg-black px-6 text-center text-3xl font-black text-white">
                          RAP SCENE
                        </div>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                            {article.category}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              article.is_published
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {article.is_published
                              ? "Published"
                              : "Draft"}
                          </span>
                        </div>

                        <h3 className="text-xl font-black leading-tight">
                          {article.title}
                        </h3>

                        {article.excerpt && (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
                          <span>
                            Author:{" "}
                            <strong className="text-neutral-700">
                              {article.author || "RAP SCENE"}
                            </strong>
                          </span>

                          <span>
                            {formatDate(article.published_at)}
                          </span>
                        </div>

                        <p className="mt-3 break-all text-xs text-neutral-400">
                          /news/{article.slug}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(article)}
                          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-bold hover:bg-neutral-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void togglePublished(article)
                          }
                          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-bold hover:bg-neutral-50"
                        >
                          {article.is_published
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(article.id)}
                          disabled={deletingId === article.id}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === article.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
