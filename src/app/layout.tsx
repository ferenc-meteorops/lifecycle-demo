import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lifecycle Demo",
  description: "Demonstrates PR preview environments with Supabase branching",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
