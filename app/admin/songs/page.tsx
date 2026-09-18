"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Artist = {
  id: string;
  name: string;
  slug: string;
};

type FeaturedArtistRecord = {
  id: string;
  song_id: string;
  artist_id: string;
};

type Song = {
  id: string;
  title: string;
  slug: string;
  artist_id: string;
  cover_url: string | null;
  release_date: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  apple_music_url: string | null;
  created_at: string;
  artists: {
    name: string;
  } | null;
};

type SongForm = {
  title: string;
  slug: string;
  artist_id: string;
  cover_url: string;
  release_date: string;
  spotify_url: string;
  youtube_url: string;
  apple_music_url: string;
};

const supabase = createClient();

const emptyForm: SongForm = {
  title: "",
  slug: "",
  artist_id: "",
  cover_url: "",
  release_date: "",
  spotify_url: "",
  youtube_url: "",
  apple_music_url: "",
};

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<
    FeaturedArtistRecord[]
  >([]);

  const [form, setForm] = useState<SongForm>(emptyForm);
  const [selectedFeaturingArtists, setSelectedFeaturingArtists] =
    useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [
      songsResult,
      artistsResult,
      featuredArtistsResult,
    ] = await Promise.all([
      supabase
        .from("songs")
        .select(
          `
          id,
          title,
          slug,
          artist_id,
          cover_url,
          release_date,
          spotify_url,
          youtube_url,
          apple_music_url,
          created_at,
          artists (
            name
          )
        `
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("artists")
        .select("id, name, slug")
        .order("name", { ascending: true }),

      supabase
        .from("song_featured_artists")
        .select("id, song_id, artist_id")
        .order("created_at", { ascending: true }),
    ]);

    if (songsResult.error) {
      console.error("Load songs error:", songsResult.error);
      setError(songsResult.error.message);
      setLoading(false);
      return;
    }

    if (artistsResult.error) {
      console.error("Load artists error:", artistsResult.error);
      setError(artistsResult.error.message);
      setLoading(false);
      return;
    }

    if (featuredArtistsResult.error) {
      console.error(
        "Load featuring artists error:",
        featuredArtistsResult.error
      );
      setError(featuredArtistsResult.error.message);
      setLoading(false);
      return;
    }

    setSongs((songsResult.data ?? []) as unknown as Song[]);
    setArtists(artistsResult.data ?? []);
    setFeaturedArtists(
      (featuredArtistsResult.data ??
        []) as FeaturedArtistRecord[]
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return songs;
    }

    return songs.filter((song) => {
      const artistName = song.artists?.name ?? "";

      const featuringNames = featuredArtists
        .filter((item) => item.song_id === song.id)
        .map((item) => {
          const artist = artists.find(
            (artistItem) => artistItem.id === item.artist_id
          );

          return artist?.name ?? "";
        })
        .join(" ");

      return (
        song.title.toLowerCase().includes(query) ||
        song.slug.toLowerCase().includes(query) ||
        artistName.toLowerCase().includes(query) ||
        featuringNames.toLowerCase().includes(query)
      );
    });
  }, [songs, search, featuredArtists, artists]);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function updateField(field: keyof SongForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug:
        editingId || current.slug
          ? current.slug
          : generateSlug(value),
    }));
  }

  function startEdit(song: Song) {
    setEditingId(song.id);

    setForm({
      title: song.title,
      slug: song.slug,
      artist_id: song.artist_id,
      cover_url: song.cover_url || "",
      release_date: song.release_date || "",
      spotify_url: song.spotify_url || "",
      youtube_url: song.youtube_url || "",
      apple_music_url: song.apple_music_url || "",
    });

    const existingFeaturingArtists = featuredArtists
      .filter((item) => item.song_id === song.id)
      .map((item) => item.artist_id)
      .filter((artistId) => artistId !== song.artist_id);

    setSelectedFeaturingArtists(existingFeaturingArtists);

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
    setSelectedFeaturingArtists([]);
    setError("");
    setSuccess("");
  }

  function toggleFeaturingArtist(artistId: string) {
    if (!artistId) {
      return;
    }

    if (artistId === form.artist_id) {
      setError(
        "The main artist cannot also be a featuring artist."
      );
      return;
    }

    setError("");

    setSelectedFeaturingArtists((current) => {
      if (current.includes(artistId)) {
        return current.filter((id) => id !== artistId);
      }

      return [...current, artistId];
    });
  }

  function removeFeaturingArtist(artistId: string) {
    setSelectedFeaturingArtists((current) =>
      current.filter((id) => id !== artistId)
    );
  }

  async function saveFeaturingArtists(songId: string) {
    const { error: deleteError } = await supabase
      .from("song_featured_artists")
      .delete()
      .eq("song_id", songId);

    if (deleteError) {
      throw deleteError;
    }

    if (selectedFeaturingArtists.length === 0) {
      return;
    }

    const uniqueArtistIds = Array.from(
      new Set(selectedFeaturingArtists)
    ).filter((artistId) => artistId !== form.artist_id);

    if (uniqueArtistIds.length === 0) {
      return;
    }

    const rows = uniqueArtistIds.map((artistId) => ({
      song_id: songId,
      artist_id: artistId,
    }));

    const { error: insertError } = await supabase
      .from("song_featured_artists")
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const slug = form.slug.trim();
    const artistId = form.artist_id.trim();

    if (!title) {
      setError("Song title is required.");
      setSaving(false);
      return;
    }

    if (!slug) {
      setError("Song slug is required.");
      setSaving(false);
      return;
    }

    if (!artistId) {
      setError("Please select a main artist.");
      setSaving(false);
      return;
    }

    if (selectedFeaturingArtists.includes(artistId)) {
      setError(
        "The main artist cannot also be a featuring artist."
      );
      setSaving(false);
      return;
    }

    const songData = {
      title,
      slug,
      artist_id: artistId,
      cover_url: form.cover_url.trim() || null,
      release_date: form.release_date || null,
      spotify_url: form.spotify_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
      apple_music_url: form.apple_music_url.trim() || null,
    };

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("songs")
          .update(songData)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        await saveFeaturingArtists(editingId);

        setSuccess("Song updated successfully.");
      } else {
        const { data: newSong, error: insertError } =
          await supabase
            .from("songs")
            .insert(songData)
            .select("id")
            .single();

        if (insertError) {
          throw insertError;
        }

        if (!newSong) {
          throw new Error(
            "Song was created, but its ID could not be retrieved."
          );
        }

        await saveFeaturingArtists(newSong.id);

        setSuccess("Song added successfully.");
      }
    } catch (submitError) {
      console.error("Save song error:", submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save song."
      );

      setSaving(false);
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    setSelectedFeaturingArtists([]);
    setSaving(false);

    await loadData();
  }

  async function deleteSong(song: Song) {
    const confirmed = window.confirm(
      `Delete "${song.title}"?\n\nThis song may also be removed from chart entries and featuring artist relationships because the database relationships use cascade deletion.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("songs")
      .delete()
      .eq("id", song.id);

    if (deleteError) {
      console.error("Delete song error:", deleteError);
      setError(deleteError.message);
      return;
    }

    if (editingId === song.id) {
      setEditingId(null);
      setForm(emptyForm);
      setSelectedFeaturingArtists([]);
    }

    setSuccess(`"${song.title}" was deleted.`);

    await loadData();
  }

  function getFeaturingArtistsForSong(songId: string) {
    return featuredArtists
      .filter((item) => item.song_id === songId)
      .map((item) =>
        artists.find(
          (artist) => artist.id === item.artist_id
        )
      )
      .filter(
        (artist): artist is Artist => artist !== undefined
      );
  }

  const availableFeaturingArtists = artists.filter(
    (artist) => artist.id !== form.artist_id
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-zinc-500 transition hover:text-white"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Songs
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Add and manage songs for RAP SCENE charts and artist
              profiles.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Songs
            </p>

            <p className="mt-1 text-2xl font-black">
              {songs.length}
            </p>
          </div>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
            {success}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-black">
              {editingId ? "Edit Song" : "Add Song"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {editingId
                ? "Update the song information and featuring artists below."
                : "Create a new song, connect it to a main artist, and optionally add featuring artists."}
            </p>
          </div>

          {artists.length === 0 ? (
            <div className="mb-6 rounded-xl border border-yellow-900 bg-yellow-950/30 px-4 py-4">
              <p className="text-sm font-bold text-yellow-300">
                No artists available.
              </p>

              <p className="mt-1 text-sm text-yellow-500">
                You need to create an artist before adding a song.
              </p>

              <Link
                href="/admin/artists"
                className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-zinc-200"
              >
                Manage Artists →
              </Link>
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              {/* TITLE */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Song Title *
                </label>

                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    handleTitleChange(event.target.value)
                  }
                  placeholder="Example: Lihim"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                />
              </div>

              {/* SLUG */}
              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Slug *
                </label>

                <input
                  id="slug"
                  type="text"
                  value={form.slug}
                  onChange={(event) =>
                    updateField("slug", event.target.value)
                  }
                  placeholder="example: lihim"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                />

                <p className="mt-1 text-xs text-zinc-600">
                  Used for the song URL.
                </p>
              </div>

              {/* MAIN ARTIST */}
              <div>
                <label
                  htmlFor="artist_id"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Main Artist *
                </label>

                <select
                  id="artist_id"
                  value={form.artist_id}
                  onChange={(event) => {
                    const newArtistId = event.target.value;

                    updateField("artist_id", newArtistId);

                    setSelectedFeaturingArtists((current) =>
                      current.filter(
                        (artistId) => artistId !== newArtistId
                      )
                    );
                  }}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-white"
                >
                  <option value="">Select main artist</option>

                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* RELEASE DATE */}
              <div>
                <label
                  htmlFor="release_date"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Release Date
                </label>

                <input
                  id="release_date"
                  type="date"
                  value={form.release_date}
                  onChange={(event) =>
                    updateField(
                      "release_date",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-white"
                />
              </div>

              {/* FEATURING ARTISTS */}
              <div className="md:col-span-2">
                <label
                  htmlFor="featuring_artists"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Featuring Artist(s)
                </label>

                <p className="mb-3 text-xs text-zinc-500">
                  Optional. You can select multiple artists. The
                  main artist cannot be selected here.
                </p>

                <select
                  id="featuring_artists"
                  value=""
                  onChange={(event) =>
                    toggleFeaturingArtist(event.target.value)
                  }
                  disabled={!form.artist_id}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {form.artist_id
                      ? "Select a featuring artist"
                      : "Select a main artist first"}
                  </option>

                  {availableFeaturingArtists.map((artist) => (
                    <option
                      key={artist.id}
                      value={artist.id}
                      disabled={selectedFeaturingArtists.includes(
                        artist.id
                      )}
                    >
                      {artist.name}
                      {selectedFeaturingArtists.includes(
                        artist.id
                      )
                        ? " ✓"
                        : ""}
                    </option>
                  ))}
                </select>

                {/* SELECTED FEATURING ARTISTS */}
                {selectedFeaturingArtists.length > 0 && (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">
                      Selected Featuring Artists
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selectedFeaturingArtists.map(
                        (artistId) => {
                          const artist = artists.find(
                            (item) => item.id === artistId
                          );

                          if (!artist) {
                            return null;
                          }

                          return (
                            <div
                              key={artist.id}
                              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-black px-3 py-2"
                            >
                              <span className="text-sm font-bold text-white">
                                {artist.name}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFeaturingArtist(
                                    artist.id
                                  )
                                }
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs font-black text-zinc-400 transition hover:bg-red-900 hover:text-white"
                                aria-label={`Remove ${artist.name}`}
                              >
                                ×
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <p className="mt-3 text-xs text-zinc-600">
                      Public display:
                      {" "}
                      <span className="text-zinc-400">
                        {artists.find(
                          (artist) =>
                            artist.id === form.artist_id
                        )?.name || "Main Artist"}
                        {selectedFeaturingArtists.length > 0
                          ? ` feat. ${selectedFeaturingArtists
                              .map(
                                (artistId) =>
                                  artists.find(
                                    (artist) =>
                                      artist.id === artistId
                                  )?.name
                              )
                              .filter(Boolean)
                              .join(" & ")}`
                          : ""}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* COVER URL */}
              <div className="md:col-span-2">
                <label
                  htmlFor="cover_url"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Cover Image URL
                </label>

                <input
                  id="cover_url"
                  type="url"
                  value={form.cover_url}
                  onChange={(event) =>
                    updateField(
                      "cover_url",
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                />

                <p className="mt-1 text-xs text-zinc-600">
                  Direct image URL for the song cover.
                </p>
              </div>

              {/* SPOTIFY */}
              <div>
                <label
                  htmlFor="spotify_url"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Spotify URL
                </label>

                <input
                  id="spotify_url"
                  type="url"
                  value={form.spotify_url}
                  onChange={(event) =>
                    updateField(
                      "spotify_url",
                      event.target.value
                    )
                  }
                  placeholder="https://open.spotify.com/..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                />
              </div>

              {/* YOUTUBE */}
              <div>
                <label
                  htmlFor="youtube_url"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  YouTube URL
                </label>

                <input
                  id="youtube_url"
                  type="url"
                  value={form.youtube_url}
                  onChange={(event) =>
                    updateField(
                      "youtube_url",
                      event.target.value
                    )
                  }
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                />
              </div>

              {/* APPLE MUSIC */}
              <div className="md:col-span-2">
                <label
                  htmlFor="apple_music_url"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Apple Music URL
                </label>

                <input
                  id="apple_music_url"
                  type="url"
                  value={form.apple_music_url}
                  onChange={(event) =>
                    updateField(
                      "apple_music_url",
                      event.target.value
                    )
                  }
                  placeholder="https://music.apple.com/..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving || artists.length === 0}
                className="rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Song"
                    : "Add Song"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-xl border border-zinc-700 px-6 py-3 font-bold text-white transition hover:bg-zinc-900 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* SONG LIST */}
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Song List
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {filteredSongs.length} song
                {filteredSongs.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="w-full sm:w-80">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search songs or artists..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center text-sm text-zinc-500">
              Loading songs...
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
              <p className="font-semibold text-zinc-300">
                No songs found.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                {search
                  ? "Try a different search."
                  : "Add your first song using the form above."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSongs.map((song) => {
                const songFeaturingArtists =
                  getFeaturingArtistsForSong(song.id);

                return (
                  <article
                    key={song.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        {/* COVER */}
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                          {song.cover_url ? (
                            <img
                              src={song.cover_url}
                              alt={song.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-700">
                              {song.title
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* INFORMATION */}
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-black uppercase">
                            {song.title}
                          </h3>

                          <p className="mt-1 text-sm font-bold uppercase tracking-wider text-zinc-500">
                            {song.artists?.name ??
                              "Unknown Artist"}

                            {songFeaturingArtists.length >
                              0 && (
                              <>
                                <span className="mx-2 text-zinc-700">
                                  feat.
                                </span>

                                {songFeaturingArtists
                                  .map(
                                    (artist) =>
                                      artist.name
                                  )
                                  .join(" & ")}
                              </>
                            )}
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            /songs/{song.slug}
                          </p>

                          {song.release_date && (
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                              Released{" "}
                              {new Date(
                                `${song.release_date}T00:00:00`
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {song.spotify_url && (
                              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                                Spotify
                              </span>
                            )}

                            {song.youtube_url && (
                              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                                YouTube
                              </span>
                            )}

                            {song.apple_music_url && (
                              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                                Apple Music
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(song)}
                          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteSong(song)}
                          className="rounded-xl border border-red-900 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-950"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}