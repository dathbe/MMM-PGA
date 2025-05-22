/* MagicMirror²
* Module: MMM-PGA
*
* By mcl8on
*/

Module.register('MMM-PGA', {

  requiresVersion: '2.1.0',

  // Module config defaults.
  defaults: {
    useHeader: true,
    header: 'PGA Tournament',
    upcomingTournamentHeader: 'PGA - UPCOMING TOURNAMENTS',
    fedexCupHeader: 'FedExCup STANDINGS',
    owgrHeader: 'OFFICIAL WORLD GOLF RANKING',
    rotateInterval: 30 * 1000,
    animationSpeed: 750, // fade in and out speed in milliseconds
    initialLoadDelay: 4250,
    retryDelay: 2500,
    updateInterval: 4 * 60 * 1000, // every 4 minutes for leaderboards
    rankingsUpdateInterval: 4 * 60 * 60 * 1000, // every 4 hours
    colored: true,
    showBoards: true,
    showLocation: true,
    showPurse: true,
    numTournaments: 3,
    showRankings: null,
    showFedex: true,
    showOWGR: true,
    numRankings: 5,
    maxNumRankings: 50,
    numLeaderboard: 5,
    maxLeaderboard: 10,
    includeTies: true,
    showLogo: false,
    showFlags: false,
    largerFont: false,
    remoteFavoritesFile: null,
    rapidAPIKey: '',
    favorites: [],
    showBroadcast: true,
    locationRotateInterval: 10000,
    skipChannels: [],
    channelRotateInterval: 7000,
  },

  logoIndex: 0,

  getStyles: function () {
    return ['MMM-PGA.css']
  },

  /* locationIndex: 0, */

  /* Called whe Module starts set up some gloab config info */

  start: function () {
    Log.info('Starting module: ' + this.name)

    // Image Set Up
    this.pgalogohtml = '<img src=\'./modules/MMM-PGA/images/pga-tour-logo.svg\' class=\'tourlogo\'></img> '
    this.flaghtml = '<img src=\'http\' alt=\'\' align=top></img>'

    this.cardIndex = 0

    if (this.config.showRankings === false) {
      this.config.showFedex = false
      this.config.showOWGR = false
    }

    if (this.config.largerFont) {
      this.flaghtml = this.flaghtml.replace(/22/g, '30')
    }

    // Set up For Showing Info when a tournament is not active
    // this.nonActiveIndex = 0 // Start With Tournament List
    this.rankingObjs = {}
    // Set number of rankings to MAX if user requested more than max
    if (this.config.numRankings > this.config.maxNumRankings) this.config.numRankings = this.config.maxNumRankings

    // Set up for Active tournament
    // this.boardIndex = 0 // Starts with the Leaderboard
    this.rotateInterval = null
    this.tournament = null
    this.tournaments = null
    this.loaded = false
    this.numBoards = 1 + this.config.favorites.length

    this.updateFavorites()

    // Schedule the data Retrival on the server side
    this.sendSocketNotification('CONFIG', this.config)

    this.fontClass = (this.config.largerFont) ? 'small' : 'xsmall'

    /*     // Schedule the first location rotation
    this.rotateLocations()

    // Schedule the UI load based on normal interval
    var self = this
    setInterval(function () {
      self.rotateLocations()
    }, this.config.locationRotateInterval) */

    // Schedule the first logo rotation
    this.rotateChannels()

    // Schedule the UI load based on normal interval
    var self = this
    setInterval(function () {
      self.rotateChannels()
    }, this.config.channelRotateInterval)
  },

  /*   stop: function () {
    Log.info('Stopping module ' + this.name)
  }, */

  // If Configured for a remote file retrieve the favorites from remote source
  // Set up the boared index and numboard properties
  updateFavorites: function () {
    // Set Up Favorite if Remote File is Set

    var self = this
    if (this.config.remoteFavoritesFile !== null) {
      this.getFavoriteFile(function (response) {
        self.config.favorites = response
        self.numBoards = 1 + self.config.favorites.length
        // self.boardIndex = 0
      })
    }
  },

  async getFavoriteFile(callback) {
    const isRemote = this.config.remoteFavoritesFile.indexOf('http://') === 0 || this.config.remoteFavoritesFile.indexOf('https://') === 0
    const path = isRemote ? this.config.remoteFavoritesFile : this.file(this.config.remoteFavoritesFile)

    const response = await fetch(path)
    const jsonResponse = await response.json()
    callback(jsonResponse)
  },

  // Create a TH of the Leader Board
  buildTh: function (val, left = false, span = 1, right = false) {
    var th = document.createElement('th')
    th.classList.add(this.fontClass, 'bright', 'th-color')
    if (left) th.classList.add('th-left-aligned')
    if (right) th.classList.add('th-right-aligned')
    if (span > 1) th.colSpan = span

    th.innerHTML = val
    return th
  },

  // Create a TD for the Leader Board

  buildTD: function (val, classlist = []) {
    var td = document.createElement('td')
    td.classList.add(this.fontClass)
    if (classlist.length > 0) td.classList.add(...classlist)
    td.innerHTML = val

    return td
  },

  getScoreColorClass: function (val) {
    var cl = []

    colorClass = ''

    if (val == 'E') var colorClass = 'td-total-even'
    if (val.charAt(0) == '-' && val.length > 1) colorClass = 'td-total-under'
    if (val.charAt(0) == '+') colorClass = 'td-total-above'
    if (colorClass.length > 0) cl.push(colorClass)

    return cl
  },

  /* Builds the Dom for the Board */
  buildLeaderBoard: function (board) {
    var self = this

    var players = this.tournament.players

    players.sort(function (a, b) {
      return a.sortOrder - b.sortOrder
    })

    // If Favorites is enabled create Array with only the Favorites
    function includePlayer(player) {
      return self.config.favorites[board].favoriteList.includes(player.id)
    }
    if (typeof board === 'number') {
      var favs = players.filter(includePlayer)
      if (favs.length > 0) {
        players = favs
        var len = players.length
      }
    }

    // Create Board Header
    var leaderboard = document.createElement('div')
    var leaderboardSeparator = document.createElement('div')
    leaderboardSeparator.classList.add('leaderboard-separator')
    leaderboard.appendChild(leaderboardSeparator)

    var boardName = document.createElement('span')
    // Set  Board header Text
    if (board === 'leaderboard') {
      len = players.length < this.config.maxLeaderboard ? players.length : this.config.maxLeaderboard
      var boardHeader = '&nbsp;'
    }
    else {
      boardHeader = this.config.favorites[board].headerName
    }
    boardName.innerHTML = boardHeader
    leaderboardSeparator.appendChild(boardName)

    var boardStatus = document.createElement('span')
    boardStatus.classList.add('event-status')
    boardStatus.innerHTML = this.tournament.status
    leaderboardSeparator.appendChild(boardStatus)

    // Build table with Score details
    var lbTable = document.createElement('table')
    lbTable.classList.add('leaderboard-table')
    leaderboard.appendChild(lbTable)

    var namespan = 1
    if (this.config.showFlags) namespan++
    // if (this.tournament.playoff) namespan++;

    // Leader Board Table Header
    var lbhead = document.createElement('tr')
    lbTable.appendChild(lbhead)

    var posTh = this.buildTh('POS', true)
    posTh.classList.add('pos-cell')
    lbhead.appendChild(posTh)

    if (this.tournament.playoff) {
      var playoffTh = this.buildTh('')
      playoffTh.classList.add('playoff-cell')
      lbhead.appendChild(playoffTh)
    }

    var playerTh = this.buildTh('Player Name', true, namespan)
    playerTh.classList.add('player-name')
    lbhead.appendChild(playerTh)

    var roundTh = this.buildTh('R' + this.tournament.currentRound)
    roundTh.classList.add('current-round')
    lbhead.appendChild(roundTh)

    var totalTh = this.buildTh('TOTAL')
    totalTh.classList.add('total-cell')
    lbhead.appendChild(totalTh)

    var thruTh = this.buildTh('THRU', false, 1, true)
    thruTh.classList.add('thru-cell')
    lbhead.appendChild(thruTh)

    // Body of the Table Loop through the Players add a Row For Each Player
    var lastpos = 0
    for (let i = 0; i < len; i++) {
      var player = players[i]
      var playerpos = player.posId

      // Only do tie logic for Leaderboards
      // Favorites will display ALL
      if (board === 'leaderboard') {
        if (i == this.config.numLeaderboard - 1) lastpos = playerpos

        if (i > this.config.numLeaderboard - 1) {
          if (playerpos > lastpos || !this.config.includeTies) break
        }
      }

      // Leader Board Row
      var lbrow = document.createElement('tr')
      lbTable.appendChild(lbrow)

      lbrow.appendChild(this.buildTD(player.position, ['pos-cell']))
      if (this.tournament.playoff) {
        var pind = (player.playoff) ? '►' : ''
        lbrow.appendChild(this.buildTD(pind, ['td-playoff', 'playoff-cell']))
      }
      if (this.config.showFlags && player.flagHref !== '') {
        var fHTML = this.flaghtml.replace('http', player.flagHref)
        lbrow.appendChild(this.buildTD(fHTML, ['td-img', 'flag-cell']))
      }
      else if (player.flagHref === '') {
        lbrow.appendChild(this.buildTD('', ['flag-cell']))
      }
      lbrow.appendChild(this.buildTD(player.name, ['player-name', 'bright']))

      var cl = this.getScoreColorClass(player.roundScore)
      cl.push('td-center-aligned')
      cl.push('current-round')
      lbrow.appendChild(this.buildTD(player.roundScore, cl))

      cl = this.getScoreColorClass(player.score)
      cl.push('td-center-aligned')
      cl.push('total-cell')
      lbrow.appendChild(this.buildTD(player.score, cl))
      lbrow.appendChild(this.buildTD(player.thru, ['td-right-aligned', 'thru-cell']))
    }
    return leaderboard
  },

  buildTournamentList: function (tournaments, border = true) {
    // Build the list of upcming tournaments

    // Create the HTML table
    var tourTable = document.createElement('table')
    tourTable.classList.add('tournament-table')

    for (var i in tournaments) {
      var tournament = tournaments[i]

      var trow = document.createElement('tr')
      tourTable.appendChild(trow)

      var dateTd = document.createElement('td')
      dateTd.classList.add(this.fontClass, 'date-cell', 'bright')
      if (border) dateTd.classList.add('border')
      if (this.config.showLocation && (!this.config.showBroadcast || tournament.broadcast === undefined)) dateTd.rowSpan = 2
      dateTd.innerHTML = tournament.date
      trow.appendChild(dateTd)

      var nameTd = document.createElement('td')
      nameTd.classList.add(this.fontClass, 'bright', 'tournament-name')
      if (!this.config.showLocation && border) nameTd.classList.add('border')
      if (!this.config.showLocation) dateTd.rowSpan = 2
      nameTd.innerHTML = tournament.name
      trow.appendChild(nameTd)

      if (this.config.showPurse) {
        var purseTd = document.createElement('td')
        purseTd.classList.add('xsmall', 'purse-cell')
        if (!this.config.showLocation) purseTd.classList.add('border')
        if (this.config.showLocation) purseTd.rowSpan = 1
        purseTd.innerHTML = 'Purse: ' + tournament.purse
        trow.appendChild(purseTd)
      }

      tourTable.appendChild(trow)

      // Second Row
      if (this.config.showLocation || this.config.showBroadcast) {
        var secondRow = document.createElement('tr')
        tourTable.appendChild(secondRow)

        if (this.config.showBroadcast && tournament.broadcast !== undefined) {
          var broadcastTd = document.createElement('td')
          // locationTd.colSpan = 2
          broadcastTd.classList.add('xsmall', 'broadcast')
          if (border) broadcastTd.classList.add('border')
          if (tournament.broadcast !== undefined) {
            for (let j = 0; j < tournament.broadcast.length; j++) {
              if (!this.config.skipChannels.includes(tournament.broadcast[j][0])) {
                var broadcastDiv = document.createElement('div')
                broadcastDiv.classList.add('PGAbroadcastIconDiv')
                if (tournament.broadcast[j][1] !== '') {
                  var broadcastImage = new Image()
                  broadcastImage.src = tournament.broadcast[j][1]
                  broadcastImage.alt = tournament.broadcast[j][0]
                  broadcastDiv.appendChild(broadcastImage)
                }
                else {
                  broadcastDiv.innerHTML = tournament.broadcast[j][0] /* .toUpperCase().replace('PLUS', '+') */
                }
                if (tournament.broadcast[j][2] !== undefined) {
                  broadcastDiv.classList.add(tournament.broadcast[j][2])
                }
                broadcastTd.appendChild(broadcastDiv)
              }
            }
          }
          secondRow.appendChild(broadcastTd)
        }
        if (this.config.showLocation) {
          var locationTd = document.createElement('td')
          locationTd.colSpan = 2
          locationTd.classList.add('location')
          if (border) locationTd.classList.add('border')
          for (let j = 0; j < tournament.location.length; j++) {
            var locationDiv = document.createElement('div')
            locationDiv.classList.add('xsmall', 'locationDiv')
            locationDiv.innerHTML = tournament.location[j]
            locationTd.appendChild(locationDiv)
          }
          // locationTd.innerHTML = tournament.location[0]
          secondRow.appendChild(locationTd)
        }
      }
    }

    return tourTable
  },

  // Create a TH of the Leader Board
  buildRankingTh: function (val) {
    var th = document.createElement('th')
    th.classList.add(this.fontClass, 'color-headings')
    th.innerHTML = val
    return th
  },

  buildRankingTD: function (val) {
    var td = document.createElement('td')
    td.classList.add(this.fontClass)
    // if (classlist.length >0) td.classList.add(...classlist);
    td.innerHTML = val
    return td
  },

  getCurWeekText: function (player) {
    var arrowText = ''

    if (player.curPosition == player.lwPosition) {
      arrowText = '<span class=\'no-change dimmed\'>►</span>'
    }
    else if (parseInt(player.curPosition) < parseInt(player.lwPosition) || player.lwPosition == '') {
      arrowText = '<span class=\'up\'>▲</span>'
    }
    else if (parseInt(player.curPosition) > parseInt(player.lwPosition)) {
      arrowText = '<span class=\'down\'>▼</span>'
    }

    if (player.curPosition < 10) {
      var spacing = '&nbsp;&nbsp;'
    }
    else {
      spacing = ''
    }

    return (arrowText + spacing + player.curPosition)
  },

  buildRankList: function (rankings) {
    // Create the HTML table
    var rankTable = document.createElement('table')
    rankTable.classList.add('ranking-table')

    // Create Table headings
    var rankHead = document.createElement('tr')
    rankTable.appendChild(rankHead)

    var thCurrWeek = this.buildRankingTh('This<br>Week')
    thCurrWeek.classList.add('current-week')
    rankHead.appendChild(thCurrWeek)

    var thLastWeek = this.buildRankingTh('Last<br>Week')
    thLastWeek.classList.add('last-week')
    rankHead.appendChild(thLastWeek)

    var thPlayerName = this.buildRankingTh('Player Name')
    thPlayerName.classList.add('player-name')
    if (this.config.showFlags) thPlayerName.colSpan = 2
    rankHead.appendChild(thPlayerName)

    var heading = rankings.pointsHeading
    heading = heading.replace(' ', '<br>')
    var thPoints = this.buildRankingTh(heading)
    thPoints.classList.add('points')
    rankHead.appendChild(thPoints)

    // Create Table Body

    var numplayers = (this.config.numRankings < this.config.maxNumRankings) ? this.config.numRankings : this.config.maxNumRankings

    for (let i = 0; i < numplayers; i++) {
      var player = rankings.rankings[i]
      var rankRow = document.createElement('tr')
      rankTable.appendChild(rankRow)

      var tdCurrWeek = this.buildRankingTD(this.getCurWeekText(player))
      tdCurrWeek.classList.add('current-week')
      rankRow.appendChild(tdCurrWeek)

      if (player.lwPosition < 10) {
        var spacing = '&nbsp;&nbsp;'
      }
      else {
        spacing = ''
      }
      var tdLastWeek = this.buildRankingTD(spacing + player.lwPosition)
      tdLastWeek.classList.add('last-week', 'dimmed')
      rankRow.appendChild(tdLastWeek)

      if (this.config.showFlags) {
        var flagHtml = this.flaghtml.replace('http', player.flagUrl)
        var flagtd = this.buildRankingTD(flagHtml)
        flagtd.classList.add('img', 'flag-cell')
        rankRow.appendChild(flagtd)
      }

      var tdPlayerName = this.buildRankingTD(player.name)
      tdPlayerName.classList.add('player-name', 'bright')
      rankRow.appendChild(tdPlayerName)

      var tdPoints = this.buildRankingTD(player.points)
      tdPoints.classList.add('points')
      rankRow.appendChild(tdPoints)
    }

    return rankTable
  },

  buildHeader: function (card) {
    var header = document.createElement('header')

    if (card === 'leaderboard' || typeof card === 'number') {
      var headerText = this.config.header
    }
    else if (card === 'upcoming') {
      headerText = this.config.upcomingTournamentHeader
    }
    else if (card === 'owgr') {
      headerText = this.config.owgrHeader
    }
    else if (card === 'fedex') {
      headerText = this.config.fedexCupHeader
    }
    else {
      headerText = 'PGA'
    }

    header.classList.add('pga_header_wrapper')
    var headerTextSpan = document.createElement('span')
    headerTextSpan.classList.add('pga_header', 'bright')
    headerTextSpan.innerHTML = headerText
    if (this.config.showLogo) {
      headerTextSpan.innerHTML = this.pgalogohtml + headerTextSpan.innerHTML
    }
    header.appendChild(headerTextSpan)
    return header
  },

  /* Main MagicMirror² module to build the Contect of the module */

  getDom: function () {
    var wrapper = document.createElement('div')
    wrapper.className = 'wrapper'
    if (!this.config.colored) {
      wrapper.classList.add('grayscale')
    }
    wrapper.style.maxWidth = this.config.maxWidth

    // If Data is not Loaded yet display the Loading Caption
    if (!this.loaded) {
      wrapper.innerHTML = 'Loading MMM-PGA...'
      wrapper.classList.add('light', 'small', 'dimmed')
      return wrapper
    }

    // Determine which cards we want to display
    if (this.tournament !== null && this.tournament.statusCode !== 'STATUS_SCHEDULED' && this.config.showBoards) {
      this.currentCards = ['leaderboard']
      for (let i = 0; i < this.config.favorites.length; i++) {
        var self = this
        // Don't display favorite list unless there are some players on the list competing in the tournament
        function includePlayer(player) {
          return self.config.favorites[i].favoriteList.includes(player.id)
        }
        var checkFavs = this.tournament.players
        if (checkFavs.filter(includePlayer).length > 0) {
          this.currentCards.push(i)
        }
      }
    }
    else {
      this.currentCards = ['upcoming']
    }
    if (this.tournament === null || ['STATUS_SCHEDULED', 'STATUS_FINAL'].includes(this.tournament.statusCode)) {
      if (this.config.showOWGR) {
        this.currentCards.push('owgr')
      }
      if (this.config.showFedex) {
        this.currentCards.push('fedex')
      }
    }

    // creating the header
    if (this.config.useHeader != false) {
      wrapper.appendChild(this.buildHeader(this.currentCards[this.cardIndex]))
    }

    // creating the card body
    if (this.currentCards[this.cardIndex] === 'leaderboard' || typeof this.currentCards[this.cardIndex] === 'number') {
      var curTourneyList = [this.tournament]
      var tdetails = this.buildTournamentList(curTourneyList, false)
      wrapper.appendChild(tdetails)
      var list = this.buildLeaderBoard(this.currentCards[this.cardIndex])
    }
    else if (this.currentCards[this.cardIndex] === 'upcoming') {
      list = this.buildTournamentList(this.tournaments)
    }
    else if (['owgr', 'fedex'].includes(this.currentCards[this.cardIndex])) {
      list = this.buildRankList(this.rankingObjs[this.currentCards[this.cardIndex]].rankingObj)
    }
    wrapper.appendChild(list)

    return wrapper
  },

  // this rotates your data
  scheduleCarousel: function () {
    // Log.debug('[MMM-PGA] schedule carousel')
    this.rotateInterval = setInterval(() => {
      /* if (this.config.favorites.length == 0) {
        this.boardIndex = 0
      }
      else {
        this.boardIndex = (this.boardIndex == this.numBoards - 1) ? 0 : this.boardIndex + 1
      } */

      // var numRankingObj = Object.keys(this.rankingObjs).length
      // this.nonActiveIndex = (this.nonActiveIndex == numRankingObj) ? 0 : this.nonActiveIndex + 1

      this.cardIndex++
      if (this.cardIndex >= this.currentCards.length) {
        this.cardIndex = 0
      }
      if (this.currentCards.length > 1) {
        this.updateDom(this.config.animationSpeed)
      }
      
    }, this.config.rotateInterval)
  },

  rotateChannels: function () {
    let logos = document.getElementsByClassName('PGAbroadcastIconDiv')
    if (logos.length > 1) {
      for (let i = 0; i < logos.length; i++) {
        logos[i].style.display = 'none'
      }
      if (logos.length > 0) {
        logos[(this.logoIndex) % logos.length].style.display = 'block'
        // logos[moment().unix() % logos.length].style.display = "block"
      }
      this.logoIndex++
      if (this.logoIndex === 17280) {
        this.logoIndex = 0
      }
    }
    else if (logos.length > 0) {
      logos[0].style.display = 'block'
    }
  },

  // Called by MM Framework when new data has been retrieved
  socketNotificationReceived: function (notification, payload) {
    if (notification === 'PGA_RESULT') {
      this.tournament = payload
      this.loaded = true
      if (this.rotateInterval == null) {
        this.scheduleCarousel()
      }
      this.updateDom()
    }

    else if (notification == 'PGA_TOURNAMENT_LIST') {
      this.tournaments = payload
      this.loaded = true
      if (this.rotateInterval == null) {
        this.scheduleCarousel()
      }
      // this.updateDom(this.config.animationSpeed)
    }
    else if (notification == 'OWGR_RANKING') {
      this.rankingObjs.owgr = { headerTxt: this.config.owgrHeader, rankingObj: payload }
      // this.loaded = true
      if (this.rotateInterval == null) {
        this.scheduleCarousel()
      }
      // this.updateDom(this.config.animationSpeed)
    }
    else if (notification == 'FEDEXCUP_RANKING') {
      this.rankingObjs.fedex = { headerTxt: this.config.fedexCupHeader, rankingObj: payload }
      // this.loaded = true
      if (this.rotateInterval == null) {
        this.scheduleCarousel()
      }
      // this.updateDom(this.config.animationSpeed)
    }
    else if (notification == 'UPDATE_FAVORITES') {
      Log.debug('[MMM-PGA] Update Favorites')
      this.updateFavorites()
    }
    /* else {
      this.updateDom(this.config.initialLoadDelay)
    } */
  },
})
