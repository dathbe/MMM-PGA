const Log = require('logger')
const flags = require('./flags.js')
const moment = require('moment')

// TODO: Add comments

module.exports = {

  url: 'https://www.pgatour.com/fedexcup/official-standings.html',
  rapidUrl: 'https://golf-leaderboard-data.p.rapidapi.com/tour-rankings/2/',

  async getFedExCupData(maxPlayers, rapidAPIKey, callback) {
    const currentYear = moment().year()
    const urlFED = this.rapidUrl + currentYear

    var rapidKey = rapidAPIKey
    Log.log('FEDEX MMM-PGA retrieving FedEx Cup Standings')

    const response = await fetch(urlFED, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidKey,
        'X-RapidAPI-Host': 'golf-leaderboard-data.p.rapidapi.com',
      },
    })

    const data = await response.json()

    var fcRanking = {
      pointsHeading: 'Total Points',
      rankings: [],
    }
    var payload = data
    try {
      if (payload.results.rankings.length > 1) {
        for (var i = 0; i < payload.results.rankings.length; i++) {
          var flagName = payload.results.rankings[i].player_name.replace(/\s/g, '')
          var lstposition = payload.results.rankings[i].position + payload.results.rankings[i].movement
          fcRanking.rankings.push({
            name: payload.results.rankings[i].player_name,
            curPosition: payload.results.rankings[i].position,
            lwPosition: lstposition,
            points: payload.results.rankings[i].points,
            flagUrl: flags.getFlagURL(flagName),
          })
          if (i == maxPlayers)
            break
        }
      }
    }
    catch (error) {
      Log.error('Unable to display FEDEX Cup rankings: ' + payload.message)
      Log.error('URL fetch response: ' + response.statusText)
      Log.error('Error: ' + error)
    }
    callback(fcRanking)
  },

}
