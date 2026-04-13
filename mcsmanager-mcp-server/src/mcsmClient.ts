import type {
  AppConfig,
  InstanceAction,
  McsmMonitorOverviewResponse,
  McsmRemoteServiceOverview
} from "./types.js";

type FetchLike = typeof fetch;

export class McsmApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly responseBody?: unknown
  ) {
    super(message);
    this.name = "McsmApiError";
  }
}

export class McsmClient {
  constructor(
    private readonly config: AppConfig,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  getMonitorOverview(): Promise<McsmMonitorOverviewResponse> {
    return this.request<McsmMonitorOverviewResponse>("/monitor/servers");
  }

  getRemoteServices(): Promise<McsmRemoteServiceOverview[]> {
    return this.request<McsmRemoteServiceOverview[]>("/service/remote_services");
  }

  performInstanceAction(
    daemonId: string,
    instanceUuid: string,
    action: InstanceAction
  ): Promise<unknown> {
    const endpoint = action === "start" ? "open" : action;
    return this.request(`/protected_instance/${endpoint}`, {
      method: "POST",
      query: { daemonId, uuid: instanceUuid }
    });
  }

  performInstanceCommand(
    daemonId: string,
    instanceUuid: string,
    command: string
  ): Promise<unknown> {
    return this.request("/protected_instance/command", {
      method: "POST",
      query: { daemonId, uuid: instanceUuid, command }
    });
  }

  async request<T>(
    path: string,
    options: {
      method?: string;
      query?: Record<string, string | number | boolean | undefined>;
      body?: unknown;
    } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(this.buildUrl(path, options.query), {
        method: options.method ?? "GET",
        headers: this.buildHeaders(options.body != null),
        body: options.body == null ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });

      const responseBody = await readResponseBody(response);
      if (!response.ok) {
        throw new McsmApiError(
          `MCSManager API request failed: HTTP ${response.status} ${extractMessage(responseBody)}`,
          response.status,
          responseBody
        );
      }

      return unwrapMcsmResponse(responseBody) as T;
    } catch (error) {
      if (error instanceof McsmApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new McsmApiError(`MCSManager API request timed out after ${this.config.requestTimeoutMs}ms.`);
      }
      throw new McsmApiError(error instanceof Error ? error.message : String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildHeaders(hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "x-request-api-key": this.config.apiKey
    };
    if (hasBody) headers["Content-Type"] = "application/json";
    return headers;
  }

  private buildUrl(
    path: string,
    query: Record<string, string | number | boolean | undefined> | undefined
  ): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.config.panelBaseUrl}${normalizedPath}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value != null) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(body: unknown): string {
  if (typeof body === "string") return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const data = record.data ?? record.message ?? record.error;
    if (typeof data === "string") return data;
  }
  return "";
}

function unwrapMcsmResponse(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;

  const record = body as Record<string, unknown>;
  if (!("status" in record) || !("data" in record)) return body;

  const status = Number(record.status);
  if (Number.isFinite(status) && status >= 400) {
    throw new McsmApiError(
      `MCSManager API returned status ${status} ${extractMessage(body)}`,
      status,
      body
    );
  }

  return record.data;
}
