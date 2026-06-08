import { supabase } from "@/lib/supabase"

interface Item {
  id: number
  name: string
  created_at: string
  description?: string | null
  priority?: string | null
  [key: string]: unknown
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  high: { bg: "#fee2e2", text: "#dc2626" },
  medium: { bg: "#fef9c3", text: "#ca8a04" },
  low: { bg: "#dcfce7", text: "#16a34a" },
}

export const dynamic = "force-dynamic"

export default async function Home() {
  const deployEnv = process.env.NEXT_PUBLIC_DEPLOY_ENV || "local"
  const schemaVersion = process.env.NEXT_PUBLIC_SCHEMA_VERSION || "unknown"

  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false })

  const columns =
    items && items.length > 0
      ? Object.keys(items[0])
      : null

  const isPreview = deployEnv.startsWith("preview")

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Lifecycle Demo</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Per-PR preview environments with Alembic migrations &amp; Vercel.
      </p>

      <div
        style={{
          border: `2px solid ${isPreview ? "#f59e0b" : "#22c55e"}`,
          borderRadius: 8,
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          background: isPreview ? "#fffbeb" : "#f0fdf4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: isPreview ? "#f59e0b" : "#22c55e",
            }}
          >
            {isPreview ? "PREVIEW" : deployEnv.toUpperCase()}
          </span>
          <span style={{ fontSize: 14, color: "#555" }}>{deployEnv}</span>
        </div>
        <table style={{ fontSize: 14, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ paddingRight: 16, color: "#888" }}>Schema version</td>
              <td><code>{schemaVersion}</code></td>
            </tr>
            {columns && (
              <tr>
                <td style={{ paddingRight: 16, color: "#888" }}>Table columns</td>
                <td><code>{columns.join(", ")}</code></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2>Items</h2>
      {error ? (
        <p style={{ color: "red" }}>Error: {error.message}</p>
      ) : items && items.length > 0 ? (
        <ul style={{ lineHeight: 1.7 }}>
          {(items as Item[]).map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              {item.priority && (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: 8,
                    padding: "1px 8px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    background: priorityColors[item.priority]?.bg ?? "#f3f4f6",
                    color: priorityColors[item.priority]?.text ?? "#6b7280",
                  }}
                >
                  {item.priority}
                </span>
              )}
              {item.description && (
                <span style={{ color: "#666" }}> &mdash; {item.description}</span>
              )}
              <br />
              <small style={{ color: "#999" }}>
                {new Date(item.created_at).toLocaleDateString()}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#888" }}>No items yet.</p>
      )}
    </main>
  )
}
