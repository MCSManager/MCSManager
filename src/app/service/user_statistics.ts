// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import axios from "axios";

const st = new Date().toLocaleDateString();

// This function module is used for MCSManager user data statistics, the purpose is to know the number of existing daily activities and installations.
// User statistics will not send any private data, user data, system information, etc.
// Details reference: https://mcsmanager.com/agreement.html
async function statistics() {
  return await axios.get("http://statistics.mcsmanager.com/", {
    params: {
      st
    },
    timeout: 1000 * 10
  });
}

// Only one request within 24 hours counts as valid statistics, and repeated requests are ignored
// This is set to request once every 24 hours
setTimeout(async () => {
  try {
    return await statistics();
  } catch (error) {
    // ignore
  }
}, 1000 * 60 * 60 * 24);

// Count once when the panel starts
statistics()
  .then(() => {})
  .catch(() => {});
