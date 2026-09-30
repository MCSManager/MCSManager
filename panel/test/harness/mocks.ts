import { vi } from "vitest";

/**
 * Panel service mock factories. Each batch `vi.mock(path, () => factory(args))` pulls
 * from here. Mocks sit at the I/O boundary: storage-backed user lookup, daemon RPC
 * (socket.io-client), audit log files, settings persistence. The real permission
 * middleware and protocol envelope are exercised against the mocked services.
 */

export function mockUserSystem(findUser?: (uuid: string) => any) {
  const objects = new Map<string, any>();
  return {
    default: {
      objects,
      getInstance: vi.fn((uuid: string) => (findUser ? findUser(uuid) : objects.get(uuid))),
      getUserByUserName: vi.fn((name: string) => undefined),
      checkUser: vi.fn(),
      create: vi.fn(async () => ({ uuid: "new-uuid" })),
      edit: vi.fn(),
      deleteInstance: vi.fn(),
      existUserName: vi.fn(() => false),
      getUserByUuid: vi.fn(() => undefined),
      getUserByUserName: vi.fn(() => undefined),
      check2FA: vi.fn(() => true),
      validatePassword: vi.fn(() => true),
      getQueryWrapper: vi.fn(() => ({
        selectPage: vi.fn(() => ({ total: 0, data: [] }))
      }))
    },
    TwoFactorError: class TwoFactorError extends Error {}
  };
}

export function mockRemoteService(rpc: Record<string, (data: any) => any> = {}) {
  return {
    default: {
      RemoteServiceSubsystem: {
        services: new Map<string, any>(),
        list: vi.fn(() => []),
        getInstance: vi.fn(),
        connectRemoteService: vi.fn(),
        removeRemoteService: vi.fn()
      },
      RemoteRequest: function RemoteRequest() {},
      RemoteService: class {}
    },
    // Many panel routers import RemoteRequest from remote_command.
    RemoteRequest: {
      prototype: {
        request: vi.fn(async (event: string, data: any) => rpc[event]?.(data))
      }
    }
  };
}

export function mockOperationLogger() {
  return {
    operationLogger: { info: vi.fn(), warning: vi.fn(), log: vi.fn(), error: vi.fn() },
    getOperationLoggerOperator: vi.fn(() => ({ operator_name: "admin", operator_ip: "127.0.0.1" }))
  };
}

export function mockSetting(config: Record<string, any> = {}) {
  return {
    systemConfig: {
      loginInfo: "hello",
      businessMode: false,
      businessId: "",
      crossDomain: true,
      enableApiKey: false,
      canFileManager: true,
      allowUsePreset: true,
      allowChangeCmd: true,
      ssoEnabled: false,
      ssoOnlyMode: false,
      loginCheckIp: false,
      totpDriftToleranceSteps: 0,
      gzip: false,
      panelId: "",
      language: "en_us",
      ...config
    },
    saveSystemConfig: vi.fn(async () => undefined),
    default: { systemConfig: {} }
  };
}

export function mockLog() {
  const make = () => {
    const fn: any = () => {};
    fn.info = fn;
    fn.warn = fn;
    fn.error = fn;
    fn.debug = fn;
    fn.trace = fn;
    fn.mark = fn;
    fn.fatal = fn;
    fn.log = fn;
    return fn;
  };
  return { logger: make(), fileLogger: make(), fullTime: () => "", fullLocalTime: () => "" };
}

// passport_service exposes session helpers + the API-key lookup used by the
// permission middleware. Defaults let permission pass-through; tests override via
// vi.mocked(...).mockReturnValue(...) on the imported reference.
export function mockPassportService() {
  return {
    BAN_IP_COUNT: "banip",
    LOGIN_FAILED_KEY: "loginFailed",
    ILLEGAL_ACCESS_KEY: "illegalAccess",
    LOGIN_COUNT: "loginCount",
    LOGIN_FAILED_COUNT_KEY: "loginFailedCount",
    login: vi.fn(() => "tok-from-login"),
    loginSuccess: vi.fn(() => "tok-from-login"),
    getLoginIp: vi.fn((ctx: any) => (ctx?.ip ?? "")),
    bind2FA: vi.fn(async () => "data:image/png;base64,"),
    confirm2FaQRCode: vi.fn(async () => undefined),
    check: vi.fn((ctx: any) => !!(ctx?.session?.login && ctx?.session?.userName && ctx?.session?.token)),
    logout: vi.fn(() => true),
    register: vi.fn(async () => ({ uuid: "new-uuid", userName: "u", permission: 1 })),
    getUserPermission: vi.fn(() => 10),
    getUserNameBySession: vi.fn((ctx: any) => ctx?.session?.userName),
    getUserFromCtx: vi.fn(() => undefined),
    getUserUuid: vi.fn((ctx: any) => ctx?.session?.uuid || ""),
    getToken: vi.fn((ctx: any) => ctx?.session?.token || ""),
    isAjax: vi.fn((ctx: any) => {
      const h = ctx?.header?.["x-requested-with"];
      return !!h && h.toString().toLowerCase() === "xmlhttprequest";
    }),
    checkBanIp: vi.fn(() => true),
    getApiKey: vi.fn(() => ""),
    isApiRequest: vi.fn(() => false),
    getUuidByApiKey: vi.fn(() => null)
  };
}
