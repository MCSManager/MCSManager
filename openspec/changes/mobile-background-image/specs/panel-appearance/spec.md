# Spec Delta

## Purpose

Allow administrators to configure persistent panel backgrounds that adapt to phone and desktop viewports while preserving existing appearance settings and permissions.

## ADDED Requirements

### Requirement: Independent phone background configuration
The appearance settings SHALL expose a phone background field named `pBgUrl` with URL input, upload, save, and reset actions. Phone background changes SHALL preserve the desktop background and other appearance settings. New user-facing text MUST use the existing translation catalogs.

#### Scenario: Save an uploaded phone background
- **WHEN** an administrator uploads a phone background and confirms its save action
- **THEN** the returned asset URL is saved as the phone background
- **AND** the desktop background, logo, title, navigation preference, and layout cards are preserved

#### Scenario: Save a manually entered URL
- **WHEN** an administrator enters a phone background URL and confirms saving
- **THEN** that URL is saved independently of the desktop background

#### Scenario: Reset or cancel
- **WHEN** an administrator confirms resetting the phone background
- **THEN** its saved URL becomes empty and the desktop background remains unchanged
- **AND** canceling an upload or save confirmation leaves the saved configuration unchanged

### Requirement: Phone background persists through the panel
The panel SHALL persist the optional phone background as `theme.pBgUrl` on the `__settings__` layout entry and return it through the existing layout API. A newly generated default configuration SHALL contain an empty phone URL. Stored configurations without this field SHALL remain usable without migration.

#### Scenario: Reload persisted appearance
- **WHEN** a saved layout containing distinct desktop and phone URLs is read after a fresh panel start
- **THEN** both URLs are returned unchanged
- **AND** existing unrelated layout data is preserved

#### Scenario: Read older or default configuration
- **WHEN** a layout without `theme.pBgUrl` is loaded
- **THEN** the frontend treats the missing phone URL as empty
- **AND** newly generated layout defaults expose an empty phone URL

### Requirement: Background follows the phone viewport
At viewport widths of 992 CSS pixels or less, the frontend SHALL use a nonempty phone background URL and otherwise fall back to the desktop background. At wider widths it SHALL use only the desktop background. This selection SHALL apply during initial loading, viewport changes, and theme changes on public and authenticated pages.

#### Scenario: Cross the phone breakpoint
- **WHEN** distinct phone and desktop backgrounds are configured and the viewport changes from 993 pixels to 992 pixels and back
- **THEN** the background switches from desktop to phone and back without a reload

#### Scenario: Phone background is unavailable
- **WHEN** the viewport is at most 992 pixels wide and the phone URL is empty or absent
- **THEN** the existing desktop background is used

#### Scenario: Only the phone background is configured
- **WHEN** a phone URL is configured and the desktop URL is empty
- **THEN** the phone viewport displays its background
- **AND** wider viewports display the normal theme without a background image

#### Scenario: Change light or dark theme
- **WHEN** the application theme changes while a background is active
- **THEN** the selected device background remains active with the existing light or dark overlay and appearance styles

### Requirement: Preview and cleanup reflect the selected background
A successful upload SHALL preview the background appropriate to the current viewport. The background-active state SHALL reflect whether an effective URL exists; when none exists, previously applied image styling and background-specific theme classes SHALL be removed.

#### Scenario: Upload on either viewport
- **WHEN** an administrator uploads a phone or desktop background
- **THEN** that field receives the uploaded URL
- **AND** the preview follows the viewport selection and fallback rules
- **AND** the other field retains its value

#### Scenario: Leave a phone-only background
- **WHEN** only a phone background is configured and the viewport becomes wider than 992 pixels
- **THEN** no previous background image, overlay, or background-specific theme class remains active

### Requirement: Appearance writes remain administrator-only
Only administrators SHALL upload appearance assets or persist global appearance changes. Public clients SHALL continue to read appearance configuration for login-page rendering. The phone background SHALL use the existing asset and layout storage boundaries.

#### Scenario: Unauthorized appearance modification
- **WHEN** an unauthenticated client or regular user attempts to upload a phone background or save its URL through the global layout API
- **THEN** the request is rejected and the stored appearance remains unchanged

#### Scenario: Public appearance initialization
- **WHEN** an unauthenticated client loads the login page with a saved phone background
- **THEN** it can read and display the appropriate background using the same viewport rules
