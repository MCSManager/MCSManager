# Spec Delta

## Purpose

Defines distinct user-facing entry points for browsing the full application market and selecting a preset for an existing instance reinstall.

## ADDED Requirements

### Requirement: Full application market dialog
The frontend SHALL provide a market dialog that displays the complete application market experience, including manual installation choices and available presets, without requiring an existing instance.

#### Scenario: Open market from navigation
- **WHEN** an authorized user activates an application market navigation entry
- **THEN** the frontend displays the full application market in a dialog

#### Scenario: Close market without installation
- **WHEN** the user closes the application market dialog without completing an installation flow
- **THEN** the dialog closes without reinstalling or modifying any existing instance

#### Scenario: Open the market editor
- **WHEN** the user activates the market editor link from the application market dialog
- **THEN** the frontend navigates to `/market/editor`
- **AND** the application market dialog closes

#### Scenario: Start a preset installation
- **WHEN** the user confirms a preset and the installation task starts successfully
- **THEN** the application market dialog closes
- **AND** the existing terminal navigation continues

### Requirement: Dedicated instance reinstall selector
The frontend SHALL keep preset selection for an existing instance reinstall separate from the full application market dialog and SHALL preserve the existing reinstall confirmation and execution behavior.

#### Scenario: Reinstall from a stopped instance terminal
- **WHEN** an eligible stopped instance invokes the reinstall action
- **THEN** the frontend opens the dedicated preset selector with the instance and daemon context
- **AND** selecting and confirming a preset starts the existing reinstall flow for that instance

#### Scenario: Cancel instance reinstall selection
- **WHEN** the user cancels the dedicated preset selector
- **THEN** no reinstall request is submitted

### Requirement: Market dialogs are not exposed to iframe actions
The frontend SHALL NOT expose the market or instance reinstall dialog through the iframe action handler.

#### Scenario: Iframe action registry is created
- **WHEN** the frontend initializes the iframe action handler
- **THEN** the handler does not contain an `OpenMarketDialog` action
