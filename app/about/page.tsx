export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="border-b border-white/10 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            About RAP SCENE
          </p>

          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
            The Music.
            <br />
            The Artists.
            <br />
            The Culture.
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-white/65 sm:mt-8 sm:text-lg">
            RAP SCENE is a digital platform dedicated to documenting,
            discovering, and celebrating rap and hip-hop music in the
            Philippines.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div>
            <h2 className="text-2xl font-bold uppercase sm:text-3xl">
              Our Purpose
            </h2>
          </div>

          <div className="space-y-5 text-sm leading-8 text-white/65 sm:text-base">
            <p>
              RAP SCENE was created to give greater visibility to the artists,
              songs, and movements shaping Filipino rap and hip-hop.
            </p>

            <p>
              From established artists to emerging voices, we aim to highlight
              the music and stories that contribute to the growth of the scene.
              Our platform is built for listeners who want to discover new
              artists, follow what is trending, and learn more about the people
              behind the music.
            </p>
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="border-y border-white/10 bg-white/[0.03] px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/40">
            Rankings
          </p>

          <h2 className="text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
            How Our Rankings Work
          </h2>

          <div className="mt-7 max-w-4xl space-y-5 text-sm leading-8 text-white/65 sm:mt-8 sm:text-base">
            <p>
              RAP SCENE rankings are intended to reflect the performance and
              popularity of artists and music using publicly available chart
              data, music-industry sources, and other relevant indicators.
            </p>

            <p>
              Where applicable, rankings may reference established sources such
              as Billboard Philippines and other recognized music charts,
              streaming platforms, music releases, and publicly available
              performance data.
            </p>

            <p>
              RAP SCENE does not claim to replace or represent the official
              rankings of Billboard Philippines or any other third-party chart
              provider. Rankings displayed on RAP SCENE are presented as part
              of our platform&apos;s coverage and may combine information from
              multiple sources.
            </p>

            <p>
              Chart positions and rankings can change as new data and releases
              become available.
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Find */}
      <section className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/40">
            Explore RAP SCENE
          </p>

          <h2 className="text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
            What You&apos;ll Find
          </h2>

          <div className="mt-8 grid overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {[
              {
                title: "Artists",
                text: "Discover established and emerging rap artists.",
              },
              {
                title: "Music",
                text: "Explore songs, releases, and projects from the scene.",
              },
              {
                title: "Music Videos",
                text: "Watch and discover rap and hip-hop music videos.",
              },
              {
                title: "Rankings",
                text: "Follow artist and music rankings based on available chart and performance data.",
              },
              {
                title: "Trending",
                text: "Discover artists and music receiving attention across the scene.",
              },
              {
                title: "Stories",
                text: "Learn more about artists, their journeys, and the culture surrounding their music.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border-b border-white/10 bg-black p-6 transition hover:bg-white/[0.04] sm:p-7"
              >
                <h3 className="text-lg font-bold uppercase">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/55">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/40">
            Our Vision
          </p>

          <h2 className="text-3xl font-black uppercase sm:text-4xl lg:text-5xl">
            Built for the Scene
          </h2>

          <p className="mt-7 max-w-4xl text-sm leading-8 text-white/65 sm:mt-8 sm:text-base">
            RAP SCENE aims to become a trusted destination for Filipino rap
            and hip-hop—connecting artists, listeners, and the wider music
            community through discovery and information.
          </p>

          <p className="mt-5 max-w-4xl text-sm leading-8 text-white/65 sm:text-base">
            As the Philippine rap scene continues to evolve, RAP SCENE is
            committed to documenting its growth and giving both established and
            emerging artists a place to be discovered.
          </p>

          <div className="mt-10 border-l-2 border-white pl-5 sm:mt-12 sm:pl-6">
            <p className="text-xl font-black uppercase sm:text-2xl">
              RAP SCENE
            </p>

            <p className="mt-2 text-sm uppercase tracking-widest text-white/40">
              The music. The artists. The culture.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}