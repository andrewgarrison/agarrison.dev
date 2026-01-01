export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Coming Soon
        </h1>
        <p className="max-w-md text-lg text-zinc-400">
          Something new is in the works. Check back soon.
        </p>
      </main>
    </div>
  );
}
