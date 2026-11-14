import { ImageResponse } from "next/og";

/** Shareable 1080×1350 card: "Our family found $X a year with Genora". Only the amount is shown — no personal data. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const found = Math.max(0, Math.min(99_999, Math.round(Number(url.searchParams.get("found")) || 0)));
  const cell = (bg: string) => <div style={{ width: 120, height: 120, borderRadius: 36, background: bg }} />;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#22185a", color: "#fff", padding: 96, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{cell("#ffffff")}{cell("#ffc83d")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{cell("#ffffff")}{cell("#9dcbff")}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 56, opacity: 0.8 }}>Our family found</div>
          <div style={{ fontSize: 200, fontWeight: 800, color: "#ffc83d", letterSpacing: -6, lineHeight: 1.05 }}>${found.toLocaleString("en-US")}</div>
          <div style={{ fontSize: 56, opacity: 0.8 }}>a year in childcare money</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 64 }}>genora</div>
          <div style={{ opacity: 0.7 }}>Check yours in 3 minutes</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
