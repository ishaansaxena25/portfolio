import { ImageResponse } from "next/og";
import { profile } from "@/data";

// Generated OG/Twitter card (IMPLEMENTATION.md §10). Next injects it into the
// social meta automatically — no static PNG asset needed.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${profile.name} — ${profile.role}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0e0a",
        }}
      >
        <div style={{ display: "flex", color: "#7d887d", fontSize: 34 }}>
          {profile.role} · {profile.location}
        </div>
        <div style={{ display: "flex", color: "#d6e0d6", fontSize: 104, marginTop: 12 }}>
          {profile.name}
        </div>
        <div style={{ display: "flex", color: "#4ade80", fontSize: 44, marginTop: 28 }}>
          ~ $ portfolio
        </div>
      </div>
    ),
    { ...size },
  );
}
