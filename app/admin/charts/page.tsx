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

type Song = {
  id: string;
  title: string;
  artist_id: string;
  artists: {
    name: string;
  } | null;
};

type Chart = {
  id: string;
  name: string;
  chart_date: string;
  created_at: string;
};

type ChartEntry = {
  id: string;
  chart_id: string;
  song_id: string;
  rank: number;
  last_week_rank: number | null;
  peak_rank: number | null;
  weeks_on_chart: number;
  songs: {
    title: string;
    artists: {
      name: string;
    } | null;
  } | null;
};

type EntryForm = {
  song_id: string;
  rank: string;
  last_week_rank: string;
  peak_rank: string;
  weeks_on_chart: string;
};

const supabase = createClient();

const emptyEntryForm: EntryForm = {
  song_id: "",
  rank: "",
  last_week_rank: "",
  peak_rank: "",
  weeks_on_chart: "1",
};

export default function AdminChartsPage() {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [entries, setEntries] = useState<ChartEntry[]>([]);

  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

  const [chartDate, setChartDate] = useState("");
  const [entryForm, setEntryForm] =
    useState<EntryForm>(emptyEntryForm);

  const [editingEntryId, setEditingEntryId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load charts and songs.
   */
  const loadBaseData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [chartsResult, songsResult] = await Promise.all([
      supabase
        .from("charts")
        .select("id, name, chart_date, created_at")
        .eq("name", "RAP SCENE TOP 50")
        .order("chart_date", { ascending: false }),

      supabase
        .from("songs")
        .select(
          `
          id,
          title,
          artist_id,
          artists (
            name
          )
        `
        )
        .order("title", { ascending: true }),
    ]);

    if (chartsResult.error) {
      console.error("Load charts error:", chartsResult.error);
      setError(chartsResult.error.message);
      setLoading(false);
      return;
    }

    if (songsResult.error) {
      console.error("Load songs error:", songsResult.error);
      setError(songsResult.error.message);
      setLoading(false);
      return;
    }

    const loadedCharts = (chartsResult.data ?? []) as Chart[];

    setCharts(loadedCharts);
    setSongs((songsResult.data ?? []) as unknown as Song[]);

    /*
     * Automatically select newest chart.
     */
    if (loadedCharts.length > 0) {
      setSelectedChartId((current) => current ?? loadedCharts[0].id);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBaseData();
  }, [loadBaseData]);

  /*
   * Load entries for selected chart.
   */
  const loadEntries = useCallback(async () => {
    if (!selectedChartId) {
      setEntries([]);
      return;
    }

    setLoadingEntries(true);
    setError("");

    const { data, error: entriesError } = await supabase
      .from("chart_entries")
      .select(
        `
        id,
        chart_id,
        song_id,
        rank,
        last_week_rank,
        peak_rank,
        weeks_on_chart,
        songs (
          title,
          artists (
            name
          )
        )
      `
      )
      .eq("chart_id", selectedChartId)
      .order("rank", { ascending: true });

    if (entriesError) {
      console.error("Load chart entries error:", entriesError);
      setError(entriesError.message);
      setLoadingEntries(false);
      return;
    }

    setEntries((data ?? []) as unknown as ChartEntry[]);
    setLoadingEntries(false);
  }, [selectedChartId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEntries();
  }, [loadEntries]);

  /*
   * Current selected chart.
   */
  const selectedChart = useMemo(() => {
    return charts.find((chart) => chart.id === selectedChartId) ?? null;
  }, [charts, selectedChartId]);

  /*
   * Search songs.
   */
  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return songs;
    }

    return songs.filter((song) => {
      const artistName = song.artists?.name ?? "";

      return (
        song.title.toLowerCase().includes(query) ||
        artistName.toLowerCase().includes(query)
      );
    });
  }, [songs, search]);

  /*
   * Songs already in the selected chart.
   */
  const usedSongIds = useMemo(() => {
    return new Set(entries.map((entry) => entry.song_id));
  }, [entries]);

  /*
   * Number of chart positions used.
   */
  const usedRanks = useMemo(() => {
    return new Set(entries.map((entry) => entry.rank));
  }, [entries]);

  /*
   * Update entry form.
   */
  function updateEntryField(
    field: keyof EntryForm,
    value: string,
  ) {
    setEntryForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
   * Create a new weekly chart.
   */
  async function handleCreateChart(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    if (!chartDate) {
      setError("Please select a chart date.");
      setSaving(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("charts")
      .insert({
        name: "RAP SCENE TOP 50",
        chart_date: chartDate,
      })
      .select("id, name, chart_date, created_at")
      .single();

    if (insertError) {
      console.error("Create chart error:", insertError);
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const newChart = data as Chart;

    setCharts((current) => {
      return [newChart, ...current].sort(
        (a, b) =>
          new Date(b.chart_date).getTime() -
          new Date(a.chart_date).getTime(),
      );
    });

    setSelectedChartId(newChart.id);
    setChartDate("");
    setEntries([]);
    setEntryForm(emptyEntryForm);

    setSuccess(
      `RAP SCENE TOP 50 for ${formatChartDate(
        newChart.chart_date,
      )} was created.`,
    );

    setSaving(false);
  }

  /*
   * Add or update chart entry.
   */
  async function handleEntrySubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    if (!selectedChartId) {
      setError("Please create or select a chart first.");
      setSaving(false);
      return;
    }

    if (!entryForm.song_id) {
      setError("Please select a song.");
      setSaving(false);
      return;
    }

    const rank = Number(entryForm.rank);
    const lastWeekRank =
      entryForm.last_week_rank.trim() === ""
        ? null
        : Number(entryForm.last_week_rank);

    const peakRank =
      entryForm.peak_rank.trim() === ""
        ? rank
        : Number(entryForm.peak_rank);

    const weeksOnChart = Number(entryForm.weeks_on_chart);

    if (!Number.isInteger(rank) || rank < 1 || rank > 50) {
      setError("Rank must be a whole number between 1 and 50.");
      setSaving(false);
      return;
    }

    if (
      lastWeekRank !== null &&
      (!Number.isInteger(lastWeekRank) ||
        lastWeekRank < 1 ||
        lastWeekRank > 50)
    ) {
      setError(
        "Last Week rank must be between 1 and 50, or left empty for NEW.",
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isInteger(peakRank) ||
      peakRank < 1 ||
      peakRank > 50
    ) {
      setError("Peak rank must be between 1 and 50.");
      setSaving(false);
      return;
    }

    if (
      !Number.isInteger(weeksOnChart) ||
      weeksOnChart < 1
    ) {
      setError("Weeks on chart must be at least 1.");
      setSaving(false);
      return;
    }

    /*
     * Prevent duplicate ranks.
     */
    const duplicateRank = entries.find(
      (entry) =>
        entry.rank === rank &&
        entry.id !== editingEntryId,
    );

    if (duplicateRank) {
      setError(`Rank #${rank} is already being used.`);
      setSaving(false);
      return;
    }

    /*
     * Prevent duplicate songs.
     */
    const duplicateSong = entries.find(
      (entry) =>
        entry.song_id === entryForm.song_id &&
        entry.id !== editingEntryId,
    );

    if (duplicateSong) {
      setError("That song is already in this chart.");
      setSaving(false);
      return;
    }

    const entryData = {
      chart_id: selectedChartId,
      song_id: entryForm.song_id,
      rank,
      last_week_rank: lastWeekRank,
      peak_rank: peakRank,
      weeks_on_chart: weeksOnChart,
    };

    if (editingEntryId) {
      const { error: updateError } = await supabase
        .from("chart_entries")
        .update(entryData)
        .eq("id", editingEntryId);

      if (updateError) {
        console.error(
          "Update chart entry error:",
          updateError,
        );
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess("Chart entry updated successfully.");
    } else {
      const { error: insertError } = await supabase
        .from("chart_entries")
        .insert(entryData);

      if (insertError) {
        console.error(
          "Insert chart entry error:",
          insertError,
        );
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setSuccess("Chart entry added successfully.");
    }

    setEntryForm(emptyEntryForm);
    setEditingEntryId(null);
    setSaving(false);

    await loadEntries();
  }

  /*
   * Edit an existing chart entry.
   */
  function startEditEntry(entry: ChartEntry) {
    setEditingEntryId(entry.id);

    setEntryForm({
      song_id: entry.song_id,
      rank: String(entry.rank),
      last_week_rank:
        entry.last_week_rank === null
          ? ""
          : String(entry.last_week_rank),
      peak_rank:
        entry.peak_rank === null
          ? String(entry.rank)
          : String(entry.peak_rank),
      weeks_on_chart: String(entry.weeks_on_chart),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * Cancel editing.
   */
  function cancelEntryEdit() {
    setEditingEntryId(null);
    setEntryForm(emptyEntryForm);
    setError("");
    setSuccess("");
  }

  /*
   * Delete chart entry.
   */
  async function deleteEntry(entry: ChartEntry) {
    const songTitle =
      entry.songs?.title ?? "this song";

    const confirmed = window.confirm(
      `Remove "${songTitle}" from rank #${entry.rank}?\n\nThe song itself will NOT be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("chart_entries")
      .delete()
      .eq("id", entry.id);

    if (deleteError) {
      console.error(
        "Delete chart entry error:",
        deleteError,
      );
      setError(deleteError.message);
      return;
    }

    if (editingEntryId === entry.id) {
      setEditingEntryId(null);
      setEntryForm(emptyEntryForm);
    }

    setSuccess(`"${songTitle}" was removed from the chart.`);

    await loadEntries();
  }

  /*
   * Delete entire chart.
   */
  async function deleteChart(chart: Chart) {
    const confirmed = window.confirm(
      `Delete the RAP SCENE TOP 50 chart dated ${formatChartDate(
        chart.chart_date,
      )}?\n\nAll chart entries for this week will also be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("charts")
      .delete()
      .eq("id", chart.id);

    if (deleteError) {
      console.error("Delete chart error:", deleteError);
      setError(deleteError.message);
      return;
    }

    const remainingCharts = charts
      .filter((item) => item.id !== chart.id)
      .sort(
        (a, b) =>
          new Date(b.chart_date).getTime() -
          new Date(a.chart_date).getTime(),
      );

    setCharts(remainingCharts);

    if (selectedChartId === chart.id) {
      setSelectedChartId(
        remainingCharts.length > 0
          ? remainingCharts[0].id
          : null,
      );

      setEntries([]);
    }

    setEntryForm(emptyEntryForm);
    setEditingEntryId(null);

    setSuccess(
      `Chart dated ${formatChartDate(
        chart.chart_date,
      )} was deleted.`,
    );
  }

  /*
   * Format date.
   */
  function formatChartDate(date: string) {
    return new Date(
      `${date}T00:00:00`,
    ).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  /*
   * Calculate movement.
   */
  function getMovement(
    currentRank: number,
    lastWeekRank: number | null,
  ) {
    if (lastWeekRank === null) {
      return null;
    }

    return lastWeekRank - currentRank;
  }

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
              RAP SCENE TOP 50
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manually manage weekly RAP SCENE song rankings.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Current Chart
            </p>

            <p className="mt-1 text-2xl font-black">
              {entries.length}/50
            </p>

            <p className="text-xs text-zinc-600">
              songs ranked
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

        {/* CREATE WEEKLY CHART */}
        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black">
              Create Weekly Chart
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create a new RAP SCENE TOP 50 chart for a specific
              week.
            </p>
          </div>

          <form
            onSubmit={handleCreateChart}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="chart_date"
                className="mb-2 block text-sm font-semibold text-zinc-300"
              >
                Chart Date *
              </label>

              <input
                id="chart_date"
                type="date"
                value={chartDate}
                onChange={(event) =>
                  setChartDate(event.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Chart"}
            </button>
          </form>
        </section>

        {/* EXISTING CHARTS */}
        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black">
              Weekly Charts
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Select a chart to manage its rankings.
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
              Loading charts...
            </div>
          ) : charts.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="font-semibold text-zinc-300">
                No weekly charts yet.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Create your first chart above.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {charts.map((chart) => {
                const selected =
                  chart.id === selectedChartId;

                return (
                  <div
                    key={chart.id}
                    className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      selected
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChartId(chart.id);
                        setEditingEntryId(null);
                        setEntryForm(emptyEntryForm);
                        setError("");
                        setSuccess("");
                      }}
                      className="text-left"
                    >
                      <p className="text-xs font-black uppercase tracking-wider opacity-60">
                        RAP SCENE TOP 50
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {formatChartDate(chart.chart_date)}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteChart(chart)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                        selected
                          ? "border-black text-black hover:bg-black hover:text-white"
                          : "border-red-900 text-red-400 hover:bg-red-950"
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SELECTED CHART */}
        {selectedChart && (
          <>
            {/* CHART HEADER */}
            <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                    Selected Chart
                  </p>

                  <h2 className="mt-2 text-3xl font-black uppercase tracking-tight">
                    RAP SCENE TOP 50
                  </h2>

                  <p className="mt-2 text-sm font-bold text-zinc-500">
                    {formatChartDate(
                      selectedChart.chart_date,
                    )}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-600">
                    Entries
                  </p>

                  <p className="text-4xl font-black">
                    {entries.length}
                    <span className="text-zinc-700">
                      /50
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* ADD / EDIT ENTRY */}
            <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-black">
                  {editingEntryId
                    ? "Edit Chart Entry"
                    : "Add Chart Entry"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {editingEntryId
                    ? "Update this song's chart position."
                    : "Add a song to the selected weekly chart."}
                </p>
              </div>

              <form onSubmit={handleEntrySubmit}>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {/* SONG */}
                  <div className="md:col-span-2 lg:col-span-4">
                    <label
                      htmlFor="song_id"
                      className="mb-2 block text-sm font-semibold text-zinc-300"
                    >
                      Song *
                    </label>

                    <select
                      id="song_id"
                      value={entryForm.song_id}
                      onChange={(event) =>
                        updateEntryField(
                          "song_id",
                          event.target.value,
                        )
                      }
                      required
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-white"
                    >
                      <option value="">
                        Select a song
                      </option>

                      {filteredSongs.map((song) => {
                        const alreadyUsed =
                          usedSongIds.has(song.id) &&
                          song.id !== entryForm.song_id;

                        return (
                          <option
                            key={song.id}
                            value={song.id}
                            disabled={alreadyUsed}
                          >
                            {song.title} —{" "}
                            {song.artists?.name ??
                              "Unknown Artist"}
                            {alreadyUsed
                              ? " (already added)"
                              : ""}
                          </option>
                        );
                      })}
                    </select>

                    <div className="mt-3">
                      <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Filter songs by title or artist..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                      />
                    </div>

                    {songs.length === 0 && (
                      <div className="mt-3 rounded-xl border border-yellow-900 bg-yellow-950/30 px-4 py-3 text-sm text-yellow-400">
                        No songs available. Add songs first
                        in the Songs Manager.
                      </div>
                    )}
                  </div>

                  {/* RANK */}
                  <div>
                    <label
                      htmlFor="rank"
                      className="mb-2 block text-sm font-semibold text-zinc-300"
                    >
                      Current Rank *
                    </label>

                    <input
                      id="rank"
                      type="number"
                      min="1"
                      max="50"
                      value={entryForm.rank}
                      onChange={(event) =>
                        updateEntryField(
                          "rank",
                          event.target.value,
                        )
                      }
                      placeholder="1"
                      required
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                    />
                  </div>

                  {/* LAST WEEK */}
                  <div>
                    <label
                      htmlFor="last_week_rank"
                      className="mb-2 block text-sm font-semibold text-zinc-300"
                    >
                      Last Week
                    </label>

                    <input
                      id="last_week_rank"
                      type="number"
                      min="1"
                      max="50"
                      value={entryForm.last_week_rank}
                      onChange={(event) =>
                        updateEntryField(
                          "last_week_rank",
                          event.target.value,
                        )
                      }
                      placeholder="Leave empty = NEW"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                    />

                    <p className="mt-1 text-xs text-zinc-600">
                      Empty = NEW
                    </p>
                  </div>

                  {/* PEAK */}
                  <div>
                    <label
                      htmlFor="peak_rank"
                      className="mb-2 block text-sm font-semibold text-zinc-300"
                    >
                      Peak *
                    </label>

                    <input
                      id="peak_rank"
                      type="number"
                      min="1"
                      max="50"
                      value={entryForm.peak_rank}
                      onChange={(event) =>
                        updateEntryField(
                          "peak_rank",
                          event.target.value,
                        )
                      }
                      placeholder="1"
                      required
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                    />
                  </div>

                  {/* WEEKS */}
                  <div>
                    <label
                      htmlFor="weeks_on_chart"
                      className="mb-2 block text-sm font-semibold text-zinc-300"
                    >
                      Weeks on Chart *
                    </label>

                    <input
                      id="weeks_on_chart"
                      type="number"
                      min="1"
                      value={entryForm.weeks_on_chart}
                      onChange={(event) =>
                        updateEntryField(
                          "weeks_on_chart",
                          event.target.value,
                        )
                      }
                      required
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-white"
                    />
                  </div>
                </div>

                {/* FORM BUTTONS */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      songs.length === 0 ||
                      entries.length >= 50 && !editingEntryId
                    }
                    className="rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingEntryId
                        ? "Update Entry"
                        : "Add to Top 50"}
                  </button>

                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={cancelEntryEdit}
                      disabled={saving}
                      className="rounded-xl border border-zinc-700 px-6 py-3 font-bold text-white transition hover:bg-zinc-900 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {entries.length >= 50 &&
                  !editingEntryId && (
                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-zinc-600">
                      This chart already contains 50 songs.
                    </p>
                  )}
              </form>
            </section>

            {/* CHART ENTRIES */}
            <section>
              <div className="mb-5">
                <h2 className="text-2xl font-black">
                  Chart Entries
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {entries.length} of 50 chart positions
                  filled.
                </p>
              </div>

              {loadingEntries ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center text-sm text-zinc-500">
                  Loading chart entries...
                </div>
              ) : entries.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
                  <p className="font-semibold text-zinc-300">
                    No songs in this chart yet.
                  </p>

                  <p className="mt-2 text-sm text-zinc-600">
                    Add your first song using the form
                    above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                  <div className="min-w-[900px]">
                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-[80px_1fr_120px_100px_100px_160px] border-b border-zinc-800 bg-zinc-950 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      <div>Rank</div>
                      <div>Song / Artist</div>
                      <div>Last Week</div>
                      <div>Peak</div>
                      <div>Weeks</div>
                      <div>Actions</div>
                    </div>

                    {/* TABLE ROWS */}
                    {entries.map((entry) => {
                      const movement = getMovement(
                        entry.rank,
                        entry.last_week_rank,
                      );

                      return (
                        <div
                          key={entry.id}
                          className="grid grid-cols-[80px_1fr_120px_100px_100px_160px] items-center border-b border-zinc-800 bg-black px-5 py-5 last:border-b-0 hover:bg-zinc-950"
                        >
                          {/* RANK */}
                          <div className="text-4xl font-black tracking-tighter">
                            {String(entry.rank).padStart(
                              2,
                              "0",
                            )}
                          </div>

                          {/* SONG */}
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black uppercase">
                              {entry.songs?.title ??
                                "Unknown Song"}
                            </h3>

                            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                              {entry.songs?.artists?.name ??
                                "Unknown Artist"}
                            </p>
                          </div>

                          {/* LAST WEEK */}
                          <div className="text-sm font-bold">
                            {entry.last_week_rank ===
                            null ? (
                              <span className="rounded-lg border border-zinc-800 px-2 py-1 text-xs">
                                NEW
                              </span>
                            ) : (
                              <div>
                                <span>
                                  #
                                  {
                                    entry.last_week_rank
                                  }
                                </span>

                                {movement !== null &&
                                  movement > 0 && (
                                    <span className="ml-2 text-xs text-green-400">
                                      ↑{movement}
                                    </span>
                                  )}

                                {movement !== null &&
                                  movement < 0 && (
                                    <span className="ml-2 text-xs text-red-400">
                                      ↓
                                      {Math.abs(
                                        movement,
                                      )}
                                    </span>
                                  )}

                                {movement === 0 && (
                                  <span className="ml-2 text-xs text-zinc-600">
                                    —
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* PEAK */}
                          <div className="text-sm font-bold">
                            #
                            {entry.peak_rank ??
                              entry.rank}
                          </div>

                          {/* WEEKS */}
                          <div className="text-sm font-bold">
                            {entry.weeks_on_chart}
                          </div>

                          {/* ACTIONS */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                startEditEntry(entry)
                              }
                              className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-zinc-800"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteEntry(entry)
                              }
                              className="rounded-xl border border-red-900 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-950"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}