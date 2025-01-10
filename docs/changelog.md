# Change Log

## 1.2.0 (January 2024)

### Added

- Added a new Action Documents profile with full text search capabilities.

- Added a preview modal that shows a table with a subset of results when querying the Action Documents profile.

### Changed

- Added an "Any" option to the Reporting Cycle select input.

- When querying the API and requesting results in the JSON format, results are now paginated with `pageNumber` and `pageSize` parameters rather than a `startId` parameter.

### Fixed

- Fixed issue where default query parameters were being added on top of user-provided ones.

### Chores

- Updated dependencies.

- Added server side testing.

- Switched from create react app to Vite.

- Upgraded to PostgreSQL v15 and enabled SSL.

## 1.1.0 (June 2024)

### Changed

- Updated all web service endpoints to be CORS enabled.

- Updated app to allow configuring fields such that users can query for null values.

- Fixed a bug where the swagger ui would overflow off the page.

- Fixed a bug with some fields not being autopopulated after refreshing the page.

## 1.0.0 (Released December 2023)

- Initial Release
