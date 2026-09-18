"use client";

import Image from "next/image";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

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
  created_at: string;
};

type ArtistForm = {
  name: string;
  slug: string;
  photo_url: string;
  biography: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  spotify_url: string;
};

const emptyForm: ArtistForm = {
  name: "",
  slug: "",
  photo_url: "",
  biography: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  spotify_url: "",
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminArtistsPage() {
  const supabase = createClient();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArtistForm>(emptyForm);

  const loadArtists = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data,
      error: fetchError,
    } = await supabase
      .from("artists")
      .select(`
        id,
        name,
        slug,
        photo_url,
        biography,
        instagram_url,
        facebook_url,
        youtube_url,
        spotify_url,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message);
      setArtists([]);
    } else {
      setArtists((data ?? []) as Artist[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadArtists();
  }, [loadArtists]);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function startEdit(artist: Artist) {
    setEditingId(artist.id);

    setForm({
      name: artist.name,
      slug: artist.slug,
      photo_url: artist.photo_url ?? "",
      biography: artist.biography ?? "",
      instagram_url: artist.instagram_url ?? "",
      facebook_url: artist.facebook_url ?? "",
      youtube_url: artist.youtube_url ?? "",
      spotify_url: artist.spotify_url ?? "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function updateField(
    field: keyof ArtistForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        editingId !== null
          ? current.slug
          : makeSlug(value),
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const slug = form.slug.trim() || makeSlug(name);

    if (!name) {
      setError("Artist name is required.");
      return;
    }

    if (!slug) {
      setError("Artist slug is required.");
      return;
    }

    setSaving(true);

    const payload = {
      name,
      slug,
      photo_url: form.photo_url.trim() || null,
      biography: form.biography.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
      spotify_url: form.spotify_url.trim() || null,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("artists")
        .update(payload)
        .eq("id", editingId);

      if (updateError) {
        console.error(updateError);
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess("Artist updated successfully.");
    } else {
      const { error: insertError } = await supabase
        .from("artists")
        .insert(payload);

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setSuccess("Artist added successfully.");
    }

    setEditingId(null);
    setForm(emptyForm);

    await loadArtists();

    setSaving(false);
  }

  async function handleDelete(artist: Artist) {
    const confirmed = window.confirm(
      `Delete "${artist.name}"?\n\nThis may also delete related songs, albums, music videos, and chart/trending records because of the database relationships.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("artists")
      .delete()
      .eq("id", artist.id);

    if (deleteError) {
      console.error(deleteError);
      setError(deleteError.message);
      return;
    }

    if (editingId === artist.id) {
      setEditingId(null);
      setForm(emptyForm);
    }

    setSuccess("Artist deleted successfully.");

    await loadArtists();
  }

  const filteredArtists = artists.filter((artist) => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      artist.name.toLowerCase().includes(query) ||
      artist.slug.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-neutral-100 text-black">
      {/* HEADER */}
      <header className="border-b border-black bg-black px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
              RAP SCENE ADMIN
            </p>

            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight">
              Artists
            </h1>
          </div>

          <a
            href="/admin"
            className="border border-white px-4 py-2 text-sm font-bold uppercase transition hover:bg-white hover:text-black"
          >
            Dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* FORM */}
        <section className="border border-black bg-white">
          <div className="border-b border-black p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  {editingId ? "Edit Artist" : "Artist Management"}
                </p>

                <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
                  {editingId
                    ? "Edit Artist"
                    : "Add Artist"}
                </h2>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="border border-black px-4 py-2 text-sm font-bold uppercase transition hover:bg-black hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* NAME */}
              <div>
                <label
                  htmlFor="artist-name"
                  className="mb-2 block text-sm font-bold uppercase"
                >
                  Artist Name *
                </label>

                <input
                  id="artist-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="Example: Test Artist"
                  className="w-full border border-black px-4 py-3 outline-none focus:bg-neutral-100"
                  required
                />
              </div>

              {/* SLUG */}
              <div>
                <label
                  htmlFor="artist-slug"
                  className="mb-2 block text-sm font-bold uppercase"
                >
                  Slug *
                </label>

                <input
                  id="artist-slug"
                  type="text"
                  value={form.slug}
                  onChange={(event) =>
                    updateField(
                      "slug",
                      event.target.value
                    )
                  }
                  placeholder="test-artist"
                  className="w-full border border-black px-4 py-3 outline-none focus:bg-neutral-100"
                  required
                />
              </div>
            </div>

            {/* PHOTO */}
            <div>
              <label
                htmlFor="artist-photo"
                className="mb-2 block text-sm font-bold uppercase"
              >
                Photo URL
              </label>

              <input
                id="artist-photo"
                type="url"
                value={form.photo_url}
                onChange={(event) =>
                  updateField(
                    "photo_url",
                    event.target.value
                  )
                }
                placeholder="https://..."
                className="w-full border border-black px-4 py-3 outline-none focus:bg-neutral-100"
              />
            </div>

            {/* BIOGRAPHY */}
            <div>
              <label
                htmlFor="artist-biography"
                className="mb-2 block text-sm font-bold uppercase"
              >
                Biography
              </label>

              <textarea
                id="artist-biography"
                value={form.biography}
                onChange={(event) =>
                  updateField(
                    "biography",
                    event.target.value
                  )
                }
                placeholder="Write a short biography..."
                rows={5}
                className="w-full resize-y border border-black px-4 py-3 outline-none focus:bg-neutral-100"
              />
            </div>

            {/* SOCIAL LINKS */}
            <div>
              <p className="mb-4 text-sm font-bold uppercase">
                Social & Streaming Links
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="artist-instagram"
                    className="mb-2 block text-xs font-bold uppercase text-neutral-500"
                  >
                    Instagram
                  </label>

                  <input
                    id="artist-instagram"
                    type="url"
                    value={form.instagram_url}
                    onChange={(event) =>
                      updateField(
                        "instagram_url",
                        event.target.value
                      )
                    }
                    placeholder="https://instagram.com/..."
                    className="w-full border border-black px-4 py-3 outline-none focus:bg-neutral-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="artist-facebook"
                    className="mb-2 block text-xs font-bold uppercase text-neutral-500"
                  >
                    Facebook
                  </label>

                  <input
                    id="artist-facebook"
                    type="url"
                    value={form.facebook_url}
                    onChange={(event) =>
                      updateField(
                        "facebook_url",
                        event.target.value
                      )
                    }
                    placeholder="https://facebook.com/..."
                    className="w-full border border-black px-4 py-3 outline-none focus:bg-neutral-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="artist-youtube"
                    className="mb-2 block text-xs font-bold uppercase text-neutral-500"
                  >
                    YouTube
                  </label>

                  <input
                    id="artist-youtube"
                    type="url"
                    value={form.youtube_url}
                    onChange={(event) =>
                      updateField(
                        "youtube_url",
                        event.target.value
                      )
                    }
                    placeholder="https://youtube.com/..."
                    className="w-full border border-black px-4 py-3 outline-none focus:bg-neutral-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="artist-spotify"
                    className="mb-2 block text-xs font-bold uppercase text-neutral-500"
                  >
                    Spotify
                  </label>

                  <input
                    id="artist-spotify"
                    type="url"
                    value={form.spotify_url}
                    onChange={(event) =>
                      updateField(
                        "spotify_url",
                        event.target.value
                      )
                    }
                    placeholder="https://open.spotify.com/..."
                    className="w-full border border-black px-4 py-3 outline-none focus:bg-neutral-100"
                  />
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            {error && (
              <div className="border border-red-600 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="border border-green-600 bg-green-50 p-4 text-sm font-bold text-green-700">
                {success}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-black px-6 py-4 text-sm font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Artist"
                  : "Add Artist"}
            </button>
          </form>
        </section>

        {/* ARTIST LIST */}
        <section className="mt-10">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Database
              </p>

              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
                Artists
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                {artists.length} artist
                {artists.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="w-full sm:w-80">
              <label
                htmlFor="artist-search"
                className="sr-only"
              >
                Search artists
              </label>

              <input
                id="artist-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search artists..."
                className="w-full border border-black bg-white px-4 py-3 outline-none focus:bg-neutral-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="border border-black bg-white p-10 text-center">
              <p className="font-bold uppercase">
                Loading artists...
              </p>
            </div>
          ) : filteredArtists.length === 0 ? (
            <div className="border border-black bg-white p-10 text-center">
              <p className="font-bold uppercase">
                {artists.length === 0
                  ? "No artists found."
                  : "No artists match your search."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredArtists.map((artist) => (
                <article
                  key={artist.id}
                  className="overflow-hidden border border-black bg-white"
                >
                  {/* IMAGE */}
                  <div className="relative aspect-square bg-black">
                    {artist.photo_url ? (
                      <Image
                        src={artist.photo_url}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center text-3xl font-black text-white">
                        RAP SCENE
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                      Artist
                    </p>

                    <h3 className="mt-1 text-xl font-black uppercase tracking-tight">
                      {artist.name}
                    </h3>

                    <p className="mt-1 text-xs text-neutral-500">
                      /{artist.slug}
                    </p>

                    {artist.biography && (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                        {artist.biography}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {artist.instagram_url && (
                        <a
                          href={artist.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-black px-3 py-2 text-xs font-bold uppercase hover:bg-black hover:text-white"
                        >
                          Instagram
                        </a>
                      )}

                      {artist.facebook_url && (
                        <a
                          href={artist.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-black px-3 py-2 text-xs font-bold uppercase hover:bg-black hover:text-white"
                        >
                          Facebook
                        </a>
                      )}

                      {artist.youtube_url && (
                        <a
                          href={artist.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-black px-3 py-2 text-xs font-bold uppercase hover:bg-black hover:text-white"
                        >
                          YouTube
                        </a>
                      )}

                      {artist.spotify_url && (
                        <a
                          href={artist.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-black px-3 py-2 text-xs font-bold uppercase hover:bg-black hover:text-white"
                        >
                          Spotify
                        </a>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(artist)
                        }
                        className="border border-black px-4 py-3 text-sm font-bold uppercase transition hover:bg-black hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(artist)
                        }
                        className="border border-red-600 px-4 py-3 text-sm font-bold uppercase text-red-600 transition hover:bg-red-600 hover:text-white"
                      >
                        Delete
                      </button>
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