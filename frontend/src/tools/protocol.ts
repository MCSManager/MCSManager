import { removeTrail } from "./string";

export function parseIp(ip: string) {
  if (ip.toLowerCase() === "localhost" || ip === "127.0.0.1") {
    return window.location.hostname;
  }
  return ip;
}

export type RemoteMappingEntry = {
  from: {
    addr: string;
    prefix: string;
  };
  to: {
    addr: string;
    prefix: string;
  };
};

export interface ForwardLocation {
  host: string;
  pathname: string;
  protocol: string;
}

function getForwardLocation(): ForwardLocation {
  if (typeof window === "undefined") return { host: "", pathname: "", protocol: "" };
  return {
    host: window.location.host,
    pathname: window.location.pathname,
    protocol: window.location.protocol
  };
}

export function mapDaemonAddress(
  remoteMappings: RemoteMappingEntry[],
  location: ForwardLocation = getForwardLocation()
) {
  let addr = location.host;
  if (location.host.split(":").length === 1) {
    if (location.protocol === "http:") addr = `${addr}:80`;
    if (location.protocol === "https:") addr = `${addr}:443`;
  }
  const match = remoteMappings.find(
    (entry) =>
      entry.from.addr === addr &&
      removeTrail(entry.from.prefix, "/") === removeTrail(location.pathname, "/")
  );
  if (!match) return undefined;
  return match.to;
}

// Decides where the browser opens its terminal stream socket:
// - proxy mode routes the connection through the panel;
// - otherwise the daemon address is used, honouring remote mappings.
export function resolveForwardTarget(
  remoteInfo: {
    addr: string;
    prefix: string;
    remoteMappings?: RemoteMappingEntry[];
    proxy?: boolean;
    panelPrefix?: string;
  },
  location: ForwardLocation = getForwardLocation()
) {
  if (remoteInfo.proxy === true) {
    return {
      addr: location.host,
      prefix: remoteInfo.panelPrefix ?? ""
    };
  }
  if (remoteInfo.remoteMappings) {
    const mapped = mapDaemonAddress(remoteInfo.remoteMappings, location);
    if (mapped) return mapped;
  }
  return {
    addr: remoteInfo.addr,
    prefix: remoteInfo.prefix
  };
}

export function parseForwardAddress(addr: string, require: "http" | "ws") {
  // save its protocol header
  //ws://127.0.0.1:25565
  let protocol = `${window.location.protocol}//`;
  const addrProtocolString = addr.toLocaleLowerCase();
  if (require === "http") {
    if (addrProtocolString.indexOf("ws://") === 0) protocol = "http://";
    else if (addrProtocolString.indexOf("wss://") === 0) protocol = "https://";
    else if (addrProtocolString.indexOf("http://") === 0) protocol = "http://";
    else if (addrProtocolString.indexOf("https://") === 0) protocol = "https://";
    else if (protocol === "https://") protocol = "https://";
    else protocol = "http://";
  }
  if (require === "ws") {
    if (addrProtocolString.indexOf("http://") === 0) protocol = "ws://";
    else if (addrProtocolString.indexOf("https://") === 0) protocol = "wss://";
    else if (addrProtocolString.indexOf("ws://") === 0) protocol = "ws://";
    else if (addrProtocolString.indexOf("wss://") === 0) protocol = "wss://";
    else if (protocol === "https://") protocol = "wss://";
    else protocol = "ws://";
  }

  // remove potentially redundant headers
  addr = deleteWebsocketHeader(deleteHttpHeader(addr));

  // port and ip are separated
  let daemonPort = null;
  let onlyAddr = null;
  if (addr.split(":").length === 2) {
    onlyAddr = addr.split(":")[0];
    daemonPort = parseInt(addr.split(":")[1].split("/")[0]);
    if (isNaN(daemonPort))
      throw new Error(`The address ${addr} failed to resolve, the port is incorrect`);
  } else {
    onlyAddr = addr;
  }

  let path = null;
  if (addr.indexOf("/") != -1) {
    path = addr.slice(addr.indexOf("/"));
  }

  // Reassemble the address based on the separated port and ip
  const checkAddr = onlyAddr.toLocaleLowerCase();
  if (checkAddr.indexOf("localhost") === 0 || checkAddr.indexOf("127.0.0.") === 0) {
    addr = `${protocol}${window.location.hostname}${daemonPort ? `:${daemonPort}` : ""}${
      path ?? ""
    }`;
  } else {
    addr = `${protocol}${onlyAddr}${daemonPort ? `:${daemonPort}` : ""}${path ?? ""}`;
  }
  return addr;
}

// The ws address on the Daemon side is converted into an http address
export function daemonWsAddressToHttp(wsAddr = "") {
  if (wsAddr.toLocaleLowerCase().indexOf("ws://") === 0) {
    return `http://${wsAddr.slice(5)}`;
  } else if (wsAddr.toLocaleLowerCase().indexOf("wss://") === 0) {
    return `https://${wsAddr.slice(6)}`;
  }
  return wsAddr;
}

export function deleteWebsocketHeader(wsAddr: string) {
  if (wsAddr.toLocaleLowerCase().indexOf("ws://") === 0) {
    return `${wsAddr.slice(5)}`;
  } else if (wsAddr.toLocaleLowerCase().indexOf("wss://") === 0) {
    return `${wsAddr.slice(6)}`;
  }
  return wsAddr;
}

export function deleteHttpHeader(addr: string) {
  if (addr.toLocaleLowerCase().indexOf("http://") === 0) {
    return `${addr.slice(7)}`;
  } else if (addr.toLocaleLowerCase().indexOf("https://") === 0) {
    return `${addr.slice(8)}`;
  }
  return addr;
}

// The ws address on the Daemon side is converted to the local ws address
export function daemonWsAddressToWs(wsAddr = "") {
  if (
    wsAddr.toLocaleLowerCase().indexOf("ws://") !== 0 &&
    wsAddr.toLocaleLowerCase().indexOf("wss://") !== 0
  ) {
    return `ws://${wsAddr}`;
  }
  return wsAddr;
}
