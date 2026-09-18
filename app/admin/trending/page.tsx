"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Artist = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
};

type TrendingArtist = {
  id: string;
  artist_id: string;
  chart_date: string;
  rank: number;
  score: number;
  artists: {
    name: string;
    photo_url: string | null;
  } | null;
};

const MAX_RANK = 50;

export default function TrendingArtistsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [trendingArtists, setTrendingArtists] = useState<
    TrendingArtist[]
  >([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const [artistId, setArtistId] = useState("");
  const [rank, setRank] = useState("1");
  const [score, setScore] = useState("100");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [artistSearch, setArtistSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Load artists and trending dates.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInitialData();
  }, []);

  /*
   * Load rankings whenever the selected date changes.
   */
  useEffect(() => {
    if (!selectedDate) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTrendingArtists(selectedDate);
  }, [selectedDate]);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    const [
      { data: artistData, error: artistError },
      { data: trendingData, error: trendingError },
    ] = await Promise.all([
      supabase
        .from("artists")
        .select("id, name, slug, photo_url")
        .order("name", { ascending: true }),

      supabase
        .from("artist_trending")
        .select("chart_date")
        .order("chart_date", { ascending: false }),
    ]);

    if (artistError) {
      setError(artistError.message);
      setLoading(false);
      return;
    }

    if (trendingError) {
      setError(trendingError.message);
      setLoading(false);
      return;
    }

    const uniqueDates = Array.from(
      new Set((trendingData ?? []).map((item) => item.chart_date))
    );

    setArtists(artistData ?? []);
    setAvailableDates(uniqueDates);

    /*
     * Automatically select the newest existing date.
     * If there are no rankings yet, use today's date.
     */
    if (uniqueDates.length > 0) {
      setSelectedDate(uniqueDates[0]);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }

    setLoading(false);
  }

  async function loadTrendingArtists(date: string) {
    setError("");

    const { data, error: fetchError } = await supabase
      .from("artist_trending")
      .select(
        `
        id,
        artist_id,
        chart_date,
        rank,
        score,
        artists (
          name,
          photo_url
        )
      `
      )
      .eq("chart_date", date)
      .order("rank", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setTrendingArtists(
      (data ?? []) as unknown as TrendingArtist[]
    );
  }

  function resetForm() {
    setArtistId("");
    setRank("1");
    setScore("100");
    setEditingId(null);
    setArtistSearch("");
  }

  function startEditing(item: TrendingArtist) {
    setEditingId(item.id);
    setArtistId(item.artist_id);
    setRank(String(item.rank));
    setScore(String(item.score));
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedDate) {
      setError("Please select a chart date.");
      return;
    }

    if (!artistId) {
      setError("Please select an artist.");
      return;
    }

    const numericRank = Number(rank);
    const numericScore = Number(score);

    if (
      !Number.isInteger(numericRank) ||
      numericRank < 1 ||
      numericRank > MAX_RANK
    ) {
      setError(`Rank must be between 1 and ${MAX_RANK}.`);
      return;
    }

    if (!Number.isFinite(numericScore) || numericScore < 0) {
      setError("Score must be a valid number greater than or equal to 0.");
      return;
    }

    /*
     * Prevent duplicate artist/rank combinations.
     */
    const duplicateArtist = trendingArtists.some(
      (item) =>
        item.artist_id === artistId &&
        item.id !== editingId
    );

    if (duplicateArtist) {
      setError(
        "This artist is already included in this trending ranking."
      );
      return;
    }

    const duplicateRank = trendingArtists.some(
      (item) =>
        item.rank === numericRank &&
        item.id !== editingId
    );

    if (duplicateRank) {
      setError(
        `Rank #${numericRank} is already being used for this date.`
      );
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error: updateError } = await supabase
        .from("artist_trending")
        .update({
          artist_id: artistId,
          chart_date: selectedDate,
          rank: numericRank,
          score: numericScore,
        })
        .eq("id", editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setMessage("Trending artist updated successfully.");
    } else {
      const { error: insertError } = await supabase
        .from("artist_trending")
        .insert({
          artist_id: artistId,
          chart_date: selectedDate,
          rank: numericRank,
          score: numericScore,
        });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setMessage("Trending artist added successfully.");
    }

    await loadTrendingArtists(selectedDate);

    /*
     * Refresh available dates in case a new date was created.
     */
    const { data: dateData } = await supabase
      .from("artist_trending")
      .select("chart_date")
      .order("chart_date", { ascending: false });

    const uniqueDates = Array.from(
      new Set((dateData ?? []).map((item) => item.chart_date))
    );

    setAvailableDates(uniqueDates);

    resetForm();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this trending artist from the selected ranking?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    const { error: deleteError } = await supabase
      .from("artist_trending")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage("Trending artist deleted.");

    await loadTrendingArtists(selectedDate);
  }

  function handleDateChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedDate(event.target.value);
    resetForm();
    setMessage("");
    setError("");
  }

  function handleNewDate() {
    const newDate = window.prompt(
      "Enter the new trending chart date (YYYY-MM-DD):"
    );

    if (!newDate) return;

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(newDate)) {
      setError("Please use the format YYYY-MM-DD.");
      return;
    }

    setSelectedDate(newDate);
    resetForm();
    setMessage("");
    setError("");
  }

  const filteredArtists = artists.filter((artist) =>
    artist.name
      .toLowerCase()
      .includes(artistSearch.toLowerCase())
  );

  const sortedTrendingArtists = [...trendingArtists].sort(
    (a, b) => a.rank - b.rank
  );

  return (
    <main className="min-h-screen bg-neutral-100 text-black">
      {/* HEADER */}
      <header className="border-b border-black bg-black px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400">
              RAP SCENE ADMIN
            </p>

            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight">
              Trending Artists
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="border border-white px-4 py-2 text-xs font-black uppercase tracking-wider transition hover:bg-white hover:text-black"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {/* MESSAGES */}
        {message && (
          <div className="mb-6 border border-black bg-white px-5 py-4 text-sm font-bold">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 border border-red-500 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* TOP CONTROLS */}
        <section className="border border-black bg-white">
          <div className="border-b border-black p-5 md:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                  Weekly Ranking
                </p>

                <h2 className="mt-1 text-3xl font-black uppercase tracking-tight">
                  Trending Artists
                </h2>
              </div>

              <button
                type="button"
                onClick={handleNewDate}
                className="w-fit bg-black px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-neutral-800"
              >
                + New Chart Date
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            {/* DATE */}
            <div>
              <label
                htmlFor="chart-date"
                className="mb-2 block text-xs font-black uppercase tracking-wider"
              >
                Chart Date
              </label>

              {availableDates.length > 0 ? (
                <select
                  id="chart-date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full border border-black bg-white px-4 py-3 text-sm font-bold outline-none"
                >
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}

                  {!availableDates.includes(selectedDate) && (
                    <option value={selectedDate}>
                      {selectedDate} — New
                    </option>
                  )}
                </select>
              ) : (
                <input
                  id="chart-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    resetForm();
                  }}
                  className="w-full border border-black px-4 py-3 text-sm font-bold outline-none"
                />
              )}
            </div>

            {/* COUNT */}
            <div className="flex items-end">
              <div className="w-full border border-black bg-neutral-100 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  Artists in this ranking
                </p>

                <p className="mt-1 text-2xl font-black">
                  {trendingArtists.length} / {MAX_RANK}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ADD / EDIT FORM */}
        <section className="mt-6 border border-black bg-white">
          <div className="border-b border-black p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
              {editingId ? "Edit Entry" : "Add Entry"}
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
              {editingId
                ? "Edit Trending Artist"
                : "Add Trending Artist"}
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 p-5 md:grid-cols-4 md:p-6"
          >
            {/* ARTIST */}
            <div className="md:col-span-2">
              <label
                htmlFor="artist-search"
                className="mb-2 block text-xs font-black uppercase tracking-wider"
              >
                Artist
              </label>

              <input
                id="artist-search"
                type="text"
                value={artistSearch}
                onChange={(event) =>
                  setArtistSearch(event.target.value)
                }
                placeholder="Search artist..."
                className="mb-2 w-full border border-black px-4 py-3 text-sm outline-none"
              />

              <select
                value={artistId}
                onChange={(event) =>
                  setArtistId(event.target.value)
                }
                className="w-full border border-black bg-white px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="">Select artist</option>

                {filteredArtists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </div>

            {/* RANK */}
            <div>
              <label
                htmlFor="rank"
                className="mb-2 block text-xs font-black uppercase tracking-wider"
              >
                Rank
              </label>

              <input
                id="rank"
                type="number"
                min="1"
                max={MAX_RANK}
                value={rank}
                onChange={(event) => setRank(event.target.value)}
                className="w-full border border-black px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            {/* SCORE */}
            <div>
              <label
                htmlFor="score"
                className="mb-2 block text-xs font-black uppercase tracking-wider"
              >
                Score
              </label>

              <input
                id="score"
                type="number"
                min="0"
                step="0.01"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                className="w-full border border-black px-4 py-3 text-sm font-bold outline-none"
              />
            </div>

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-3 md:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-black px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Artist"
                    : "Add Artist"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border-2 border-black px-6 py-3 text-xs font-black uppercase tracking-wider transition hover:bg-black hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* CURRENT RANKING */}
        <section className="mt-6 border border-black bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-black p-5 md:flex-row md:items-center md:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                Current Ranking
              </p>

              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
                {selectedDate}
              </h2>
            </div>

            <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
              {trendingArtists.length} entries
            </span>
          </div>

          {loading ? (
            <div className="p-8">
              <p className="text-sm font-bold uppercase">
                Loading...
              </p>
            </div>
          ) : sortedTrendingArtists.length === 0 ? (
            <div className="p-8">
              <p className="text-sm font-bold uppercase">
                No trending artists for this date.
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Add your first artist using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[850px]">
                <div className="grid grid-cols-[80px_1fr_120px_100px_180px] border-b border-black bg-black px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white">
                  <div>Rank</div>
                  <div>Artist</div>
                  <div>Score</div>
                  <div>Photo</div>
                  <div>Actions</div>
                </div>

                {sortedTrendingArtists.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[80px_1fr_120px_100px_180px] items-center border-b border-black px-5 py-4"
                  >
                    {/* RANK */}
                    <div className="text-3xl font-black tracking-tighter">
                      {String(item.rank).padStart(2, "0")}
                    </div>

                    {/* ARTIST */}
                    <div>
                      <p className="text-base font-black uppercase">
                        {item.artists?.name ?? "Unknown Artist"}
                      </p>

                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        {item.chart_date}
                      </p>
                    </div>

                    {/* SCORE */}
                    <div className="text-lg font-black">
                      {item.score}
                    </div>

                    {/* PHOTO */}
                    <div>
                      {item.artists?.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.artists.photo_url}
                          alt={item.artists.name}
                          className="h-12 w-12 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center bg-black text-[8px] font-black uppercase text-white">
                          RAP
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        className="border border-black px-4 py-2 text-[10px] font-black uppercase tracking-wider transition hover:bg-black hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="border border-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-red-600 transition hover:bg-red-600 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}