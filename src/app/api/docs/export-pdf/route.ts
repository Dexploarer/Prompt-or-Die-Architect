import { NextRequest } from "next/server";
import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";

export const runtime = "nodejs";

type Plan = {
  title: string;
  description: string;
  architecture?: { nodes?: Array<{ id: string; label: string }>; edges?: any[] };
  userStories?: Array<{ id: string; title: string; description: string; acceptanceCriteria?: string[]; priority?: string; estimate?: string }>;
};

const styles = StyleSheet.create({
  page: { padding: 32 },
  h1: { fontSize: 20, marginBottom: 8, fontWeight: 700 },
  h2: { fontSize: 14, marginTop: 12, marginBottom: 6, fontWeight: 600 },
  p: { fontSize: 11, lineHeight: 1.4 },
  li: { fontSize: 11, marginBottom: 4 },
  code: { fontSize: 9, backgroundColor: '#f4f4f4', padding: 6, borderRadius: 4 }
});

function PlanDoc({ plan }: { plan: Plan }) {
  const nodes = plan.architecture?.nodes ?? [];
  const edges = plan.architecture?.edges ?? [];
  const stories = plan.userStories ?? [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{plan.title || "Project Plan"}</Text>
        <Text style={styles.p}>{plan.description || ""}</Text>

        <Text style={styles.h2}>Architecture</Text>
        <Text style={styles.p}>Nodes: {nodes.length} • Edges: {edges.length}</Text>
        {nodes.slice(0, 25).map((n) => (
          <Text key={n.id} style={styles.li}>• {n.label}</Text>
        ))}

        {stories.length > 0 && (
          <View>
            <Text style={styles.h2}>User Stories</Text>
            {stories.slice(0, 30).map((s) => (
              <View key={s.id}>
                <Text style={styles.li}>[{s.priority || '—'}] {s.title}</Text>
                {s.acceptanceCriteria?.slice(0, 5).map((ac, i) => (
                  <Text key={i} style={{ fontSize: 10, marginLeft: 12 }}>- {ac}</Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

function MarkdownDoc({ markdown, title }: { markdown: string; title?: string }) {
  const lines = (markdown || "").split(/\r?\n/);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{title || "Project Documentation"}</Text>
        {lines.map((ln, i) => {
          if (ln.startsWith("## ")) return <Text key={i} style={styles.h2}>{ln.replace(/^##\s*/, "")}</Text>;
          if (ln.startsWith("- ")) return <Text key={i} style={styles.li}>• {ln.replace(/^-\s*/, "")}</Text>;
          if (ln.startsWith("# ")) return <Text key={i} style={styles.h1}>{ln.replace(/^#\s*/, "")}</Text>;
          return <Text key={i} style={styles.p}>{ln}</Text>;
        })}
      </Page>
    </Document>
  );
}

export async function POST(req: NextRequest) {
  try {
    const { plan, markdown } = await req.json();
    if (!plan && !markdown) {
      return new Response(JSON.stringify({ error: "Provide 'plan' or 'markdown'" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const doc = markdown ? <MarkdownDoc markdown={markdown as string} title={plan?.title} /> : <PlanDoc plan={plan as Plan} />;
    const blob = await pdf(doc as any).toBuffer();
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(((plan?.title) || 'plan').replace(/\s+/g, '-').toLowerCase())}.pdf"`
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "PDF generation failed", details: e?.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}


