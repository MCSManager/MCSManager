# quickstart-ui Specification

## Purpose

Defines the supported frontend entry points for creating instances after the legacy quick-start pages are removed. The capability keeps market-based creation available while preventing obsolete quick-start routes and dashboard cards from being exposed.

## Requirements

### Requirement: Legacy quick-start routes are unavailable

The frontend SHALL NOT register `/quickstart` or `/quickstart/minecraft` as navigable routes.

#### Scenario: Direct navigation to the removed route

- **WHEN** a user navigates directly to `/quickstart` or `/quickstart/minecraft`
- **THEN** the router treats the path as unknown and applies the existing not-found handling

### Requirement: Legacy quick-start UI is not provisioned

The frontend SHALL NOT register or provision the legacy quick-start flow cards, and generated default layout configuration SHALL NOT add pages for the removed routes.

#### Scenario: Default layout is generated

- **WHEN** the panel creates the default frontend layout configuration
- **THEN** no `/quickstart` page or quick-start flow card is included

### Requirement: Instance creation uses the supported market entry

The instance list and post-install completion UI SHALL NOT navigate to a removed quick-start route; available creation actions SHALL open the existing application market or return to the overview.

#### Scenario: Administrator starts instance creation from the instance list

- **WHEN** the administrator selects the create-instance action
- **THEN** the application market dialog opens without changing the browser URL to `/quickstart`

#### Scenario: Installation completes

- **WHEN** the administrator reaches the installation completion screen
- **THEN** the screen offers the overview destination and no quick-start destination

### Requirement: Market creation behavior remains available

Removing the legacy routes SHALL NOT remove the market dialog's preset, package-upload, Docker-image, or existing-directory instance creation flows.

#### Scenario: User selects a market creation method

- **WHEN** a user selects a supported market category and creation method
- **THEN** the corresponding existing market flow remains usable without relying on a quick-start route
