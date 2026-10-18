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

### Requirement: Category-scoped creation method selection
The frontend SHALL ask how the user wants to create a server after the user selects a market category and before any creation-specific form or preset list is displayed.

#### Scenario: Select a market category
- **WHEN** the user selects a category in the application market
- **THEN** the frontend displays choices to upload a server package, use a preset template, create from a Docker image, or create without uploading files
- **AND** no existing instance is modified

#### Scenario: Continue with a preset template
- **WHEN** the user selects the preset-template creation method
- **THEN** the frontend displays the detailed preset list for the previously selected category
- **AND** presets from other categories are not displayed

#### Scenario: Continue with a manual creation method
- **WHEN** the user selects package upload, Docker image, or no-file creation
- **THEN** the frontend continues to the existing compatible creation form for that method

#### Scenario: Navigate back through market creation steps
- **WHEN** the user navigates back from a creation branch
- **THEN** the frontend returns to the creation-method choices for the selected category
- **AND** navigating back again returns to the category list

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
