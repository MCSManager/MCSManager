# user-management Specification

## Purpose

Defines panel user accounts, numeric authorization levels, per-instance ownership assignment, and administrative user lifecycle operations. Every other panel capability (instance control, file management, node administration) resolves the acting user and its privileges through the contracts in this specification.

## Requirements

### Requirement: User Account Model
The panel SHALL represent each user as a persistent record identified by a dashless UUID v4 primary key and carrying a login name (unique at creation time; renames do not re-check uniqueness), a password credential with its hash type, a numeric permission level, a list of instance assignments, and optional API key, TOTP, and SSO bindings. Additional account metadata SHALL include registration time, last login time, an `isInit` profile flag, and an SSO-bounded flag.

#### Scenario: Account creation assigns a stable identity
- **WHEN** a user account is created through any creation path (administrative create, first-run install, or exchange purchase)
- **THEN** the system generates a dashless UUID v4 as the account primary key, records the registration time, and never reuses that UUID for another account

#### Scenario: Optional credentials start empty
- **WHEN** an account is created without explicit API key, TOTP, or SSO input
- **THEN** the account stores an empty API key, an empty TOTP secret, 2FA disabled, and no SSO subject binding

### Requirement: Username Validation
The system SHALL accept user names of 1 to 64 characters that are non-blank and contain no ASCII control characters, and SHALL reject any user name that violates these rules at every account creation and rename path. Non-ASCII (unicode) user names SHALL be accepted.

#### Scenario: Control characters are rejected
- **WHEN** a creation or rename request supplies a user name containing ASCII control characters (U+0000–U+001F or U+007F)
- **THEN** the system rejects the request and does not create or modify any account

#### Scenario: Overlong, empty, and blank names are rejected
- **WHEN** a user name exceeds 64 characters, is empty, or consists only of whitespace
- **THEN** the system rejects the request

#### Scenario: Unicode names are accepted
- **WHEN** a user name consists of non-ASCII characters and satisfies the length and non-blank rules
- **THEN** the system accepts the name and completes account creation or rename

### Requirement: Password Policy and Hashing
The system SHALL accept passwords of 9 to 36 characters containing at least one lowercase letter, one uppercase letter, and one digit, and SHALL reject any password that violates this policy at every interactive password-setting path (create, self change, administrative reset). New and updated passwords SHALL be stored as bcrypt hashes with cost factor 10; legacy accounts whose credential is an unsalted MD5 digest SHALL remain able to log in.

#### Scenario: Weak passwords are rejected
- **WHEN** a password shorter than 9 characters, longer than 36 characters, or missing a lowercase letter, an uppercase letter, or a digit is submitted
- **THEN** the system rejects the request and the stored credential is unchanged

#### Scenario: Stored passwords are hashed
- **WHEN** a valid password is accepted for account creation, self change, or administrative reset
- **THEN** the system stores only the bcrypt hash with hash type recorded as bcrypt and never persists the plaintext

#### Scenario: Machine-generated passwords skip the policy
- **WHEN** the exchange purchase path generates a password for a new account
- **THEN** the generated password is stored without a policy check (current behavior)

### Requirement: Authorization Levels
The panel SHALL authorize users by a single numeric permission level compared with a greater-than-or-equal rule, where ADMIN is 10, USER is 1, GUEST is 0, and any negative value is BAN. Intermediate numeric levels SHALL be legal and SHALL behave as their numeric position implies.

#### Scenario: Administrator passes every level gate
- **WHEN** a user with permission 10 requests an endpoint gated at any level
- **THEN** the level check passes

#### Scenario: Intermediate levels are honored
- **WHEN** a user with permission 5 requests an endpoint gated at level 1 and another gated at level 10
- **THEN** the first request passes the level check and the second is rejected as unauthorized

#### Scenario: Permission changes take effect on the next request
- **WHEN** an administrator lowers a user's permission level while the user holds an active session
- **THEN** the user's next request is evaluated against the newly stored level

#### Scenario: Some gates compare for the exact administrator level
- **WHEN** a user with permission above 10 (for example 11) requests a surface gated by an exact administrator comparison (such as multipart uploads)
- **THEN** the request is treated as non-administrator and denied

### Requirement: Instance Ownership Assignment
The panel SHALL grant a non-administrator access only to the instances explicitly assigned to that user, where an assignment is a (daemonId, instanceUuid) pair; administrators SHALL be treated as owners of all instances. Assigning instances to a user SHALL replace the user's entire assignment list, and every entry MUST carry both a daemonId and an instanceUuid.

#### Scenario: Assigned instance pair is honored
- **WHEN** a regular user requests an instance-scoped operation for a (daemonId, instanceUuid) pair present in their assignment list
- **THEN** the ownership check passes

#### Scenario: Forged daemon pairing is denied
- **WHEN** a regular user requests an instance-scoped operation reusing an assigned instanceUuid under a different daemonId
- **THEN** the ownership check fails and the request is rejected

#### Scenario: Unassigned instance is denied
- **WHEN** a regular user requests an instance-scoped operation for an instance absent from their assignment list
- **THEN** the request is rejected (router-level gates answer 403; a few in-handler checks surface as a 500 error envelope)

#### Scenario: Assignment entries require both identifiers
- **WHEN** an administrative assignment update contains an entry missing daemonId or instanceUuid
- **THEN** the system rejects the update without altering the stored assignment list

### Requirement: Administrative User Creation
The system SHALL allow only administrators to create user accounts with an explicit permission level, and SHALL validate the user name and password policy and reject duplicate names before persisting the account.

#### Scenario: Duplicate name is refused
- **WHEN** an administrator creates a user whose name already exists
- **THEN** the request is rejected and no additional account is stored

#### Scenario: Exchange purchase merges with existing names
- **WHEN** the exchange purchase path meets an existing account of the same name
- **THEN** the instance is assigned to that account instead of rejecting, and supplied user names shorter than 4 characters are refused (current behavior)

#### Scenario: Non-administrator cannot create users
- **WHEN** a user with permission below 10 attempts to create an account
- **THEN** the request is rejected as unauthorized

#### Scenario: Creation returns the new identity
- **WHEN** an administrator successfully creates a user
- **THEN** the response contains the new user's uuid, user name, and permission level and does not contain credentials

### Requirement: Administrative User Editing
The system SHALL allow only administrators to edit user records, applying only recognized fields (user name, profile flag, permission, timestamps, instances, password, API key, TOTP secret, 2FA flag, SSO subject, SSO-bound flag) and ignoring any other supplied keys. Permission level 0 SHALL be assignable. API key, TOTP secret, and SSO subject values equal to the secret mask literal `__MCSM_SECRET_DATA__` SHALL be treated as "no change" and MUST NOT be written to storage.

#### Scenario: Rename is format-validated only
- **WHEN** an administrator renames a user
- **THEN** the new name is format-validated but its uniqueness against other accounts is not re-checked (current behavior)

#### Scenario: Mask placeholder never overwrites secrets
- **WHEN** an administrative edit returns the secret mask placeholder in an API key, TOTP secret, or SSO subject field
- **THEN** the stored value for that field remains unchanged

#### Scenario: Unrecognized fields are ignored
- **WHEN** an administrative edit contains arbitrary extra keys in the config object
- **THEN** only recognized fields are applied and the stored record contains no unexpected properties

#### Scenario: Guest level is assignable
- **WHEN** an administrator sets a user's permission to 0
- **THEN** the change is persisted and the user is subsequently treated as GUEST

### Requirement: Administrative Password Reset
When an administrator changes a user's password, the system SHALL validate the password policy, store the new bcrypt hash, and SHALL clear that account's TOTP secret and disable its 2FA enforcement flag in the same operation.

#### Scenario: Reset wipes two-factor binding
- **WHEN** an administrator sets a new password for a user who has 2FA enabled
- **THEN** the password is updated and the account's TOTP secret is cleared with 2FA disabled

#### Scenario: Weak reset password is refused
- **WHEN** an administrator submits a password violating the password policy
- **THEN** the request is rejected and both the stored password and the 2FA state remain unchanged

### Requirement: User Deletion and Assignment Cleanup
The system SHALL allow only administrators to delete users in bulk by uuid, removing each account's in-memory record and persisted file. Deleting an instance SHALL remove that instance from every user's assignment list, and user deletion SHALL release all of that user's instance assignments.

#### Scenario: Bulk deletion removes stored accounts
- **WHEN** an administrator submits a list of user uuids for deletion
- **THEN** each listed account is removed from the user registry and its persisted record is deleted

#### Scenario: Instance deletion unbinds all users
- **WHEN** an instance is deleted through instance administration
- **THEN** that (daemonId, instanceUuid) pair is removed from every user's in-memory assignment list (the cleanup is not re-persisted until each user record is next edited — current behavior)

### Requirement: Credential Exposure Masking
The system SHALL never return password hashes, salt values, TOTP secrets, SSO subjects, or raw API keys in user-record API responses (audit-log diffs are a known exception for SSO subjects — see User Change Audit Logging). Round-trippable edit views SHALL substitute the secret mask literal `__MCSM_SECRET_DATA__` for populated secret fields and empty strings for cleared ones; safe projections SHALL omit the fields entirely.

#### Scenario: User search masks populated secrets
- **WHEN** an administrator lists users through the paginated search endpoint
- **THEN** password and salt fields are empty strings, populated API key, TOTP secret, and SSO subject fields are replaced by the secret mask literal, and the password hash type metadata is still returned (current behavior)

#### Scenario: Self profile omits credentials
- **WHEN** a user requests their own profile
- **THEN** the response contains no password hash, salt, or TOTP secret, and any API key is masked or empty

#### Scenario: Profile lookup ignores foreign uuid for non-administrators
- **WHEN** a regular user requests a profile with a uuid parameter naming a different account
- **THEN** the parameter is ignored and only the caller's own record is returned (confused-deputy protection)

#### Scenario: Overview is a safe projection
- **WHEN** an administrator requests the user overview listing
- **THEN** each row contains only uuid, user name, permission, instance assignments, login time, and registration time

### Requirement: Self-Service Profile Update
The system SHALL let an authenticated user change only their own password and profile-initialized flag through the self-update endpoint; permission level, API key, and instance assignments supplied in the same request MUST be ignored. A successful self password change SHALL validate the password policy and end the caller's session.

#### Scenario: Privilege escalation attempt is inert
- **WHEN** a regular user submits a self-update request containing permission, API key, or instance assignment fields alongside a password
- **THEN** only the password (and profile flag) is applied and the user's permission, API key, and assignments are unchanged

#### Scenario: Password change ends the session
- **WHEN** a user successfully changes their own password
- **THEN** the current session is invalidated and the user must log in again

### Requirement: Banned Account Handling
The system SHALL treat any account with a negative permission level as banned: on any level-checked request the session SHALL be terminated and no protected data SHALL be returned.

#### Scenario: Banned session is cut
- **WHEN** a user whose permission level is negative performs a request to a protected endpoint
- **THEN** the session is cleared and the response carries no protected data

### Requirement: User Persistence
The panel SHALL persist each user record as one JSON document per account through the shared storage subsystem, which SHALL write atomically via temporary file and rename, and SHALL transparently back the same interface with Redis when a Redis URL is configured. A boot-loaded in-memory registry SHALL be the authoritative read source, and record-editing operations SHALL re-persist the full record immediately.

#### Scenario: Edits survive restart
- **WHEN** a user record is edited and the panel is later restarted
- **THEN** the account reflects the edited values after boot

#### Scenario: Assignment cleanup is not written back
- **WHEN** instance deletion removes a pair from user assignment lists, or a login updates the login timestamp
- **THEN** only the in-memory registry changes and the stored record keeps the old values until the next edit (current behavior)

#### Scenario: Malformed records yield missing data at load
- **WHEN** a user JSON file contains invalid JSON at boot
- **THEN** the storage layer logs a parse failure and returns no record for that uuid (a null entry stays in the registry and iterating it throws, which can break lookups and logins for other accounts — current behavior)

#### Scenario: Unreadable record files abort startup
- **WHEN** a user JSON file cannot be read at boot
- **THEN** panel startup fails with an error instead of booting without that account

### Requirement: User Change Audit Logging
The panel SHALL record user lifecycle events (login, create, delete, config change, API key change, SSO unbind) to the operation log, respecting the configured user and login logging switches, and SHALL record configuration changes with password, hash type, salt, TOTP secret, and API key values stripped from the logged diff (SSO subject is currently retained in diffs — current behavior).

#### Scenario: Config change is logged without credentials
- **WHEN** an administrator changes a user's configuration
- **THEN** an audit entry is written whose before and after snapshots exclude password, hash type, salt, TOTP secret, and API key values
