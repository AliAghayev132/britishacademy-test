/** Renders a Course/Destination/Page ordered content block array. */
export function ContentBlocks({ blocks = [] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = i;
        if (b.type === "list") {
          return (
            <ul key={key} role="list" style={{ margin: "0 0 18px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {(b.items || []).map((it, j) => (
                <li key={j} style={{ display: "flex", gap: 11, fontSize: 16, lineHeight: 1.65, color: "#3c3c47" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 800, flex: "none" }}>✓</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "definitions") {
          return (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 11, margin: "0 0 18px" }}>
              {(b.definitions || []).map((d, j) => (
                <div key={j} style={{ borderLeft: "3px solid var(--accent)", background: "#FAFBFF", borderRadius: "0 12px 12px 0", padding: "13px 16px" }}>
                  <strong style={{ fontWeight: 700, color: "#16161C" }}>{d.term}:</strong>{" "}
                  <span style={{ color: "#4a4a55", fontSize: 15.5, lineHeight: 1.7 }}>{d.description}</span>
                </div>
              ))}
            </div>
          );
        }
        if (b.type === "highlight") {
          return (
            <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 14, padding: "16px 18px", margin: "0 0 18px" }}>
              <span style={{ fontSize: 19, flex: "none" }}>★</span>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7, color: "#26263a", fontWeight: 600 }}>{b.body}</p>
            </div>
          );
        }
        if (b.type === "note") {
          return (
            <p key={key} style={{ fontSize: 15, lineHeight: 1.7, color: "#55555f", margin: "0 0 16px", padding: "13px 16px", background: "#F7F8FC", borderRadius: 12 }}>{b.body}</p>
          );
        }
        // paragraph (optionally with a heading)
        const Heading = b.headingLevel === 3 ? "h3" : "h2";
        return (
          <div key={key}>
            {b.heading && (
              <Heading style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: b.headingLevel === 3 ? "clamp(19px,2.3vw,24px)" : "clamp(23px,2.9vw,31px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 14px" }}>{b.heading}</Heading>
            )}
            {b.body && b.body.split("\n\n").map((p, j) => (
              <p key={j} style={{ fontSize: 16.5, lineHeight: 1.85, color: "#3c3c47", margin: "0 0 16px" }}>{p}</p>
            ))}
          </div>
        );
      })}
    </>
  );
}
