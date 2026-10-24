import type { LayoutCard } from "@/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutCardTools } from "../useCardTools";

const routeState = vi.hoisted(() => ({
  current: undefined as { query: Record<string, unknown> } | undefined
}));

vi.mock("vue-router", () => ({
  useRoute: () => routeState.current
}));

vi.mock("@/lang/i18n", () => ({
  t: (key: string) => key
}));

const createCard = (meta: Record<string, string> = {}) =>
  ({ meta }) as unknown as LayoutCard;

describe("useLayoutCardTools", () => {
  beforeEach(() => {
    routeState.current = undefined;
  });

  it("reads card metadata without an installed router", () => {
    const { getMetaOrRouteValue } = useLayoutCardTools(createCard({ daemonId: "daemon-1" }));

    expect(getMetaOrRouteValue("daemonId", false)).toBe("daemon-1");
  });

  it("returns undefined for an optional value without an installed router", () => {
    const { getMetaOrRouteValue } = useLayoutCardTools(createCard());

    expect(getMetaOrRouteValue("daemonId", false)).toBeUndefined();
  });

  it("still rejects a missing required value without an installed router", () => {
    const { getMetaOrRouteValue } = useLayoutCardTools(createCard());

    expect(() => getMetaOrRouteValue("daemonId")).toThrow('"daemonId"');
  });

  it("uses the route query when a router is installed", () => {
    routeState.current = { query: { daemonId: "daemon-2" } };
    const { getMetaOrRouteValue } = useLayoutCardTools(createCard());

    expect(getMetaOrRouteValue("daemonId")).toBe("daemon-2");
  });
});
