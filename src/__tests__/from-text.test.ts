import { POST } from "../app/api/graph/from-text/route";
import { client } from "../lib/ai";
import { NextRequest } from "next/server";

jest.mock("../lib/ai", () => ({
  ...jest.requireActual("../lib/ai"),
  client: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

describe("POST /api/graph/from-text", () => {
  it("should return a graph from a text prompt", async () => {
    const mockGraph = {
      nodes: [{ id: "1", label: "Node 1", kind: "service" }],
      edges: [],
    };
    (client.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockGraph) } }],
    });

    const req = new NextRequest("http://localhost/api/graph/from-text", {
      method: "POST",
      body: JSON.stringify({ text: "test prompt" }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockGraph);
    expect(client.chat.completions.create).toHaveBeenCalledWith({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: expect.any(String) },
        { role: "user", content: "Turn this idea into a system graph. test prompt" },
      ],
    });
  });
});
