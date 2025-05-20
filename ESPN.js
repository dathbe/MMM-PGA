const Log = require('logger')
const moment = require('moment')

module.exports = {

  url: 'https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&event=401703505', // &event=401703505 <-completed event 401703492 <- two courses
  tournamentsUrl: 'https://site.web.api.espn.com/apis/site/v2/sports/golf/pga/tourschedule',
  // url: "https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?event=401219795",
  // urlTournamentList: "https://www.espn.com/golf/schedule/_/tour/pga?_xhr=pageContent&offset=-04%3A00",
  currentTourneyId: '',
  currentTourneyPurse: {},
  boardUpdateInterval: 0,

  async getTournamentData(configUpdateInterval, callback) {
    if (this.boardUpdateInterval < configUpdateInterval) {
      this.boardUpdateInterval = configUpdateInterval
    }
    const response = await fetch(this.url, {
      method: 'get',
    })
    Log.debug(`[MMM-PGA] ${this.url} fetched`)

    const body = await response.json()

    var ESPNObj = body.events

    var event = null

    // TODO change eventually to suppourt multiple events at the same time

    // Return the event with the biggest purse that is not canceled
    var purses = []
    try {
      for (let j = 0; j < ESPNObj.length; j++) {
        if (ESPNObj[j].status.type.name != 'STATUS_CANCELED') {
          if (ESPNObj[j].purse === undefined) {
            purses.push(999999999999)
          }
          else {
            purses.push(Number(ESPNObj[j].purse))
          }
        }
      }
      if (purses.length > 0) {
        event = ESPNObj[purses.indexOf(Math.max(...purses))]
      }
      else {
        event = ESPNObj[0]
      }
    }
    catch {
      Log.debug('[MMM-PGA] One of the tournaments this week does not have a purse; using the last listed tournament')
      event = ESPNObj[ESPNObj.length - 1]
    }

    var tournament = {}

    // Tournament Details
    tournament.name = event.shortName
    tournament.date = this.getEventDate(event.date, event.endDate)
    tournament.location = this.getEventLocation(event)
    tournament.statusCode = event.status.type.name
    tournament.status = event.competitions[0].status ? event.competitions[0].status.type.detail : ''
    if (event.displayPurse !== undefined) {
      tournament.purse = event.displayPurse
    }
    else {
      tournament.purse = this.currentTourneyPurse[tournament.name.toLowerCase()]
    }
    // tournament.defendingChamp = event.defendingChampion ? event.defendingChampion.athlete.displayName : ''
    tournament.currentRound = this.getCurrentRound(event)
    tournament.playoff = false
    if (/* true || */ event.competitions[0].status.type.name === 'STATUS_IN_PROGRESS') {
      tournament.broadcast = await this.getBroadcasts()
    }
    else {
      tournament.broadcast = []
      /*       for (let i = 0; i < event.competitions[0].broadcasts.length; i++) {
        tournament.broadcast.push([event.competitions[0].broadcasts[i].media.slug, ''])
      } */
    }

    // Load the Players for the tournament
    tournament.players = []

    if (tournament.statusCode != 'STATUS_SCHEDULED') {
      var espnPlayers = event.competitions[0].competitors

      for (var i in espnPlayers) {
        var espnPlayer = espnPlayers[i]
        if (espnPlayer.status.playoff)
          tournament.playoff = true

        // Adapt for team events
        if (espnPlayer.athlete) {
          var name = espnPlayer.athlete.displayName
          var flagHref = espnPlayer.athlete.flag.href
          var playerID = espnPlayer.athlete.id
        }
        else if (espnPlayer.team) {
          name = espnPlayer.team.displayName
          flagHref = ''
          playerID = espnPlayer.id
        }
        else {
          name = 'Name not avail.'
          flagHref = ''
          playerID = 'n/a'
        }

        tournament.players.push({
          name: name,
          position: espnPlayer.status.position.displayName,
          posId: parseInt(espnPlayer.status.position.id),
          flagHref: flagHref,
          score: espnPlayer.statistics[0].displayValue,
          thru: this.getPlayerThru(espnPlayer),
          roundScore: this.getRoundScore(espnPlayer, tournament.currentRound),
          id: playerID,
          sortOrder: espnPlayer.sortOrder,
          playoff: espnPlayer.status.playoff,
        })
      }
    }

    Log.debug(event.status)
    Log.debug(event.competitions[0].status)
    const nextStart = new Date(Date.parse(event.date))
    if (event.status.type.name === 'STATUS_FINAL') { // When tournament has finished
      this.boardUpdateInterval = 30 * 60 * 1000 // 30 minutes
    }
    else if (event.status.type.name === 'STATUS_SCHEDULED') { // When tournament has not started
      Math.max(this.boardUpdateInterval = nextStart - new Date(), 15 * 60 * 1000) // when tourney "starts" per ESPN (midnight ET on the day the tournament starts) or 15 minutes, whichever is longer
    }
    else if (event.status.type.name !== 'STATUS_IN_PROGRESS') { // When tournament is done for the day
      this.boardUpdateInterval = 15 * 60 * 1000 // 15 minutes
    }
    else { // When tourament is in progress
      this.boardUpdateInterval = configUpdateInterval // Use the user's desired updateInterval
    }

    // Function to send SocketNotification with the Tournament Data
    // Log.debug(tournament)
    callback(tournament)
  },

  async getTournaments(numTournaments, callback) {
    var totalTourn = 0

    const response = await fetch(this.tournamentsUrl, {
      method: 'get',
    })
    Log.debug(`[MMM-PGA] ${this.tournamentsUrl} fetched`)

    const body = await response.json()

    var ESPNObj = body.seasons[0].events

    // Only look at future Tournaments
    ESPNObj = ESPNObj.filter(function (tournament) {
      return ((tournament.status == 'pre') || (tournament.status == 'in'))
    })

    if (numTournaments > ESPNObj.length) {
      totalTourn = ESPNObj.length
    }
    else {
      totalTourn = numTournaments
    }

    var tournaments = []

    for (let i = 0; i < totalTourn; i++) {
      var tournament = ESPNObj[i]
      var tourName = tournament.label ? tournament.label : ''
      var strDate = tournament.startDate ? tournament.startDate : ''
      var nDate = tournament.endDate ? tournament.endDate : ''
      if (tournament.locations[0]) {
        var venue = []
        for (let j = 0; j < tournament.locations.length; j++) {
          venue.push(tournament.locations[j])
        }
      }
      else {
        venue = ''
      }
      // var venue = tournament.locations[0] ? tournament.locations[0] : ''
      var purse = '-'
      if (tournament.purse && tournament.purse.displayValue) {
        purse = tournament.purse.displayValue
      }
      tournaments.push({
        name: tourName, // tournament.name,
        date: this.getEventDate(strDate, nDate), // tournament.startDate,tournament.endDate),
        location: venue, // tournament.locations[0].venue.fullName,
        purse: purse,
        defendingChamp: tournament.defendingChampion ? this.setUndefStr(tournament.defendingChampion.displayName) : '',

      })
    }

    var PGAbody = await fetch('https://orchestrator.pgatour.com/graphql', {
      credentials: 'omit',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'content-type': 'application/json',
        'x-api-key': 'da2-gsrx5bibzbb4njvhl7t37wqyl4',
        'x-pgat-platform': 'web',
        'x-amz-user-agent': 'aws-amplify/3.0.7',
        'Sec-GPC': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Priority': 'u=4',
      },
      referrer: 'https://www.pgatour.com/',
      body: `{"operationName":"Schedule","variables":{"tourCode":"R","year":"${new Date().getYear() + 1900}"},"query":"query Schedule($tourCode: String!, $year: String, $filter: TournamentCategory) {\\n  schedule(tourCode: $tourCode, year: $year, filter: $filter) {\\n    completed {\\n      month\\n      year\\n      monthSort\\n      ...ScheduleTournament\\n    }\\n    filters {\\n      type\\n      name\\n    }\\n    seasonYear\\n    tour\\n    upcoming {\\n      month\\n      year\\n      monthSort\\n      ...ScheduleTournament\\n    }\\n  }\\n}\\n\\nfragment ScheduleTournament on ScheduleMonth {\\n  tournaments {\\n    tournamentName\\n    id\\n    beautyImage\\n    champion\\n    champions {\\n      displayName\\n      playerId\\n    }\\n    championEarnings\\n    championId\\n    city\\n    country\\n    countryCode\\n    courseName\\n    date\\n    dateAccessibilityText\\n    purse\\n    sortDate\\n    startDate\\n    state\\n    stateCode\\n    status {\\n      roundDisplay\\n      roundStatus\\n      roundStatusColor\\n      roundStatusDisplay\\n    }\\n    tournamentStatus\\n    ticketsURL\\n    tourStandingHeading\\n    tourStandingValue\\n    tournamentLogo\\n    display\\n    sequenceNumber\\n    tournamentCategoryInfo {\\n      type\\n      logoLight\\n      logoDark\\n      label\\n    }\\n    tournamentSiteURL\\n    tournamentStatus\\n    useTournamentSiteURL\\n  }\\n}"}`,
      method: 'POST',
      mode: 'cors',
    })
    Log.debug('[MMM-PGA] https://orchestrator.pgatour.com/graphql fetched for tournament ID')
    PGAbody = await PGAbody.json()
    PGAbody = PGAbody.data.schedule
    this.currentTourneyId = PGAbody.upcoming[0].tournaments[0].id
    this.currentTourneyPurse[PGAbody.upcoming[0].tournaments[0].tournamentName.toLowerCase()] = PGAbody.upcoming[0].tournaments[0].purse
    this.currentTourneyPurse[PGAbody.completed[PGAbody.completed.length - 1].tournaments[PGAbody.completed[PGAbody.completed.length - 1].tournaments.length - 1].tournamentName.toLowerCase()] = PGAbody.completed[PGAbody.completed.length - 1].tournaments[PGAbody.completed[PGAbody.completed.length - 1].tournaments.length - 1].purse,

    // The following is an alternative way to get upcoming tournament info.  It is inferior because only a single course is listed, whereas ESPN provides all courses (E.g., Torrey Pines North and South for the Farmer's)
    /* var PGAObj = []
    for (let i=0; i < PGAbody.length; i++) {
      for (let j=0; j < PGAbody[i].tournaments.length; j++) {
        PGAObj.push(PGAbody[i].tournaments[j])
      }
    }

    if (numTournaments > PGAObj.length) {
      totalTourn = PGAObj.length
    }
    else {
      totalTourn = numTournaments
    }

    var tournaments = []

    for (let i = 0; i < totalTourn; i++) {
      var tourName = PGAObj[i].tournamentName
      var strDate = PGAObj[i].date
      var nDate = 'ndate'
      if (PGAObj[i].stateCode != '') {
        venue = [`${PGAObj[i].courseName} - ${PGAObj[i].city}, ${PGAObj[i].stateCode}`]
      }
      else {
        venue = [`${PGAObj[i].courseName} - ${PGAObj[i].city}, ${PGAObj[i].country}`]
      }
      var purse = PGAObj[i].purse
      if (purse === '$0') {
        purse = '-'
      }
      tournaments.push({
        name: tourName,
        date: strDate,
        location: venue,
        purse: purse,
        defendingChamp: '',
        logo: PGAObj[i].tournamentLogo,
      })
    } */

    callback(tournaments)
  },

  getCurrentRound: function (event) {
    // logic to handle playoffs For now we only showing information pertaininhg to rounds in regulation

    var currentRound = event.competitions[0].status ? event.competitions[0].status.period : ''
    var totalRounds = event.tournament.numberOfRounds
    return (currentRound <= totalRounds) ? currentRound : totalRounds
  },

  getEventDate: function (start, end) {
    var startDate = moment(start, 'YYYY-MM-DD HH:mm Z').local().format('MMM D')
    var endDate = moment(end, 'YYYY-MM-DD HH:mm Z').local().format('MMM D')
    return startDate + ' - ' + endDate
  },

  getEventLocation: function (event) {
    var courses = []
    for (let i = 0; i < event.courses.length; i++) {
      var course = event.courses[i]

      var city = this.setUndefStr(course.address.city)
      var state = this.setUndefStr(course.address.state)
      var appendstring = ', '

      if (city.length == 0 || state.length == 0) {
        appendstring = ''
      }

      courses.push(course.name + ' - ' + city + appendstring + state)
    }

    return courses
  },

  getRoundScore: function (player, round) {
    var roundScore = '-'
    var linescore = player.linescores[round - 1]

    if (!(typeof linescore == 'undefined' || linescore == null)) {
      roundScore = linescore.displayValue
    }

    return roundScore
  },

  getPlayerThru: function (player) {
    var displayValue = player.status.displayValue
    var append = (player.status.startHole == '1') ? '' : '*'

    var teeTime = moment(displayValue, 'YYYY-MM-DD HH:mm:ss Z')
    if (typeof displayValue == 'undefined' || displayValue == null) {
      var returnValue = player.status.displayThru + append
    }
    else if (displayValue == 'F') {
      returnValue = displayValue
    }
    else if (player.status.thru <= 17 && player.status.thru >= 1) {
      returnValue = displayValue + append
    }
    else if (teeTime.isValid()) {
      returnValue = teeTime.local().format('h:mm a') + append
    }
    else {
      returnValue = displayValue
    }

    return returnValue
  },

  setUndefStr: function (obj, defStr = '') {
    return (typeof obj == 'undefined') ? defStr : obj
  },

  async getBroadcasts() {
    /* if (this.currentTourneyId === '') {
      var currentTourneyId = await fetch('https://orchestrator.pgatour.com/graphql', {
        credentials: 'omit',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0', */
    //    'Accept': '*/*',
    /*    'Accept-Language': 'en-US,en;q=0.5',
          'content-type': 'application/json',
          'x-api-key': 'da2-gsrx5bibzbb4njvhl7t37wqyl4',
          'x-pgat-platform': 'web',
          'x-amz-user-agent': 'aws-amplify/3.0.7',
          'Sec-GPC': '1',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Priority': 'u=4',
        },
         referrer: 'https://www.pgatour.com/',
        body: `{"operationName":"Schedule","variables":{"tourCode":"R","year":"${new Date().getYear() + 1900}"},"query":"query Schedule($tourCode: String!, $year: String, $filter: TournamentCategory) {\\n  schedule(tourCode: $tourCode, year: $year, filter: $filter) {\\n    completed {\\n      month\\n      year\\n      monthSort\\n      ...ScheduleTournament\\n    }\\n    filters {\\n      type\\n      name\\n    }\\n    seasonYear\\n    tour\\n    upcoming {\\n      month\\n      year\\n      monthSort\\n      ...ScheduleTournament\\n    }\\n  }\\n}\\n\\nfragment ScheduleTournament on ScheduleMonth {\\n  tournaments {\\n    tournamentName\\n    id\\n    beautyImage\\n    champion\\n    champions {\\n      displayName\\n      playerId\\n    }\\n    championEarnings\\n    championId\\n    city\\n    country\\n    countryCode\\n    courseName\\n    date\\n    dateAccessibilityText\\n    purse\\n    sortDate\\n    startDate\\n    state\\n    stateCode\\n    status {\\n      roundDisplay\\n      roundStatus\\n      roundStatusColor\\n      roundStatusDisplay\\n    }\\n    tournamentStatus\\n    ticketsURL\\n    tourStandingHeading\\n    tourStandingValue\\n    tournamentLogo\\n    display\\n    sequenceNumber\\n    tournamentCategoryInfo {\\n      type\\n      logoLight\\n      logoDark\\n      label\\n    }\\n    tournamentSiteURL\\n    tournamentStatus\\n    useTournamentSiteURL\\n  }\\n}"}`,
        method: 'POST',
        mode: 'cors',
      })
      Log.debug('[MMM-PGA] https://orchestrator.pgatour.com/graphql fetched for current tournament ID')
      currentTourneyId = await currentTourneyId.json()
      this.currentTourneyId = currentTourneyId.data.schedule.upcoming[0].tournaments[0].id
    } */

    /* while (this.currentTourneyId === '') {
      Log.debug('waiting...')
    } */
    var pgaBroadcasts = await fetch('https://orchestrator.pgatour.com/graphql', {
      credentials: 'omit',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'content-type': 'application/json',
        'x-api-key': 'da2-gsrx5bibzbb4njvhl7t37wqyl4',
        'x-pgat-platform': 'web',
        'x-amz-user-agent': 'aws-amplify/3.0.7',
        'Sec-GPC': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Priority': 'u=4',
      },
      referrer: 'https://www.pgatour.com/',
      body: `{"operationName":"Coverage","variables":{"tournamentId":"${this.currentTourneyId}"},"query":"query Coverage($tournamentId: ID!) {\\n  coverage(tournamentId: $tournamentId) {\\n    id\\n    tournamentName\\n    countryCode\\n    coverageType {\\n      ... on BroadcastFullTelecast {\\n        __typename\\n        id\\n        streamTitle\\n        roundNumber\\n        channelTitle\\n        roundDisplay\\n        startTime\\n        endTime\\n        promoImage\\n        promoImages\\n        liveStatus\\n        network {\\n          id\\n          networkName\\n          backgroundColor\\n          backgroundColorDark\\n          networkLogo\\n          networkLogoDark\\n          priorityNum\\n          url\\n          iOSLink\\n          appleAppStore\\n          androidLink\\n          googlePlayStore\\n          simulcast\\n          simulcastUrl\\n          streamUrl\\n          iosStreamUrl\\n          androidStreamUrl\\n        }\\n      }\\n      ... on BroadcastFeaturedGroup {\\n        __typename\\n        id\\n        streamTitle\\n        roundNumber\\n        channelTitle\\n        roundDisplay\\n        startTime\\n        endTime\\n        courseId\\n        groups {\\n          id\\n          extendedCoverage\\n          playerLastNames\\n          liveStatus\\n        }\\n        promoImage\\n        promoImages\\n        liveStatus\\n        network {\\n          id\\n          networkName\\n          backgroundColor\\n          backgroundColorDark\\n          networkLogo\\n          networkLogoDark\\n          priorityNum\\n          url\\n          iOSLink\\n          appleAppStore\\n          androidLink\\n          googlePlayStore\\n          simulcast\\n          simulcastUrl\\n          streamUrl\\n          iosStreamUrl\\n          androidStreamUrl\\n        }\\n      }\\n      ... on BroadcastFeaturedHole {\\n        __typename\\n        id\\n        streamTitle\\n        roundNumber\\n        channelTitle\\n        roundDisplay\\n        startTime\\n        endTime\\n        courseId\\n        featuredHoles\\n        promoImage\\n        promoImages\\n        liveStatus\\n        network {\\n          id\\n          networkName\\n          backgroundColor\\n          backgroundColorDark\\n          networkLogo\\n          networkLogoDark\\n          priorityNum\\n          url\\n          iOSLink\\n          appleAppStore\\n          androidLink\\n          googlePlayStore\\n          simulcast\\n          simulcastUrl\\n          streamUrl\\n          iosStreamUrl\\n          androidStreamUrl\\n        }\\n      }\\n      ... on BroadcastCoverageCarousel {\\n        __typename\\n        carousel {\\n          ... on BroadcastFullTelecast {\\n            __typename\\n            id\\n            streamTitle\\n            roundNumber\\n            channelTitle\\n            roundDisplay\\n            startTime\\n            endTime\\n            promoImage\\n            promoImages\\n            liveStatus\\n            network {\\n              id\\n              networkName\\n              backgroundColor\\n              backgroundColorDark\\n              networkLogo\\n              networkLogoDark\\n              priorityNum\\n              url\\n              iOSLink\\n              appleAppStore\\n              androidLink\\n              googlePlayStore\\n              simulcast\\n              simulcastUrl\\n              streamUrl\\n              iosStreamUrl\\n              androidStreamUrl\\n            }\\n          }\\n          ... on BroadcastFeaturedGroup {\\n            __typename\\n            id\\n            streamTitle\\n            roundNumber\\n            channelTitle\\n            roundDisplay\\n            startTime\\n            endTime\\n            courseId\\n            groups {\\n              id\\n              extendedCoverage\\n              playerLastNames\\n              liveStatus\\n            }\\n            promoImage\\n            promoImages\\n            liveStatus\\n            network {\\n              id\\n              networkName\\n              backgroundColor\\n              backgroundColorDark\\n              networkLogo\\n              networkLogoDark\\n              priorityNum\\n              url\\n              iOSLink\\n              appleAppStore\\n              androidLink\\n              googlePlayStore\\n              simulcast\\n              simulcastUrl\\n              streamUrl\\n              iosStreamUrl\\n              androidStreamUrl\\n            }\\n          }\\n          ... on BroadcastFeaturedHole {\\n            __typename\\n            id\\n            streamTitle\\n            roundNumber\\n            channelTitle\\n            roundDisplay\\n            startTime\\n            endTime\\n            courseId\\n            featuredHoles\\n            promoImage\\n            promoImages\\n            liveStatus\\n            network {\\n              id\\n              networkName\\n              backgroundColor\\n              backgroundColorDark\\n              networkLogo\\n              networkLogoDark\\n              priorityNum\\n              url\\n              iOSLink\\n              appleAppStore\\n              androidLink\\n              googlePlayStore\\n              simulcast\\n              simulcastUrl\\n              streamUrl\\n              iosStreamUrl\\n              androidStreamUrl\\n            }\\n          }\\n        }\\n      }\\n    }\\n  }\\n}"}`,
      method: 'POST',
      mode: 'cors',
    })
    Log.debug('[MMM-PGA] https://orchestrator.pgatour.com/graphql fetched for broadcasts')
    pgaBroadcasts = await pgaBroadcasts.json()
    pgaBroadcasts = pgaBroadcasts.data.coverage.coverageType
    var broadcast = []
    var alreadyAdded = []
    const darkLogos = ['ESPN+', 'PGA Championship', 'CBS']
    for (let i = 0; i < pgaBroadcasts.length; i++) {
      if (pgaBroadcasts[i].__typename !== 'BroadcastCoverageCarousel') {
        if ((/* true || */ pgaBroadcasts[i].liveStatus === 'LIVE') && pgaBroadcasts[i].streamTitle.endsWith('Broadcast') && !alreadyAdded.includes(pgaBroadcasts[i].network.networkName)) {
          var newNetwork = [pgaBroadcasts[i].network.networkName]
          if (this.broadcastIcons[pgaBroadcasts[i].network.networkName] !== undefined) {
            newNetwork.push(this.broadcastIcons[pgaBroadcasts[i].network.networkName])
          }
          else if (this.broadcastIconsInvert[pgaBroadcasts[i].network.networkName] !== undefined) {
            newNetwork.push(this.broadcastIconsInvert[pgaBroadcasts[i].network.networkName])
            newNetwork.push('invert')
          }
          else if (darkLogos.includes(pgaBroadcasts[i].network.networkName)) {
            newNetwork.push(pgaBroadcasts[i].network.networkLogoDark)
          }
          else {
            newNetwork.push(pgaBroadcasts[i].network.networkLogo)
          }
          broadcast.push(newNetwork)
          alreadyAdded.push(pgaBroadcasts[i].network.networkName)
        }
      }
    }

    return broadcast
  },
  broadcastIcons: {
    // espn: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ESPN_wordmark.svg',
    // 'ESPN+': './modules/MMM-PGA/logos/channels/ESPN+.svg',
    // paramountplus: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Paramount%2B_logo.svg',
    'Paramount+': 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Paramount%2B_logo.svg',
  },
  broadcastIconsInvert: {
    // cbs: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/CBS_logo_%282020%29.svg',
  },

}
