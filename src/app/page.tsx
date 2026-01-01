export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <main className="flex flex-col items-center gap-6 px-6 text-center">
        <h1 className="font-serif text-5xl font-medium tracking-tight text-gray-800 sm:text-6xl md:text-7xl">
          Coming <em className="text-blue-600">soon</em>
        </h1>
        <p className="max-w-md text-lg text-gray-500">
          Something new is in the works. Check back soon.
        </p>
      </main>
    </div>
  );
}
