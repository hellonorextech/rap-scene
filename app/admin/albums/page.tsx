"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Artist = {
  id: string;
  name: string;
  slug: string;
};

type Album = {
  id: string;
  title: string;
  slug: string;
  artist_id: string;
  cover_url: string | null;
  release_date: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  created_at: string;
};

type AlbumForm = {
  title: string;
  slug: string;
  artist_id: string;
  cover_url: string;
  release_date: string;
  spotify_url: string;
  apple_music_url: string;
};

const emptyForm: AlbumForm = {
  title: "",
  slug: "",
  artist_id: "",
  cover_url: "",
  release_date: "",
  spotify_url: "",
  apple_music_url: "",
};

export default function AdminAlbumsPage() {
  const supabase = createClient();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const [form, setForm] = useState<AlbumForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [albumsResult, artistsResult] = await Promise.all([
      supabase
        .from("albums")
        .select(
          `
            id,
            title,
            slug,
            artist_id,
            cover_url,
            release_date,
            spotify_url,
            apple_music_url,
            created_at
          `
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("artists")
        .select("id, name, slug")
        .order("name", {
          ascending: true,
        }),
    ]);

    if (albumsResult.error) {
      setError(albumsResult.error.message);
      setLoading(false);
      return;
    }

    if (artistsResult.error) {
      setError(artistsResult.error.message);
      setLoading(false);
      return;
    }

    setAlbums((albumsResult.data ?? []) as Album[]);
    setArtists((artistsResult.data ?? []) as Artist[]);

    setLoading(false);
  }

  const artistMap = useMemo(() => {
    const map = new Map<string, Artist>();

    artists.forEach((artist) => {
      map.set(artist.id, artist);
    });

    return map;
  }, [artists]);

  const filteredAlbums = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return albums;
    }

    return albums.filter((album) => {
      const artistName =
        artistMap.get(album.artist_id)?.name ?? "";

      return (
        album.title.toLowerCase().includes(query) ||
        album.slug.toLowerCase().includes(query) ||
        artistName.toLowerCase().includes(query)
      );
    });
  }, [albums, search, artistMap]);

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

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      title: value,
      slug:
        editingId && current.slug
          ? current.slug
          : makeSlug(value),
    }));
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function startEdit(album: Album) {
    setEditingId(album.id);

    setForm({
      title: album.title,
      slug: album.slug,
      artist_id: album.artist_id,
      cover_url: album.cover_url ?? "",
      release_date: album.release_date ?? "",
      spotify_url: album.spotify_url ?? "",
      apple_music_url: album.apple_music_url ?? "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const slug = makeSlug(form.slug);

    if (!title) {
      setError("Album title is required.");
      return;
    }

    if (!slug) {
      setError("Album slug is required.");
      return;
    }

    if (!form.artist_id) {
      setError("Please select an artist.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      slug,
      artist_id: form.artist_id,
      cover_url: form.cover_url.trim() || null,
      release_date: form.release_date || null,
      spotify_url: form.spotify_url.trim() || null,
      apple_music_url:
        form.apple_music_url.trim() || null,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("albums")
        .update(payload)
        .eq("id", editingId);
    } else {
      result = await supabase
        .from("albums")
        .insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      editingId
        ? "Album updated successfully."
        : "Album added successfully."
    );

    setEditingId(null);
    setForm(emptyForm);

    await loadData();

    setSaving(false);
  }

  async function handleDelete(album: Album) {
    const confirmed = window.confirm(
      `Delete "${album.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("albums")
      .delete()
      .eq("id", album.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess("Album deleted successfully.");

    if (editingId === album.id) {
      setEditingId(null);
      setForm(emptyForm);
    }

    await loadData();
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-black">
      {/* HEADER */}
      <header className="border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="text-2xl font-black tracking-[-0.08em]">
              RAP SCENE
            </p>

            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
              Admin / Albums
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/"
              target="_blank"
              className="hidden border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider transition hover:bg-black hover:text-white sm:block"
            >
              Website
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        {/* TITLE */}
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Content Management
          </p>

          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] md:text-6xl">
            Albums
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Add and manage albums that belong to artists on RAP
            SCENE.
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 border-2 border-red-600 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 border-2 border-green-600 bg-green-50 p-4 text-sm font-bold text-green-700">
            {success}
          </div>
        )}

        {/* FORM */}
        <section className="mb-10 border-2 border-black bg-white">
          <div className="flex items-center justify-between gap-4 border-b-2 border-black p-5 md:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                {editingId ? "Edit Album" : "Add Album"}
              </p>

              <h2 className="mt-1 text-2xl font-black uppercase">
                {editingId ? "Update Album" : "New Album"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={startAdd}
                className="border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 p-5 md:grid-cols-2 md:p-6"
          >
            {/* TITLE */}
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider">
                Album Title *
              </span>

              <input
                name="title"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="Album title"
                className="w-full border-2 border-black px-4 py-3 text-sm outline-none focus:bg-neutral-100"
              />
            </label>

            {/* ARTIST */}
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider">
                Artist *
              </span>

              <select
                name="artist_id"
                value={form.artist_id}
                onChange={handleChange}
                className="w-full border-2 border-black bg-white px-4 py-3 text-sm outline-none focus:bg-neutral-100"
              >
                <option value="">
                  Select artist
                </option>

                {artists.map((artist) => (
                  <option
                    key={artist.id}
                    value={artist.id}
                  >
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>

            {/* SLUG */}
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider">
                Slug *
              </span>

              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="album-slug"
                className="w-full border-2 border-black px-4 py-3 text-sm outline-none focus:bg-neutral-100"
              />

              <span className="mt-1 block text-[10px] font-bold uppercase text-neutral-500">
                Used for the public album URL.
              </span>
            </label>

            {/* RELEASE DATE */}
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider">
                Release Date
              </span>

              <input
                type="date"
                name="release_date"
                value={form.release_date}
                onChange={handleChange}
                className="w-full border-2 border-black px-4 py-3 text-sm outline-none focus:bg-neutral-100"
              />
            </label>

            {/* COVER URL */}
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider">
                Cover Image URL
              </span>

              <input
                name="cover_url"
                value={form.cover_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border-2 border-black px-4 py-3 text-sm outline-none focus:bg-neutral-100"
              />
            </label>

            {/* SPOTIFY */}
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider">
                Spotify URL
              </span>

              <input
                name="spotify_url"
                value={form.spotify_url}
                onChange={handleChange}
                placeholder="https://open.spotify.com/..."
                className="w-full border-2 border-black px-4 py-3 text-sm outline-none focus:bg-neutral-100"
              />
            </label>

            {/* APPLE MUSIC */}
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider">
                Apple Music URL
              </span>

              <input
                name="apple_music_url"
                value={form.apple_music_url}
                onChange={handleChange}
                placeholder="https://music.apple.com/..."
                className="w-full border-2 border-black px-4 py-3 text-sm outline-none focus:bg-neutral-100"
              />
            </label>

            {/* SUBMIT */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving || artists.length === 0}
                className="w-full border-2 border-black bg-black px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Album"
                    : "Add Album"}
              </button>

              {artists.length === 0 && (
                <p className="mt-2 text-center text-xs font-bold uppercase text-red-600">
                  Add an artist first before creating an
                  album.
                </p>
              )}
            </div>
          </form>
        </section>

        {/* ALBUM LIST */}
        <section className="border-2 border-black bg-white">
          <div className="flex flex-col gap-4 border-b-2 border-black p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                Library
              </p>

              <h2 className="mt-1 text-2xl font-black uppercase">
                All Albums
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-xs font-black uppercase text-neutral-500 sm:block">
                {filteredAlbums.length}{" "}
                {filteredAlbums.length === 1
                  ? "album"
                  : "albums"}
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search albums..."
                className="w-full border-2 border-black px-4 py-2 text-sm outline-none focus:bg-neutral-100 sm:w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-black uppercase">
              Loading albums...
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-black uppercase">
                No albums found.
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {filteredAlbums.map((album) => {
                const artist = artistMap.get(album.artist_id);

                return (
                  <div
                    key={album.id}
                    className="grid gap-5 p-5 md:grid-cols-[110px_1fr_auto] md:items-center md:p-6"
                  >
                    <div className="relative aspect-square overflow-hidden bg-neutral-100">
                      {album.cover_url ? (
                        <Image
                          src={album.cover_url}
                          alt={album.title}
                          fill
                          className="object-cover"
                          sizes="110px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-black text-center text-[10px] font-black text-white">
                          RAP SCENE
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black uppercase">
                        {album.title}
                      </h3>

                      <p className="mt-1 text-xs font-black uppercase text-neutral-500">
                        {artist?.name ?? "Unknown Artist"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase text-neutral-500">
                        <span>
                          Slug: {album.slug}
                        </span>

                        <span>
                          Release:{" "}
                          {formatDate(album.release_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => startEdit(album)}
                        className="border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider transition hover:bg-black hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(album)}
                        className="border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-wider transition hover:bg-red-600 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t-2 border-black bg-black px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-2xl font-black tracking-[-0.08em]">
              RAP SCENE
            </p>

            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Filipino Rap & Hip-Hop
            </p>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            © {new Date().getFullYear()} RAP SCENE
          </p>
        </div>
      </footer>
    </main>
  );
}