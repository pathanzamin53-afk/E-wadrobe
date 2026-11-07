import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

const features = [
  {
    number: "01",
    title: "Know what you own",
    description:
      "Keep your clothes in one considered collection, organized by the details that matter to you.",
  },
  {
    number: "02",
    title: "Make more of every piece",
    description:
      "See new combinations in the clothes you already have, instead of reaching for the same outfit.",
  },
  {
    number: "03",
    title: "Get dressed with intention",
    description:
      "Find outfit inspiration for your plans, your personal style, and the season.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#20251f]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <a
          aria-label="E-Wardrobe home"
          className="text-lg font-semibold tracking-tight"
          href="#home"
        >
          E-Wardrobe<span className="text-[#829078]">.</span>
        </a>
        <nav className="flex items-center gap-3 sm:gap-6">
          <a
            className="hidden text-sm font-medium text-[#555d53] transition hover:text-[#20251f] sm:inline"
            href="#how-it-works"
          >
            Our approach
          </a>
          <Suspense fallback={<div aria-hidden="true" className="h-9 w-20" />}>
            <Show when="signed-out">
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button
                    className="rounded-full px-3 py-2 text-sm font-medium text-[#39483a] transition hover:bg-[#e9e9e1]"
                    type="button"
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="rounded-full bg-[#39483a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#29372b]"
                    type="button"
                  >
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </Suspense>
        </nav>
      </header>

      <section
        className="mx-auto grid min-h-[72vh] w-full max-w-7xl items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-24"
        id="home"
      >
        <div className="max-w-2xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#77836f]">
            A wardrobe, well kept
          </p>
          <h1 className="font-serif text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Your wardrobe,
            <br />
            considered.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#62685f] sm:text-lg">
            A little more clarity in your closet. Keep track of what you own,
            discover fresh outfit combinations, and make getting dressed feel
            easy.
          </p>
          <a
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#39483a] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#29372b]"
            href="#how-it-works"
          >
            Discover the difference
            <span aria-hidden="true">→</span>
          </a>
          <p className="mt-5 text-xs text-[#7b8078]">
            Outfit ideas start with the clothes you already own.
          </p>
        </div>

        <div
          aria-label="A preview of a thoughtfully organized wardrobe"
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute -left-3 top-8 h-4/5 w-4/5 rounded-[2rem] bg-[#e6e8df]" />
          <div className="relative rounded-[2rem] bg-[#e9e3d8] p-5 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-[#d5cfc4] pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#818477]">
                  Your collection
                </p>
                <p className="mt-1 text-lg font-medium">A few favourites</p>
              </div>
              <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs text-[#596451]">
                24 pieces
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-5">
              <div className="flex aspect-[4/5] flex-col justify-between rounded-2xl bg-[#b9c1ad] p-4">
                <span className="text-xs uppercase tracking-wider text-[#344033]">
                  Layer
                </span>
                <span className="text-sm font-medium">Soft knit</span>
              </div>
              <div className="mt-7 flex aspect-[4/5] flex-col justify-between rounded-2xl bg-[#d2aa87] p-4">
                <span className="text-xs uppercase tracking-wider text-[#5b4232]">
                  Everyday
                </span>
                <span className="text-sm font-medium">Relaxed shirt</span>
              </div>
              <div className="flex aspect-[4/5] flex-col justify-between rounded-2xl bg-[#8e9a9b] p-4">
                <span className="text-xs uppercase tracking-wider text-[#354243]">
                  Essential
                </span>
                <span className="text-sm font-medium">Straight-leg denim</span>
              </div>
              <div className="mt-7 flex aspect-[4/5] flex-col justify-between rounded-2xl bg-[#c4b8a5] p-4">
                <span className="text-xs uppercase tracking-wider text-[#51493e]">
                  Complete the look
                </span>
                <span className="text-sm font-medium">Your favourite pair</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-10 sm:py-24" id="how-it-works">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#77836f]">
              A more mindful closet
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
              Less guesswork.
              <br />
              More ways to wear what you love.
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <article className="border-t border-[#e5e7e1] pt-5" key={feature.number}>
                <p className="text-xs font-medium tracking-widest text-[#84907d]">
                  {feature.number}
                </p>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#697067]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-7 text-xs text-[#777d73] sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span>E-Wardrobe / A wardrobe, well kept.</span>
        <a className="transition hover:text-[#20251f]" href="#home">
          Back to top ↑
        </a>
      </footer>
    </main>
  );
}
