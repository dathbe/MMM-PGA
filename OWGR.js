const Log = require('logger')
// const flags = require('./flags.js')

module.exports = {

  url: 'http://www.owgr.com/ranking/',
  rapidUrl: 'https://golf-leaderboard-data.p.rapidapi.com/world-rankings',
  owgrUrl: 'https://apiweb.owgr.com/api/owgr/rankings/getRankings?regionId=0&pageNumber=1&countryId=0&sortString=Rank%20ASC&pageSize=',

  /*   async getOWGRData(maxPlayers, rapidAPIKey, callback) {
    var rapidKey = rapidAPIKey
    const response = await fetch(this.rapidUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidKey,
        'X-RapidAPI-Host': 'golf-leaderboard-data.p.rapidapi.com',
      },
    })

    const data = await response.json()

    var owgrRanking = {
      pointsHeading: 'Average Points',
      rankings: [],
    }
    var payload = data
    try {
      if (payload.results.rankings.length > 1) {
        for (var i = 0; i < payload.results.rankings.length; i++) {
          var flagName = payload.results.rankings[i].player_name.replace(/\s/g, '')
          owgrRanking.rankings.push({
            name: payload.results.rankings[i].player_name,
            curPosition: payload.results.rankings[i].position,
            lwPosition: '1',
            points: payload.results.rankings[i].total_points,
            flagUrl: flags.getFlagURL(flagName),
          })
          if (i == maxPlayers)
            break
        }
      }
    }
    catch (error) {
      Log.error('Unable to display OWGR rankings: ' + payload.message)
      Log.error('URL fetch response: ' + response.statusText)
      Log.error('Error: ' + error)
    }
    callback(owgrRanking)
  }, */

  async getOWGRData(maxPlayers, rapidAPIKey, callback) {
    // var rapidKey = rapidAPIKey
    const response = await fetch(this.owgrUrl + maxPlayers, {
      method: 'GET',
    })
    Log.debug(`[MMM-PGA] ${this.owgrUrl} fetched`)

    const payload = await response.json()

    var owgrRanking = {
      pointsHeading: 'Avg. Points',
      rankings: [],
    }
    try {
      if (payload.rankingsList.length > 1) {
        for (let i = 0; i < payload.rankingsList.length; i++) {
          // var flagName = payload.rankingsList[i].player.fullName(/\s/g, '')
          owgrRanking.rankings.push({
            name: payload.rankingsList[i].player.fullName,
            curPosition: payload.rankingsList[i].rank,
            lwPosition: payload.rankingsList[i].lastWeekRank,
            points: Number.parseFloat(payload.rankingsList[i].pointsAverage).toFixed(3),
            flagUrl: `https://a.espncdn.com/i/teamlogos/countries/500/${payload.rankingsList[i].player.country.code3.toLowerCase()}.png`,
          })
          if (i == maxPlayers)
            break
        }
      }
    }
    catch (error) {
      Log.error('[MMM-PGA] Unable to display OWGR rankings: ' + payload.message)
      Log.error('[MMM-PGA] URL fetch response: ' + response.statusText)
      Log.error('[MMM-PGA] Error: ' + error)
    }
    callback(owgrRanking)
  },

}
