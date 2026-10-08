import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyToken } from "@/lib/api-token";
import { createHubMcpServer } from "@/lib/mcp-server";
import { logEvent, ACTIONS } from "@/lib/events";

/**
 * The hub's MCP endpoint, for a person's own Claude. Excluded from the session
 * proxy (src/proxy.ts) and authenticated here instead with a personal bearer
 * token (see /connect-claude). Stateless: a fresh server and transport per
 * request, which is what a serverless deployment needs.
 */
export const dynamic = "force-dynamic";

const unauthorized = () =>
  Response.json(
    { jsonrpc: "2.0", error: { code: -32001, message: "Missing, invalid or revoked token. Create one on the hub's Connect Claude page." }, id: null },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );

async function handle(req: Request): Promise<Response> {
  const caller = await verifyToken(req.headers.get("authorization"));
  if (!caller) return unauthorized();

  const server = createHubMcpServer((tool, args) => {
    void logEvent(ACTIONS.mcpCall, { actor: caller.owner, target: tool, label: JSON.stringify(args) });
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export const POST = handle;
// Stateless mode has no standalone SSE stream or session to delete.
export const GET = () => Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
export const DELETE = GET;
