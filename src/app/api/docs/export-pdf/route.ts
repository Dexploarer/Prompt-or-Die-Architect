import { NextRequest } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";

// Lightweight PDF document from JSON
function PlanPDF({ doc }: { doc: any }) {
  // Lazy import to avoid ESM resolution at top-level
  const { Document, Page, Text, View, StyleSheet } = require("@react-pdf/renderer");
  const styles = StyleSheet.create({
    page: { padding: 24 },
    h1: { fontSize: 18, marginBottom: 8 },
    h2: { fontSize: 14, marginTop: 10, marginBottom: 4 },
    p: { fontSize: 10, marginBottom: 4 },
    li: { fontSize: 10, marginLeft: 10 },
    tableRow: { flexDirection: "row", fontSize: 9, marginBottom: 2 },
    cell: { width: "20%" },
  });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{doc.title || "Plan"}</Text>
        <Text style={styles.p}>{doc.summary || ""}</Text>
        {(doc.sections || []).map((s: any, i: number) => (
          <View key={i}>
            <Text style={styles.h2}>{s.heading}</Text>
            <Text style={styles.p}>{s.content}</Text>
            {(s.bullets || []).map((b: string, j: number) => (
              <Text key={j} style={styles.li}>• {b}</Text>
            ))}
          </View>
        ))}
        <Text style={styles.h2}>Backlog</Text>
        {(doc.backlog || []).map((b: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.cell}>{b.id}</Text>
            <Text style={styles.cell}>{b.title}</Text>
            <Text style={styles.cell}>{b.priority}</Text>
            <Text style={styles.cell}>{b.est}</Text>
            <Text style={styles.cell}>{(b.assignees || []).join(", ")}</Text>
          </View>
        ))}
        <Text style={styles.h2}>Risks</Text>
        {(doc.risks || []).map((r: string, i: number) => (
          <Text key={i} style={styles.li}>• {r}</Text>
        ))}
        <Text style={styles.h2}>Open Questions</Text>
        {(doc.open_questions || []).map((q: string, i: number) => (
          <Text key={i} style={styles.li}>• {q}</Text>
        ))}
      </Page>
    </Document>
  );
}

export async function POST(req: NextRequest) {
  const { json } = await req.json();
  const doc = JSON.parse(json || "{}");
  const pdfStream = await renderToStream(<PlanPDF doc={doc} />);
  return new Response(pdfStream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=plan.pdf",
    },
  });
}


