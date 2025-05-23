# Changelog

Notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.2](https://github.com/dathbe/MMM-PGA/compare/v2.3.1...v2.3.2) - 2025-XX-XX

- 

## [2.3.1](https://github.com/dathbe/MMM-PGA/compare/v2.3.0...v2.3.1) - 2025-05-23

- Explicitly add `moment-timezone` dependency (was previously used via MagicMirror parent directory, see [this forum discussion](https://forum.magicmirror.builders/topic/19695/do-you-need-to-list-moment-and-moment-timezone-as-dependencies-in-modules/2)
- Migrate some `new Date` references to `moment()`

## [2.3.0](https://github.com/dathbe/MMM-PGA/compare/v2.2.2...v2.3.0) - 2025-05-22

- **NEW FEATURE**: Rankings will now display in rotation once a tournament is complete (required re-write of card rotation logic)
- **NEW FEATURE**: Broadcast icon will now display only on-air broadcasts (draws from PGA Tour website instead of ESPN)
- Change FedExCup header to PGA-preferred `FedExCup` instead of `FEDEX CUP`
- Add rotation among multiple broadcast channels
- Add hidden (undocumented) config options of `skipChannels` and `channelRotateInterval`, which adds a list of channels to skip in the rotation, and the rotation time in milliseconds, respectively
- Add hideen (undocumented) config options of `upcomingTournamentHeader`, `fedexCupHeader`, and `owgrHeader`, which allow customizing the header for those three cards
- Change default `updateInterval` to 4 minutes (from 5), because this will now only pull when tournament is active
- Default `animationSpeed` changed to `750` ms when rotating between cards
- Pull purse information for leaderboard from PGA Tour website when ESPN does not have it
- Small style tweaks
- Update devDependencies
- Update example images to show updated style
- BUG FIX: Add catch for undefined tournament purse on leaderboard

## [2.2.2](https://github.com/dathbe/MMM-PGA/compare/v2.2.1...v2.2.2) - 2025-05-14

- BUG FIX: Catch error when current week tournament has `undefined` purse
- Update devDependencies
- Lint style changes

## [2.2.1](https://github.com/dathbe/MMM-PGA/compare/v2.2.0...v2.2.1) - 2025-05-06

- Displays all courses when tournament uses multiple courses
- Minor cosmetic tweaks
- Update devDependencies

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
