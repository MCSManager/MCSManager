// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarketCreateMethodStep from "../MarketCreateMethodStep.vue";

const mountStep = (props: Record<string, unknown> = { categoryTitle: "Minecraft" }) =>
  mount(MarketCreateMethodStep, {
    props,
    global: {
      stubs: {
        ARow: { template: "<div><slot /></div>" },
        ACol: { template: "<div><slot /></div>" },
        ATypographyText: { template: "<span><slot /></span>" },
        ATypographyTitle: { template: "<h2><slot /></h2>" },
        AButton: {
          props: ["disabled"],
          emits: ["click"],
          template:
            '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
        }
      }
    }
  });

describe("MarketCreateMethodStep", () => {
  it("requires a selection before continuing", async () => {
    const wrapper = mountStep();
    const next = wrapper.get('[data-testid="market-method-next"]');

    expect(next.attributes("disabled")).toBeDefined();
    await wrapper.get('[data-testid="market-method-preset"]').trigger("click");
    await next.trigger("click");

    expect(wrapper.emitted("select")).toEqual([["preset"]]);
  });

  it("returns to category selection", async () => {
    const wrapper = mountStep();
    await wrapper.get('[data-testid="market-method-back"]').trigger("click");

    expect(wrapper.emitted("back")).toHaveLength(1);
  });

  it("offers only the three manual methods in console mode", async () => {
    const wrapper = mountStep({ categoryTitle: "Any Console Program", consoleMode: true });

    expect(wrapper.find('[data-testid="market-method-preset"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="market-method-IMPORT"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="market-method-DOCKER"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="market-method-EXIST"]').exists()).toBe(true);

    await wrapper.get('[data-testid="market-method-EXIST"]').trigger("click");
    await wrapper.get('[data-testid="market-method-next"]').trigger("click");

    expect(wrapper.emitted("select")).toEqual([["EXIST"]]);
  });
});
