import { NextRequest, NextResponse } from "next/server";
import { client, GRAPH_JSON_INSTRUCTIONS } from "@/lib/ai";

function getPromptForDiagramType(diagramType: string, text: string, rules: { content: string }[]) {
  const rulesContent = rules.map(r => r.content).join("\n\n---\n\n");

  const rulesInjection = rules.length > 0 ? `
You must follow these rules:
${rulesContent}
` : "";

  switch (diagramType) {
    case "User Flow":
      return `
You are an expert UX designer. Create a user flow diagram based on the following description.
Description: ${text}
The user flow should show the steps a user takes to accomplish a goal.
Nodes should be of kind "page" or "step".
Edges should represent the user's navigation between pages and steps.
Be thorough and create a complete, logical user flow.
${rulesInjection}
`;
    case "Sequence Diagram":
      return `
You are an expert software engineer. Create a sequence diagram based on the following description.
Description: ${text}
The sequence diagram should show the interactions between different components or services over time.
Nodes should be of kind "service" or "db".
Edges should represent messages or API calls between the components, with labels indicating the order of operations.
Be thorough and create a complete, logical sequence diagram.
${rulesInjection}
`;
    case "System Architecture":
    default:
      return `
You are an expert system architect. Create a detailed system architecture diagram based on the following description.
Description: ${text}
The architecture should show the different components of the system and how they interact.
Nodes can be of kind "service", "db", "queue", or "page".
Edges should represent the flow of information or dependencies between the components.
Be thorough and create a complete, logical architecture.
${rulesInjection}
`;
  }
}

export async function POST(req: NextRequest) {
  const { text, diagramType, rules } = await req.json();

  const content = getPromptForDiagramType(diagramType, text, rules);

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: GRAPH_JSON_INSTRUCTIONS },
      { role: "user", content },
    ],
  });

  const json = completion.choices[0].message.content ?? "{}";
  return new Response(json, { headers: { "Content-Type": "application/json" } });
}
