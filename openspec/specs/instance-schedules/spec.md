# instance-schedules Specification

## Purpose

Defines per-instance scheduled task automation: timed or cron-triggered action lists (start, stop, restart, kill, command, delay) with bounded counts and recurrence budgets. Schedules let administrators and assigned users automate routine instance operations without external tooling.

## Requirements

### Requirement: Schedule Task Model
The daemon SHALL represent a schedule task as a named record bound to one instance, carrying a numeric trigger type (1 = interval, 2 = daily cycle, 3 = specified time), a trigger value, a recurrence count, and an ordered list of actions, where each action has a type (delay, start, stop, restart, command, kill) and a payload. The two non-interval trigger types carry cron-style expressions. Legacy single-action schedule records SHALL be migrated to the action-list form at boot.

#### Scenario: Interval trigger stores seconds
- **WHEN** an interval schedule is registered with a time value
- **THEN** the stored trigger type is interval and the trigger value is the interval in seconds

#### Scenario: Cron triggers store an expression
- **WHEN** a daily-cycle or specified-time schedule is registered
- **THEN** the stored trigger value is the cron expression, whose seconds field MUST NOT be the wildcard form

### Requirement: Schedule Limits and Naming
The daemon SHALL enforce at most 8 schedule tasks per instance, at most 10 actions per task, and a minimum interval of 3 seconds for interval schedules. Non-numeric cron fields are left to the scheduler's own expression parser to reject (the daemon-side numeric check is inert — current behavior). Task names SHALL be filename-safe and unique within the instance, and a registration with a duplicate name SHALL be rejected.

#### Scenario: Task budget is enforced
- **WHEN** a ninth schedule task is registered for an instance that already has eight
- **THEN** the registration is rejected

#### Scenario: Sub-minimum interval is rejected
- **WHEN** an interval schedule is registered with an interval below 3 seconds
- **THEN** the registration is rejected

#### Scenario: Duplicate name is rejected
- **WHEN** a schedule is registered with a name already used in that instance
- **THEN** the registration is rejected and the existing task is unchanged

### Requirement: Schedule Action Execution
When a schedule fires, the daemon SHALL execute its actions sequentially with no enforced gap between known action types. Each action SHALL apply only when its precondition holds: start only from stopped, stop only when running, restart when running or stopped, command only when running, kill always; delay SHALL pause the action chain. An error in one action SHALL skip the remaining actions of that firing but SHALL NOT unregister the task (current behavior).

#### Scenario: Conditional actions skip safely
- **WHEN** a schedule whose first action is stop fires on an already stopped instance
- **THEN** the stop action is skipped and subsequent actions are still evaluated

#### Scenario: Actions run in order
- **WHEN** a schedule with delay, command, and stop actions fires on a running instance
- **THEN** the actions execute in their declared order with the delay honored

#### Scenario: A failing action ends the firing
- **WHEN** an action throws during a firing
- **THEN** the remaining actions of that firing are skipped and the task stays registered

### Requirement: Recurrence Count Semantics
A recurrence count of -1 (or an empty count on cron triggers) SHALL run the task indefinitely; a count of 1 SHALL delete the task after its execution; any other positive count SHALL decrement by one after each execution and delete the task when the next firing sees the budget exhausted. The decrement SHALL be held in memory only and MUST NOT be written back to the stored record (current behavior: a daemon restart restores the original budget).

#### Scenario: Finite budget expires
- **WHEN** a schedule with count 2 has fired twice in one daemon run
- **THEN** the task is removed and no further execution occurs

#### Scenario: Budget is restored on daemon restart
- **WHEN** a schedule with count 2 fires once and the daemon is restarted
- **THEN** the loaded record still shows count 2 and the task can fire twice more

#### Scenario: Infinite schedule persists
- **WHEN** a schedule with count -1 fires
- **THEN** it remains registered and fires again on the next trigger

### Requirement: Schedule Persistence and Cleanup
The daemon SHALL persist each schedule task as one JSON file per (instance, name) pair through the shared storage subsystem. Deleting an instance SHALL remove all of that instance's schedule tasks.

#### Scenario: Schedules survive daemon restart
- **WHEN** a schedule is registered and the daemon restarts
- **THEN** the schedule is loaded and continues to fire

#### Scenario: Instance deletion purges schedules
- **WHEN** an instance is deleted
- **THEN** all schedule task files for that instance are removed

### Requirement: Schedule Access Control
The panel SHALL expose schedule listing, registration, and deletion only to administrators and users assigned to the target instance, and SHALL validate schedule names against the file-name blacklist before forwarding registration to the daemon.

#### Scenario: Assigned user manages schedules
- **WHEN** a regular user assigned to an instance lists, registers, or deletes a schedule for that instance
- **THEN** the request is accepted and forwarded to the daemon

#### Scenario: Non-owner cannot touch schedules
- **WHEN** a regular user requests schedule operations for an instance they are not assigned
- **THEN** the request is rejected as unauthorized
