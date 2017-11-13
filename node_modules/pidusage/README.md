pidusage
========

[![Build Status](https://travis-ci.org/soyuka/pidusage.svg?branch=master)](https://travis-ci.org/soyuka/pidusage)
[![Build status](https://ci.appveyor.com/api/projects/status/dqs82fp92pf2rey5)](https://ci.appveyor.com/project/soyuka/pidusage)

Cross-platform process cpu % and memory usage of a PID

Ideas from https://github.com/arunoda/node-usage/ but with no C-bindings

Please note that if you need to check a nodejs script process cpu usage, you can use [`process.cpuUsage`](https://nodejs.org/api/process.html#process_process_cpuusage_previousvalue) since node v6.1.0. This script remain useful when you have no control over the remote script, or if the process is not a nodejs process.

## API

```javascript
var pusage = require('pidusage')

pusage.stat(process.pid, function(err, stat) {

	expect(err).to.be.null
	expect(stat).to.be.an('object')
	expect(stat).to.have.property('cpu')
	expect(stat).to.have.property('memory')

	console.log('Pcpu: %s', stat.cpu)
	console.log('Mem: %s', stat.memory) //those are bytes

})

// Unmonitor process
pusage.unmonitor(process.pid);
```

## How it works

A check on the `os.platform` is done to determine the method to use.

### Linux
We use `/proc/{pid}/stat` in addition to the the `PAGE_SIZE` and the `CLK_TCK` direclty from `getconf()` command. Uptime comes from `proc/uptime` file because it's more accurate than the nodejs `os.uptime()`.

/!\ As stated in [#17](https://github.com/soyuka/pidusage/issues/17), memory will increase when using `pidusage.stat` in an interval because of `readFile`. Use `--expose-gc` and release the garbage collector to avoid such leaking.

Cpu usage is computed by following [those instructions](http://stackoverflow.com/questions/16726779/how-do-i-get-the-total-cpu-usage-of-an-application-from-proc-pid-stat/16736599#16736599). It keeps an history of the current processor time for the given pid so that the computed value gets more and more accurate. Don't forget to do `unmonitor(pid)` so that history gets cleared.
Cpu usage does not check the child process tree!

Memory result is representing the RSS (resident set size) only by doing `rss*pagesize`, where `pagesize` is the result of `getconf PAGE_SIZE`.

### On darwin, freebsd, solaris (tested on 10/11)
We use a fallback with the `ps -o pcpu,rss -p PID` command to get the same informations.

Memory usage will also display the RSS only, process cpu usage might differ from a distribution to another. Please check the correspoding `man ps` for more insights on the subject.

### On AIX
AIX is tricky because I have no AIX test environement, at the moment we use: `ps -o pcpu,rssize -p PID` but `/proc` results should be more accurate! If you're familiar with the AIX environment and know how to get the same results as we've got with Linux systems, please help.
[#4](https://github.com/soyuka/pidusage/issues/4)

### Windows
Windows is really tricky, atm it uses the `wmic.exe`: `wmic PROCESS {PID} get workingsetsize,usermodetime,kernelmodetime`.

The memory usage here is what windows calls the "Working Set":

> Maximum number of bytes in the working set of this process at any point in time. The working set is the set of memory pages touched recently by the threads in the process. If free memory in the computer is above a threshold, pages are left in the working set of a process even if they are not in use. When free memory falls below a threshold, pages are trimmed from working sets. If they are needed, they are then soft-faulted back into the working set before they leave main memory.

The CPU usage is computed the same as it is on linux systems. We have the `kernelmodetime` and the `usermodetime` processor use. Every time `pidusage.stat` is called, we can calculate the processor usage according to the time spent between calls (uses `os.uptime()` internally).

Note that before we used `wmic path Win32_PerfFormattedData_PerfProc_Process WHERE IDProcess=` (which is slow as hell) and `Win32_PerfRawData_PerfProc_Process` (which api breaks on Windows 10 and Windows server 2012). Not every Windows bugged but just some of those. However, the `wmic PROCESS` call is faster, and safer as it must be used by internal programs since windows XP (this is clearly an assumption).

#### Why `wmic`?

This is the safest implementation I've found that works on most Windows version (>= XP). I've tried many other implementations but there was always some failing test case. For example, powershell would be faster but powershell needs to be attached to a console ([see this comment](https://github.com/nodejs/node-v0.x-archive/issues/8795#issuecomment-68068553)). This means it'd have to popup a new `cmd.exe` every time we execute `pidusage`.
If you know a way that doesn't imply the use of `wmic`, please open an issue so that I can try it!

#### pidusage-tree

If you want to compute a pidusage tree take a look at [pidusage-tree](https://github.com/soyuka/pidusage-tree). 

## Licence

MIT
