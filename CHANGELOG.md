# Changelog

## [Unreleased]

### Added
- Created a GitHub workflow to automatically update the models from Thingiverse every day at midnight UTC. The workflow is defined in `.github/workflows/daily-parser.yml`. To enable it, you need to add your Thingiverse `APP_TOKEN` as a secret to your GitHub repository.
- Implemented a secure download functionality by creating a new API endpoint that proxies downloads from Thingiverse.
- Implemented pagination on the search results page.
- Added smooth scrolling to the search results when changing pages.

### Changed
- Updated the Thingiverse parser to fetch all pages of search results, which will provide a much larger and more diverse set of models.
- The parser now uses more descriptive search terms to find more relevant models.
- The server now runs on port 3001 to avoid conflicts with other applications.
- The `start.bat` file has been updated to automatically open the website in your browser after a short delay.

### Fixed
- Fixed an issue where the pagination was limited to 4 pages.
- Fixed an issue where the page would scroll to the bottom when changing pages.
- Fixed a persistent `EADDRINUSE` error by changing the server port.
- Fixed several bugs in the Thingiverse parser that were causing it to crash.

### Temporary
- Manually created a `data/models-index.json` file with 100 sample "Bosch" models to demonstrate that the pagination is working correctly. This is a temporary solution. For the full data, the parser needs to be run.
