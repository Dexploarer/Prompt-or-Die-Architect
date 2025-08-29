import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { GraphSchema, StackConfigSchema, ProjectPlanSchema } from "../src/types/schemas";

describe("schemas", () => {
  it("validates a minimal graph", () => {
    const g = { nodes: [{ id: "a", label: "A" }], edges: [] };
    const parsed = GraphSchema.safeParse(g);
    assert.equal(parsed.success, true);
  });

  it("rejects invalid graph", () => {
    const g = { nodes: [{ id: "", label: "" }], edges: [] } as any;
    const parsed = GraphSchema.safeParse(g);
    assert.equal(parsed.success, false);
  });

  it("validates stack config", () => {
    const s = { type: "web", framework: "nextjs", features: [] };
    const parsed = StackConfigSchema.safeParse(s);
    assert.equal(parsed.success, true);
  });

  it("validates project plan", () => {
    const plan = {
      title: "Test",
      description: "Desc",
      stack: { type: "web", framework: "nextjs", features: [] },
      architecture: { nodes: [{ id: "a", label: "A" }], edges: [] },
      userStories: [
        { id: "1", title: "t", description: "d", acceptanceCriteria: ["x"], priority: "High", estimate: "S", assignees: [] },
      ],
      fileStructure: [{ name: "src", type: "directory", children: [{ name: "index.ts", type: "file", content: "" }] }],
    };
    const parsed = ProjectPlanSchema.safeParse(plan);
    assert.equal(parsed.success, true);
  });
});


