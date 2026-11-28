import fs from "fs-extra";
import { GlobalVariable, StorageSubsystem } from "mcsmanager-common";
import os from "os";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getFrontendLayoutConfig, setFrontendLayoutConfig } from "../app/service/frontend_layout";

vi.mock("../app/i18n", () => ({ $t: (key: string) => key }));

const originalDataPath = StorageSubsystem.DATA_PATH;
const temporaryDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-layout-test-"));

beforeAll(() => {
  Object.defineProperty(StorageSubsystem, "DATA_PATH", { value: temporaryDataPath });
});

beforeEach(() => {
  fs.emptyDirSync(temporaryDataPath);
  GlobalVariable.set("versionChange", null);
});

afterAll(() => {
  Object.defineProperty(StorageSubsystem, "DATA_PATH", { value: originalDataPath });
  GlobalVariable.set("versionChange", null);
  fs.removeSync(temporaryDataPath);
});

describe("frontend appearance persistence", () => {
  it("includes an empty phone background in new layouts", () => {
    const layout = JSON.parse(getFrontendLayoutConfig()) as IPageLayoutConfig[];
    expect(layout.find((page) => page.page === "__settings__")?.theme).toMatchObject({
      backgroundImage: "",
      pBgUrl: ""
    });
  });

  it("round-trips both backgrounds and unrelated layout fields through disk", () => {
    const layout = [
      {
        page: "__settings__",
        items: [],
        theme: {
          pageTitle: "Custom panel",
          logoImage: "/upload_files/logo.png",
          backgroundImage: "/upload_files/desktop.png",
          pBgUrl: "/upload_files/phone.png",
          sidebarPosition: "left"
        }
      },
      { page: "/custom", items: [{ id: "preserved", type: "EmptyCard" }] }
    ] as IPageLayoutConfig[];
    setFrontendLayoutConfig(layout);
    expect(JSON.parse(getFrontendLayoutConfig())).toEqual(layout);
    expect(
      JSON.parse(fs.readFileSync(path.join(temporaryDataPath, "layout.json"), "utf8"))
    ).toEqual(layout);
  });

  it("preserves older layouts without a phone background", () => {
    const layout: IPageLayoutConfig[] = [
      {
        page: "__settings__",
        items: [],
        theme: { pageTitle: "Legacy", logoImage: "", backgroundImage: "desktop.png" }
      }
    ];
    setFrontendLayoutConfig(layout);
    expect(JSON.parse(getFrontendLayoutConfig())).toEqual(layout);
  });

  it("preserves the phone background during version adaptation", () => {
    const layout = JSON.parse(getFrontendLayoutConfig());
    layout.find((page: IPageLayoutConfig) => page.page === "__settings__").theme.pBgUrl =
      "/upload_files/phone.png";
    setFrontendLayoutConfig(layout);
    GlobalVariable.set("versionChange", true);
    expect(JSON.parse(getFrontendLayoutConfig())).toEqual(layout);
  });
});
