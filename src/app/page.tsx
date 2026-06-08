import { supabase } from "@/lib/supabase"

interface Item {
  id: number
  name: string
  created_at: string
}

export const dynamic = "force-dynamic"

export default async function Home() {
  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1>Lifecycle Demo</h1>
      <p>
        This app demonstrates per-PR preview environments with Supabase
        branching and Alembic migrations.
      </p>

      <h2>Items</h2>
      {error ? (
        <p style={{ color: "red" }}>Error: {error.message}</p>
      ) : items && items.length > 0 ? (
        <ul>
          {(items as Item[]).map((item) => (
            <li key={item.id}>
              {item.name} — {new Date(item.created_at).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items yet. Run migrations and seed data to see items here.</p>
      )}
    </main>
  )
}
