/* MagicMirror²
 * Module: MMM-PGA
 *
 * By mcl8on
 *
 */
const Log = require('logger')
const NodeHelper = require('node_helper')
const express = require('express') // necessary?

var ESPN = require('./ESPN.js')
const OWGR = require('./OWGR.js')
const FEDEXCUP = require('./FEDEXCUP.js')

module.exports = NodeHelper.create({
  requiresVersion: '2.20.0',

  start: function () {
    Log.log('Starting node_helper for: ' + this.name)

    // Does this do anything?
    this.expressApp.use(express.urlencoded({ extended: true }))
    this.expressApp.post('/MMM-PGA-UpdateFavs', this._onUpdateFavs.bind(this))
  },

  _onUpdateFavs: function (req, res) {
    Log.log('[MMM-PGA] Update favorites')
    this.sendSocketNotification('UPDATE_FAVORITES')
    res.sendStatus(200)
  },

  // Core function of franewor that schedules the Update
  scheduleUpdate: function () {
    // schedule the updates for Subsequent Loads
    var self = this

    setInterval(() => {
      self.getLeaderboardData()
    }, self.config.updateInterval)
  },

  // Schedule the Ranking Updates. This is a much longer intervl since the data only changes weekly
  scheduleRankingUpdate: function () {
    // schedule the updates for Subsequent Loads

    var self = this
    setInterval(() => {
      self.getRankingData(self.config.maxNumRankings)
    }, self.config.rankingsUpdateInterval)
  },

  // Schedule the Fedex Standings Updates. This is a much longer intervl since the data only changes weekly
  scheduleFedexUpdate: function () {
    // schedule the updates for Subsequent Loads

    var self = this
    setInterval(() => {
      self.getFedexData(self.config.maxNumRankings)
    }, self.config.rankingsUpdateInterval)
  },

  // Schedule the upcoming tourney updates. This is a much longer interval since the data only changes rarely
  scheduleUpcomingTourneyUpdate: function () {
    // schedule the updates for Subsequent Loads

    var self = this
    setInterval(() => {
      self.getUpcomingTourneyData(self.config.numTournament)
    }, self.config.rankingsUpdateInterval)
  },

  getLeaderboardData: function () {
    var self = this

    ESPN.getTournamentData(function (tournament) {
      self.sendSocketNotification('PGA_RESULT', tournament)
    })
  },

  getUpcomingTourneyData: function (numTournaments) {
    var self = this

    ESPN.getTournaments(numTournaments, function (tournaments) {
      self.sendSocketNotification('PGA_TOURNAMENT_LIST', tournaments)
    })
  },

  getRankingData: function (maxNumRankings, rapidAPIKey) {
    var self = this

    OWGR.getOWGRData(maxNumRankings, rapidAPIKey, function (owgrRanking) {
      self.sendSocketNotification('OWGR_RANKING', owgrRanking)
    })
  },

  getFedexData: function (maxNumRankings, rapidAPIKey) {
    var self = this

    // if (this.config.rapidAPIKey !== '') {
    FEDEXCUP.getFedExCupData(maxNumRankings, rapidAPIKey, function (fcRanking) {
      self.sendSocketNotification('FEDEXCUP_RANKING', fcRanking)
    })
    // }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'CONFIG') {
      this.config = payload
      if (this.started !== true) {
        this.started = true
        this.scheduleUpcomingTourneyUpdate()
        if (this.config.showBoards) {
          this.scheduleUpdate()
        }
        if (this.config.showFedex) {
          this.scheduleFedexUpdate()
        }
        if (this.config.showOWGR) {
          this.scheduleRankingUpdate()
        }
      }

      // Load Data to begin with so we dont have to wait for next server load
      // Each client will make a call at startup
      this.getUpcomingTourneyData(this.config.numTournaments)
      this.getLeaderboardData() // would be great to move this into a conditional block so it only runs if user wants boards, but the dom won't load if I do that; it only calls once on startup, so not the biggest deal
      if (this.config.showFedex) {
        this.getFedexData(this.config.maxNumRankings, this.config.rapidAPIKey)
      }
      if (this.config.showOWGR) {
        this.getRankingData(this.config.maxNumRankings, this.config.rapidAPIKey)
      }
    }
  },
})
