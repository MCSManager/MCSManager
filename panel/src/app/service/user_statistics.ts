import axios from "axios";
import { getVersion } from "../version";

// This function module is used for MCSManager user statistics,
// the purpose is to know the number of existing daily activities and installations.
// User statistics will not send any private data, user data, system information, etc.
const st = new Date().getTime();
const version = getVersion();

async function statistics() {
  return await axios.get("http://statistics.mcsmanager.com/", {
    params: {
      st,
      version
    },
    timeout: 1000 * 30
  });
}

// Only one request within 24 hours counts as valid statistics, and repeated requests are ignored
// This is set to request once every 24 hours
setInterval(async () => {
  try {
    return await statistics();
  } catch (error: any) {
    // ignore
  }
}, 1000 * 60 * 60 * 24);

// Count once when the panel starts
statistics()
  .then(() => {})
  .catch(() => {});
