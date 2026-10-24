# internationalized-user-facing-text Specification

## Purpose

This capability ensures that runtime labels, notifications, errors, and other user-facing text can be translated without editing application source. Chinese and English users must receive equivalent messages through the shared language catalogs.

## Requirements

### Requirement: Runtime user-facing Chinese text uses catalog keys
Application runtime code MUST route user-facing labels, messages, errors, and page text through the existing i18n accessors instead of embedding Chinese literals directly.

#### Scenario: Chinese source text is rendered
- **WHEN** a user runs the application with the Chinese locale selected
- **THEN** the converted message resolves through a `TXT_CODE_` catalog key to its Chinese translation

#### Scenario: English locale is selected
- **WHEN** the same user-facing message is rendered with the English locale selected
- **THEN** the message resolves through the same key to an English translation

### Requirement: Language catalogs remain synchronized
Every key introduced by the conversion MUST exist in both `languages/zh_CN.json` and `languages/en_US.json`, with matching interpolation placeholders and valid JSON.

#### Scenario: Scanner output is checked
- **WHEN** the repository i18n scanner completes
- **THEN** both catalogs contain the generated keys and no generated key has a missing or malformed translation

#### Scenario: Parameterized text is converted
- **WHEN** a converted message contains runtime parameters
- **THEN** the catalog and accessor preserve the module-specific placeholder syntax and render the parameter value without exposing the original Chinese literal

### Requirement: Conversion does not alter non-user-facing Chinese data
The conversion MUST leave protocol payloads, test fixtures, comments, documentation, locale-name labels, and domain data unchanged unless they are explicitly rendered as user-facing runtime text.

#### Scenario: Test or protocol data contains Chinese
- **WHEN** a Chinese string is used only as test input, protocol content, or fixture data
- **THEN** it remains unchanged and is not added as a UI translation key
