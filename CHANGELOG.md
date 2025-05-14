# Changelog

Notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.2](https://github.com/dathbe/MMM-PGA/compare/v2.2.1...v2.2.2) - 2025-05-XX

- BUG FIX: Catch error when current week tournament has `undefined` purse
- Bump dev dependency

## [2.2.1](https://github.com/dathbe/MMM-PGA/compare/v2.2.0...v2.2.1) - 2025-05-06

- Displays all courses when tournament uses multiple courses
- Minor cosmetic tweaks
- Bump dev dependencies versions

## [2.2.0](https://github.com/dathbe/MMM-PGA/compare/v2.1.1...v2.2.0) - 2025-05-01

- **NEW FEATURE**: Broadcast channel can be displayed with `showBroadcast`
- **NEW FEATURE**: OWGR and Fedex standings can be separately enabled with `showOWGR` and `showFedex`, respectively.  Legacy `showRankings` will still enable or disable both together.
- BUG FIX: Fix display error when no purse information available for tournament
- Reduce unnecessary API calls
- Improvements to README
- Small cosmetic tweaks

## [2.1.1](https://github.com/dathbe/MMM-PGA/compare/v2.1.0...v2.1.1) - 2025-04-28

- Update OWGR API - NO MORE RAPIDAPI KEY NEEDED!
- Update Fedex Cup API - NO MORE RAPIDAPI KEY NEEDED!
- Restore `showRankings` defualt to `true` now that key is not necessary
- New css classes added to the tables to allow `custom.css` tweaks.
- Small design changes

## [2.1.0](https://github.com/dathbe/MMM-PGA/compare/v2.0.1...v2.1.0) - 2025-04-26

- BREAKING CHANGE:  Some default options are updated to better present an out-of-the-box module
- Update README

## [2.0.1](https://github.com/dathbe/MMM-PGA/compare/v2.0.0...v2.0.1) - 2025-04-25

- Add ESLint and clean up code
- Replace XMLHttpRequest with fetch
- Clean up code as per modules.magicmirror.builders/result.html
- Add changelog
- Add code of conduct
- Update license
- Update package.json
- Remove package-lock from .gitignore
- Reorganize README
- Etc.

## [2.0.0](https://github.com/mumblebaj/MMM-PGA/compare/master...dathbe:MMM-PGA:v2.0.0) - 2025-04-25 - First fork version

Forked from [mumblebaj](https://github.com/mumblebaj/MMM-PGA).
- Fixed upcoming tournaments not displaying
- Fixed team-based tournament leaderboards not displaying
- Display higher purse tournament leaderboard when multiple tournaments being competed
- Small css tweaks

## 1.3.5

- Remove reference to request
- Update license to MIT

## 1.3.4

- Remove `node-fetch` from package.json

## 1.3.3

- Fix showRankings where if set it was still trying to fetch ranking data

## 1.3.2

- Update as per request in issue [#Issue2](https://github.com/mumblebaj/MMM-PGA/issues/2)

## 1.3.1 - 2025-04-02

- Update Fedex URL

## 1.3.0 - 2025-02-03

- Removed request dependency
- Add node-fetch@2.6.1 dependency
- Remove jsdom
- Change FEDEXCUP and OWGR to RapidAPI due to changes to original websites and scraping them
- [Golf Leaderboard Data](https://rapidapi.com/sportcontentapi/api/golf-leaderboard-data) Key Required
- Get a key by subscribing to the following API on RapidAPI: [Golf Leaderboard Data](https://rapidapi.com/sportcontentapi/api/golf-leaderboard-data) 
- New option added to config: rapidAPIKey
