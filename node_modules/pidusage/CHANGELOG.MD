### 1.1.0

Windows: (wmic) goes back to the first version of wmic, naming `wmic process {pid} get workingsetsize,usermodetime,kernelmodetime`. CPU usage % is computed on the flight, per pid.

### 1.0.5

Windows: (wmic) Use raw data instead of formatted this should speed up wmic

### 0.1.0
API changes:
```
require('pidusage').stat(pid, fn)
```
instead of:
```
require('pidusage')(pid, fn)
```
Adds a `unmonitor` method to clear process history
