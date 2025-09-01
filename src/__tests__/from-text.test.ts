import { POST } from "../app/api/graph/from-text/route";
import { client } from "../lib/ai";

describe("POST /api/graph/from-text", () => {
  it("should return a graph from a text prompt", async () => {
    const mockGraph = {
      nodes: [{ id: "1", label: "Node 1", kind: "service" }],
      edges: [],
    };
    (client.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockGraph) } }],
    });

    const req = {
      json: () => Promise.resolve({ text: "test prompt" }),
    } as any;

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

  it("should return a user flow graph from a text prompt", async () => {
    const mockGraph = {
      nodes: [{ id: "1", label: "User Action 1", kind: "step" }],
      edges: [],
    };
    (client.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockGraph) } }],
    });

    const req = {
      json: () => Promise.resolve({ text: "test prompt", type: "user-flow" }),
    } as any;

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockGraph);
    expect(client.chat.completions.create).toHaveBeenCalledWith({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: expect.any(String) },
        {
          role: "user",
          content: "Turn this idea into a user flow graph. test prompt",
        },
      ],
    });
  });
});
