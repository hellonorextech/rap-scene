"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type Artist = {
  id: string;
  name: string;
};

type MusicVideo = {
  id: string;
  title: string;
  slug: string;
  artist_id: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  release_date: string | null;
  created_at: string;
  artists: Artist | null;
};

type VideoForm = {
  title: string;
  slug: string;
  artist_id: string;
  thumbnail_url: string;
  youtube_url: string;
  release_date: string;
};

const emptyForm: VideoForm = {
  title: "",
  slug: "",
  artist_id: "",
  thumbnail_url: "",
  youtube_url: "",
  release_date: "",
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminVideosPage() {
  const supabase = useMemo(() => createClient(), []);

  const [videos, setVideos] = useState<MusicVideo[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const [form, setForm] = useState<VideoForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const [videosResult, artistsResult] = await Promise.all([
      supabase
        .from("music_videos")
        .select(
          `
          id,
          title,
          slug,
          artist_id,
          thumbnail_url,
          youtube_url,
          release_date,
          created_at,
          artists (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("artists")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (videosResult.error) {
      setError(videosResult.error.message);
      setVideos([]);
    } else {
      setVideos((videosResult.data || []) as unknown as MusicVideo[]);
    }

    if (artistsResult.error) {
      setError(artistsResult.error.message);
      setArtists([]);
    } else {
      setArtists((artistsResult.data || []) as Artist[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function startEdit(video: MusicVideo) {
    setEditingId(video.id);

    setForm({
      title: video.title,
      slug: video.slug,
      artist_id: video.artist_id,
      thumbnail_url: video.thumbnail_url || "",
      youtube_url: video.youtube_url || "",
      release_date: video.release_date || "",
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
      setError("Please enter a video title.");
      return;
    }

    if (!slug) {
      setError("Please enter a valid slug.");
      return;
    }

    if (!form.artist_id) {
      setError("Please select an artist.");
      return;
    }

    if (
      form.youtube_url.trim() &&
      !(
        form.youtube_url.trim().startsWith("https://") ||
        form.youtube_url.trim().startsWith("http://")
      )
    ) {
      setError("YouTube URL must start with http:// or https://.");
      return;
    }

    if (
      form.thumbnail_url.trim() &&
      !(
        form.thumbnail_url.trim().startsWith("https://") ||
        form.thumbnail_url.trim().startsWith("http://")
      )
    ) {
      setError("Thumbnail URL must start with http:// or https://.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      slug,
      artist_id: form.artist_id,
      thumbnail_url: form.thumbnail_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
      release_date: form.release_date || null,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("music_videos")
        .update(payload)
        .eq("id", editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess("Music video updated successfully.");
    } else {
      const { error: insertError } = await supabase
        .from("music_videos")
        .insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setSuccess("Music video added successfully.");
    }

    resetForm();
    await loadData();

    setSaving(false);
  }

  async function handleDelete(id: string) {
    const video = videos.find((item) => item.id === id);

    if (!video) return;

    const confirmed = window.confirm(
      `Delete "${video.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    const { error: deleteError } = await supabase
      .from("music_videos")
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

    setSuccess("Music video deleted successfully.");

    await loadData();

    setDeletingId(null);
  }

  const filteredVideos = videos.filter((video) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      video.title.toLowerCase().includes(query) ||
      video.slug.toLowerCase().includes(query) ||
      (video.artists?.name || "").toLowerCase().includes(query)
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
              Music Videos
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Manage music videos displayed on RAP SCENE.
            </p>
          </div>

          <button
            type="button"
            onClick={startAdd}
            className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800"
          >
            + Add Music Video
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
                {editingId ? "Edit Music Video" : "Add Music Video"}
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Enter the information for the music video.
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
            {/* TITLE + ARTIST */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-bold"
                >
                  Video Title
                </label>

                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Test Song Official Music Video"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="artist_id"
                  className="mb-2 block text-sm font-bold"
                >
                  Artist
                </label>

                <select
                  id="artist_id"
                  name="artist_id"
                  value={form.artist_id}
                  onChange={handleChange}
                  disabled={artists.length === 0}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black disabled:bg-neutral-100"
                >
                  <option value="">Select artist</option>

                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>

                {artists.length === 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    Add an artist first before creating a music video.
                  </p>
                )}
              </div>
            </div>

            {/* SLUG */}
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
                placeholder="test-song-official-music-video"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Used for the public video page URL.
              </p>
            </div>

            {/* THUMBNAIL */}
            <div>
              <label
                htmlFor="thumbnail_url"
                className="mb-2 block text-sm font-bold"
              >
                Thumbnail URL
              </label>

              <input
                id="thumbnail_url"
                name="thumbnail_url"
                type="url"
                value={form.thumbnail_url}
                onChange={handleChange}
                placeholder="https://example.com/video-thumbnail.jpg"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                For testing, you can use a direct image URL.
              </p>
            </div>

            {/* YOUTUBE */}
            <div>
              <label
                htmlFor="youtube_url"
                className="mb-2 block text-sm font-bold"
              >
                YouTube URL
              </label>

              <input
                id="youtube_url"
                name="youtube_url"
                type="url"
                value={form.youtube_url}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-500">
                Paste the normal YouTube video URL.
              </p>
            </div>

            {/* RELEASE DATE */}
            <div className="max-w-sm">
              <label
                htmlFor="release_date"
                className="mb-2 block text-sm font-bold"
              >
                Release Date
              </label>

              <input
                id="release_date"
                name="release_date"
                type="date"
                value={form.release_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            {/* BUTTON */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || artists.length === 0}
                className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Music Video"
                    : "Save Music Video"}
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

        {/* LIST */}
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">
                Music Videos ({filteredVideos.length})
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage your published and upcoming music videos.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search videos..."
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              Loading music videos...
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
              <h3 className="text-lg font-black">
                No music videos found
              </h3>

              <p className="mt-2 text-sm text-neutral-500">
                Add your first music video above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <article
                  key={video.id}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* THUMBNAIL */}
                    <div className="relative aspect-video w-full bg-neutral-200 sm:aspect-auto sm:h-40 sm:w-64 sm:flex-shrink-0">
                      {video.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-40 items-center justify-center bg-black text-4xl">
                          ▶
                        </div>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black">
                              {video.title}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-neutral-500">
                              {video.artists?.name || "Unknown Artist"}
                            </p>
                          </div>

                          {video.release_date && (
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
                              {video.release_date}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 break-all text-xs text-neutral-400">
                          /videos/{video.slug}
                        </p>

                        {video.youtube_url && (
                          <a
                            href={video.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-sm font-bold text-red-600 hover:underline"
                          >
                            ▶ Watch on YouTube
                          </a>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(video)}
                          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-bold hover:bg-neutral-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(video.id)}
                          disabled={deletingId === video.id}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === video.id
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