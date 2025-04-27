const Log = require('logger')
// const flags = require('./flags.js')
// const moment = require('moment')

// TODO: Add comments

module.exports = {

  url: 'https://www.pgatour.com/fedexcup/official-standings.html',
  rapidUrl: 'https://golf-leaderboard-data.p.rapidapi.com/tour-rankings/2/',
  pgaUrl: 'https://orchestrator.pgatour.com/graphql',

  async getFedExCupData(maxPlayers, rapidAPIKey, callback) {
    // const currentYear = moment().year()
    // const urlFED = this.rapidUrl + currentYear

    // Log.log('FEDEX MMM-PGA retrieving FedEx Cup Standings')

    /*     const response = await fetch(urlFED, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidAPIKey,
        'X-RapidAPI-Host': 'golf-leaderboard-data.p.rapidapi.com',
      },
    }) */
    const response = await fetch(this.pgaUrl, {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Microsoft Edge";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'x-amz-user-agent': 'aws-amplify/3.0.7',
        'x-api-key': 'da2-gsrx5bibzbb4njvhl7t37wqyl4',
        'x-pgat-platform': 'web',
      },
      referrer: 'https://www.pgatour.com/',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: '{"operationName":"TourCupCombined","variables":{"tourCode":"R","id":"02671","year":2671},"query":"query TourCupCombined($tourCode: TourCode!, $id: String, $year: Int, $eventQuery: StatDetailEventQuery) {\\n  tourCupCombined(\\n    tourCode: $tourCode\\n    id: $id\\n    year: $year\\n    eventQuery: $eventQuery\\n  ) {\\n    id\\n    title\\n    projectedTitle\\n    season\\n    description\\n    detailCopy\\n    logo\\n    options\\n    projectedLive\\n    fixedHeaders\\n    columnHeaders\\n    players {\\n      ... on TourCupCombinedPlayer {\\n        __typename\\n        id\\n        firstName\\n        lastName\\n        displayName\\n        shortName\\n        countryFlag\\n        country\\n        rankingData {\\n          projected\\n          official\\n          event\\n          movement\\n          movementAmount\\n          logo\\n          logoDark\\n        }\\n        pointData {\\n          projected\\n          official\\n          event\\n          movement\\n          movementAmount\\n          logo\\n          logoDark\\n        }\\n        projectedSort\\n        officialSort\\n        thisWeekRank\\n        previousWeekRank\\n        columnData\\n        tourBound\\n      }\\n      ... on TourCupCombinedInfo {\\n        __typename\\n        logo\\n        logoDark\\n        text\\n        sortValue\\n        toolTip\\n      }\\n    }\\n    tournamentPills {\\n      tournamentId\\n      displayName\\n    }\\n    yearPills {\\n      year\\n      displaySeason\\n    }\\n    rankingsHeader\\n    winner {\\n      id\\n      rank\\n      firstName\\n      lastName\\n      displayName\\n      shortName\\n      countryFlag\\n      country\\n      earnings\\n      totals {\\n        label\\n        value\\n      }\\n    }\\n    message\\n    partner\\n    partnerLink\\n  }\\n}"}',
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
    })
    Log.debug(`[MMM-PGA] ${this.pgaUrl} fetched`)

    const data = await response.json()
    // Log.debug(data.data.tourCupCombined.players[0])
    const payload = data.data.tourCupCombined

    var fcRanking = {
      pointsHeading: 'Total Points',
      rankings: [],
    }

    // This is the old 'try' block for using the rapidAPI url
    /* try {
      if (payload.data.tourCupCombined.players.length > 0) {
        for (let i=0; i<payload.data.tourCupCombined.players.length; i++) {
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
    } */
    // try {
    if (payload.players.length > 0) {
      for (let i = 0; i < payload.players.length; i++) {
        if (payload.players[i].id) {
          // Log.debug(payload.players[i])
          // var flagName = payload.results.rankings[i].player_name.replace(/\s/g, '')
          // var lstposition = payload.results.rankings[i].position + payload.results.rankings[i].movement
          fcRanking.rankings.push({
            name: payload.players[i].displayName,
            curPosition: payload.players[i].thisWeekRank,
            lwPosition: payload.players[i].previousWeekRank,
            points: payload.players[i].pointData.official,
            flagUrl: `https://a.espncdn.com/i/teamlogos/countries/500/${payload.players[i].countryFlag.toLowerCase()}.png`,
          })
        }
      }
    }
    // Log.debug(fcRanking)
    fcRanking.rankings.sort(function (a, b) {
      return parseInt(a.curPosition) - parseInt(b.curPosition)
    })
    fcRanking.rankings = fcRanking.rankings.slice(0, maxPlayers)
    // }
    /*     catch (error) {
      Log.error('Unable to display FEDEX Cup rankings: ' + payload.message)
      Log.error('URL fetch response: ' + response.statusText)
      Log.error('Error: ' + error)
    } */
    callback(fcRanking)
  },

}
