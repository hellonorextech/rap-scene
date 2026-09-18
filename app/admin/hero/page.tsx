"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type HeroSettings = {
  id: string;
  image_url: string | null;
  is_visible: boolean;
  updated_at: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function AdminHeroPage() {
  const supabase = createClient();

  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const loadHero = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("hero_settings")
      .select(
        "id, image_url, is_visible, updated_at"
      )
      .order("updated_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message);
      setHero(null);
    } else {
      setHero(data as HeroSettings | null);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHero();
  }, [loadHero]);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Invalid file type. Please select a JPG, PNG, or WEBP image."
      );

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Image is too large. Maximum file size is 5 MB."
      );

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  async function uploadHero() {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Create a unique file name so every upload
       * gets its own Storage object.
       */
      const fileExtension =
        selectedFile.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const fileName = `hero-${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

      const filePath = fileName;

      /*
       * Upload to Supabase Storage.
       */
      const { error: uploadError } =
        await supabase.storage
          .from("hero-images")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type,
          });

      if (uploadError) {
        console.error(uploadError);
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      /*
       * Get the public URL.
       */
      const {
        data: publicUrlData,
      } = supabase.storage
        .from("hero-images")
        .getPublicUrl(filePath);

      const imageUrl =
        publicUrlData.publicUrl;

      /*
       * If there is an existing hero record,
       * update it.
       *
       * Otherwise create one.
       */
      if (hero?.id) {
        const { error: updateError } =
          await supabase
            .from("hero_settings")
            .update({
              image_url: imageUrl,
              is_visible: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", hero.id);

        if (updateError) {
          console.error(updateError);

          /*
           * Clean up the newly uploaded file if
           * the database update fails.
           */
          await supabase.storage
            .from("hero-images")
            .remove([filePath]);

          setError(updateError.message);
          setUploading(false);
          return;
        }
      } else {
        const { error: insertError } =
          await supabase
            .from("hero_settings")
            .insert({
              image_url: imageUrl,
              is_visible: true,
            });

        if (insertError) {
          console.error(insertError);

          await supabase.storage
            .from("hero-images")
            .remove([filePath]);

          setError(insertError.message);
          setUploading(false);
          return;
        }
      }

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "hero-image"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setSuccess(
        "Hero image uploaded successfully."
      );

      await loadHero();
    } catch (uploadException) {
      console.error(uploadException);

      setError(
        "Something went wrong while uploading the hero image."
      );
    }

    setUploading(false);
  }

  async function toggleVisibility() {
    if (!hero) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: updateError } =
      await supabase
        .from("hero_settings")
        .update({
          is_visible: !hero.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq("id", hero.id);

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      return;
    }

    setSuccess(
      hero.is_visible
        ? "Hero image hidden from the website."
        : "Hero image is now visible on the website."
    );

    await loadHero();
  }

  async function deleteHero() {
    if (!hero) {
      return;
    }

    const confirmed = window.confirm(
      "Delete the current hero image?\n\nThis will remove the image from Supabase Storage and remove it from the website."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Try to find the Storage file path from
       * the public URL.
       */
      if (hero.image_url) {
        const marker =
          "/storage/v1/object/public/hero-images/";

        const markerIndex =
          hero.image_url.indexOf(marker);

        if (markerIndex !== -1) {
          const filePath =
            hero.image_url.substring(
              markerIndex + marker.length
            );

          if (filePath) {
            const {
              error: storageError,
            } = await supabase.storage
              .from("hero-images")
              .remove([filePath]);

            if (storageError) {
              console.error(storageError);
            }
          }
        }
      }

      /*
       * Remove database record.
       */
      const { error: deleteError } =
        await supabase
          .from("hero_settings")
          .delete()
          .eq("id", hero.id);

      if (deleteError) {
        console.error(deleteError);
        setError(deleteError.message);
        setDeleting(false);
        return;
      }

      setHero(null);

      setSuccess(
        "Hero image deleted successfully."
      );
    } catch (deleteException) {
      console.error(deleteException);

      setError(
        "Something went wrong while deleting the hero image."
      );
    }

    setDeleting(false);
  }

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
              Hero
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
        {/* UPLOAD SECTION */}
        <section className="border border-black bg-white">
          <div className="border-b border-black p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Homepage
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">
              Featured Hero Image
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Upload the main featured image displayed
              on the RAP SCENE homepage.
            </p>
          </div>

          <div className="space-y-6 p-6">
            {/* CURRENT HERO */}
            <div>
              <p className="mb-3 text-sm font-bold uppercase">
                Current Hero
              </p>

              {loading ? (
                <div className="flex aspect-video items-center justify-center border border-black bg-neutral-100">
                  <p className="text-sm font-bold uppercase">
                    Loading...
                  </p>
                </div>
              ) : hero?.image_url ? (
                <div className="relative aspect-video overflow-hidden border border-black bg-black">
                  <Image
                    src={hero.image_url}
                    alt="RAP SCENE featured hero"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center border border-black bg-black p-6 text-center text-3xl font-black text-white">
                  NO HERO IMAGE
                </div>
              )}
            </div>

            {/* STATUS */}
            {hero && (
              <div className="flex flex-col justify-between gap-4 border border-black bg-neutral-50 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                    Website Status
                  </p>

                  <p className="mt-1 font-black uppercase">
                    {hero.is_visible
                      ? "Visible"
                      : "Hidden"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void toggleVisibility()
                  }
                  className="border border-black px-5 py-3 text-sm font-bold uppercase transition hover:bg-black hover:text-white"
                >
                  {hero.is_visible
                    ? "Hide Hero"
                    : "Show Hero"}
                </button>
              </div>
            )}

            {/* FILE INPUT */}
            <div>
              <label
                htmlFor="hero-image"
                className="mb-2 block text-sm font-bold uppercase"
              >
                Upload New Hero Image
              </label>

              <input
                id="hero-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="block w-full border border-black bg-white p-3 text-sm file:mr-4 file:border-0 file:bg-black file:px-4 file:py-2 file:font-bold file-uppercase file:text-white"
              />

              <p className="mt-2 text-xs text-neutral-500">
                JPG, PNG, or WEBP · Maximum 5 MB
              </p>
            </div>

            {/* SELECTED FILE */}
            {selectedFile && (
              <div className="border border-black bg-neutral-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Selected File
                </p>

                <p className="mt-1 break-all font-bold">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(
                    2
                  )}{" "}
                  MB
                </p>
              </div>
            )}

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

            {/* UPLOAD */}
            <button
              type="button"
              onClick={() => void uploadHero()}
              disabled={
                uploading ||
                !selectedFile
              }
              className="w-full bg-black px-6 py-4 text-sm font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {uploading
                ? "Uploading..."
                : hero
                  ? "Replace Hero Image"
                  : "Upload Hero Image"}
            </button>

            {/* DELETE */}
            {hero && (
              <button
                type="button"
                onClick={() =>
                  void deleteHero()
                }
                disabled={deleting}
                className="ml-0 border border-red-600 px-6 py-4 text-sm font-black uppercase text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Hero"}
              </button>
            )}
          </div>
        </section>

        {/* INFORMATION */}
        <section className="mt-8 border border-black bg-white p-6">
          <h2 className="text-lg font-black uppercase">
            Hero Image Guidelines
          </h2>

          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-600">
            <li>
              • Use a wide image suitable for the
              homepage hero area.
            </li>

            <li>
              • Recommended aspect ratio: 16:9.
            </li>

            <li>
              • Maximum file size: 5 MB.
            </li>

            <li>
              • Supported formats: JPG, PNG, and WEBP.
            </li>

            <li>
              • Uploading a new image automatically
              replaces the current hero.
            </li>

            <li>
              • The uploaded image is stored in the
              Supabase Storage{" "}
              <strong>hero-images</strong> bucket.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}