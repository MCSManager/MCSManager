import assert from "assert/strict";
import { parseLinuxDfOutput, selectPrimaryDiskForPaths } from "./host_metrics";

const sampleOutput = `Filesystem     1B-blocks        Used    Available Use% Mounted on
/dev/sda1    100000000000 40000000000 60000000000  40% /
/dev/sdb1    200000000000 50000000000 150000000000 25% /opt/mcsmanager
/dev/sdc1    300000000000 100000000000 200000000000 34% /srv/minecraft
`;

const disks = parseLinuxDfOutput(sampleOutput);
assert.equal(disks.length, 3);

const rootDisk = disks.find((item) => item.mount === "/");
assert.ok(rootDisk);
assert.equal(rootDisk?.freeBytes, 60000000000);

const optDisk = selectPrimaryDiskForPaths(disks, ["/opt/mcsmanager/instances/lobby"]);
assert.equal(optDisk?.mount, "/opt/mcsmanager");

const srvDisk = selectPrimaryDiskForPaths(disks, ["/srv/minecraft/survival"]);
assert.equal(srvDisk?.mount, "/srv/minecraft");

const fallbackDisk = selectPrimaryDiskForPaths(disks, ["/var/lib/something"]);
assert.equal(fallbackDisk?.mount, "/");

console.log("host_metrics tests passed");
