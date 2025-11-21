export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q;
  await new Promise((resolve) => setTimeout(resolve, 100));
  return (
    <div>
      <h1>Search Page aside</h1>
      <p>Search query: {q || "No query provided"}</p>
    </div>
  );
}
