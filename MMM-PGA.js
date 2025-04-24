
/* Magic Mirror
 * Module: MMM-PGA
 *
 * By mcl8on
 */


Module.register("MMM-PGA", {

    requiresVersion: "2.1.0",

    // Module config defaults.
    defaults: {
        useHeader: true,
        header: "PGA Tournanment",
        minWidth: "300px",
        rotateInterval: 30 * 1000,
        animationSpeed: 0, // fade in and out speed
        initialLoadDelay: 4250,
        retryDelay: 2500,
        updateInterval: 5 * 60 * 1000,
        rankingsUpdateInterval: 240 * 60 * 1000,
        colored: true,
        showBoards: true,
        showLocation: true,
        showPurse: true,
        numTournaments: 3,
        showRankings: true,
        numRankings: 5,
        maxNumRankings: 50,
        numLeaderboard: 5,
        maxLeaderboard: 10,
        includeTies: true,
        showLogo: false,
        showFlags: false,
        largerFont: false,
        remoteFavoritesFile: null,
        rapidAPIKey: "rapid-api-key",
        favorites: [],

    },

    getStyles: function () {
        return ["MMM-PGA.css"];
    },

    /* Called whe Module starts set up some gloab config info*/

    start: function () {
        Log.info("Starting module: " + this.name);

        var self=this;

        // Image Set Up
        this.pgalogohtml = "<img src='./modules/MMM-PGA/images/PGAlogo.png' alt='' align=bottom height=15 width=15></img> ";
        this.flaghtml = "<img src='http' alt='' align=top height=22 width=22></img>";
        this.grayScaleStyle = "<img style='filter:grayscale(1)'";

        //Set up Flag configuration absed on settings

        if (!this.config.colored){
            this.pgalogohtml = this.pgalogohtml.replace("<img", this.grayScaleStyle);
            this.flaghtml = this.flaghtml.replace("<img",this.grayScaleStyle);
        }

        if (this.config.largerFont){
            this.flaghtml = this.flaghtml.replace(/22/g,"30");

        }


        //Set up For Showing Info when a tournament is not active
        this.nonActiveIndex=0;    //Start With Tournament List
        this.upcomingTournamentHeader = "Upcoming PGA TOURNAMENTS";
        this.fedexCupHeader = "FEDEX CUP STANDINGS";
        this.owgrHeader = "OFFICIAL WORLD GOLF RANKING";
        this.rankingObjs = {};
        //Set number of rankings to MAX if user requested more than max
        if (this.config.numRankings > this.config.maxNumRankings) this.config.numRankings = this.config.maxNumRankings;


        //Set up for Active tournament
        this.boardIndex = 0;       //Starts with the Leaderboard
        this.leaderboardHeader ="LEADERBOARD";
        this.rotateInterval = null;
        this.tournament = null;
        this.tournaments = null;
        this.loaded = false;
        this.tournamentsLoaded = false;
        this.numBoards = 1 + this.config.favorites.length;

        this.updateFavorites();


        //Schedule the data Retrival on the server side
        this.sendSocketNotification("CONFIG",this.config);

        this.fontClass = (this.config.largerFont)?"small":"xsmall";


    },

    stop: function () {
        Log.info('Stopping module ' + this.name);
      },

    //If Configured for a remote file retrieve the favorites from remote source
    //Set up the boared index and numboard properties
    updateFavorites: function(){
         //Set Up Favorite if Remote File is Set

         var self = this;
         if (this.config.remoteFavoritesFile !== null) {
			this.getFavoriteFile(function (response) {
                self.config.favorites= JSON.parse(response);
                self.numBoards = 1 + self.config.favorites.length;
                self.boardIndex = 0;
			});
		}
    },

    getFavoriteFile: function (callback) {
        var xobj = new XMLHttpRequest(),
		    isRemote = this.config.remoteFavoritesFile.indexOf("http://") === 0 || this.config.remoteFavoritesFile.indexOf("https://") === 0,
            path = isRemote ? this.config.remoteFavoritesFile : this.file(this.config.remoteFavoritesFile);      

		xobj.overrideMimeType("application/json");
		xobj.open("GET", path, true);
		xobj.onreadystatechange = function () {
			if (xobj.readyState === 4 && xobj.status === 200) {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);     
    },

    //Create a TH of the Leader Board
    buildTh: function (val, left = false, span = 1, right = false) {

        var th = document.createElement("th");
        th.classList.add(this.fontClass, "bright");
        if (this.config.colored) th.classList.add("th-color");
        if (left) th.classList.add("th-left-aligned");
        if (right) th.classList.add("th-right-aligned");
        if (span >1) th.colSpan = span;

        th.innerHTML = val;
        return th;
    },

    //Create a TD for the Leader Board

    buildTD: function (val, classlist = []) {

        var td = document.createElement("td");
        td.classList.add(this.fontClass, "bright");
        if (classlist.length >0) td.classList.add(...classlist);
        td.innerHTML = val;
            
        return td;
    },

    getScoreColorClass: function(val){
        var cl = [];

        colorClass = "";

        if (this.config.colored) {

            if (val == "E")  colorClass = "td-total-even";
            if (val.charAt(0) == '-' && val.length >1) colorClass = "td-total-under";
            if (val.charAt(0) == '+') colorClass = "td-total-above";
            if (colorClass.length>0) cl.push(colorClass);
        }

        return cl;

    },       

    /* Builds the Dom for the Board*/
    buildLeaderBoard: function (tournament) {

        var self = this;

        var players = tournament.players;
        
        players.sort(function (a, b) { return a.sortOrder - b.sortOrder; });

        Log.debug("[MMM-PGA] boardindex:" + this.boardIndex);

        //If Favorites is enabled create Array with only the Favorites
        function includePlayer(player){
            return self.config.favorites[self.boardIndex-1].favoriteList.includes(player.id);
        }
        while (this.boardIndex >= 1) {
            favs = players.filter(includePlayer);
            if (favs.length == 0){ 
                this.boardIndex++;
                if (this.boardIndex == this.numBoards) this.boardIndex=0;
            } else {
                players = favs;
                len = players.length;
                break;
            }    
        }

        if (this.boardIndex == 0) {
            len = players.length < this.config.maxLeaderboard ? players.length : this.config.maxLeaderboard;
        }

        // Create Board Header
        var leaderboard = document.createElement("div");
        var leaderboardSeparator = document.createElement("div");
        leaderboardSeparator.classList.add("leaderboard-separator");
        leaderboard.appendChild(leaderboardSeparator);

        var boardName = document.createElement("span");
        //Set  Board header Text
        if (this.boardIndex == 0){
            boardHeader = this.leaderboardHeader;
        } else {
            boardHeader = this.config.favorites[this.boardIndex-1].headerName;
        }
        boardName.innerHTML = boardHeader;
        leaderboardSeparator.appendChild(boardName);

        var boardStatus = document.createElement("span");
        boardStatus.classList.add("event-status");
        boardStatus.innerHTML = tournament.status;
        leaderboardSeparator.appendChild(boardStatus);




        // Build table with Score details
        var lbTable = document.createElement("table");
        lbTable.classList.add("leaderboard-table");
        leaderboard.appendChild(lbTable);

        namespan=1;
        if (this.config.showFlags) namespan++;
        //if (tournament.playoff) namespan++;

        //Leader Board Table Header
        var lbhead = document.createElement("tr");
        lbTable.appendChild(lbhead);
        lbhead.appendChild(this.buildTh("POS", true));
        if (tournament.playoff){
            lbhead.appendChild(this.buildTh(""));
        }
        lbhead.appendChild(this.buildTh("Player Name", left=true, namespan));
        lbhead.appendChild(this.buildTh("R"+tournament.currentRound));
        lbhead.appendChild(this.buildTh("TOTAL"));
        lbhead.appendChild(this.buildTh("THRU", false, 1, true));

        //Body of the Table Loop through the Players add a Row For Each Player        
        var lastpos = 0;
        for (i = 0; i < len; i++) {

            var player = players[i];
            var playerpos = player.posId;

            //Only do tie logic for Leaderboards
            //Favorites will display ALL
            if (this.boardIndex == 0) {

                if (i == this.config.numLeaderboard - 1) lastpos = playerpos;

                if (i > this.config.numLeaderboard - 1) {
                    if (playerpos > lastpos || !this.config.includeTies) break;
                } 
            }

            //Leader Board Row
            var lbrow = document.createElement("tr");
            lbTable.appendChild(lbrow);


            lbrow.appendChild(this.buildTD(player.position));
            if (tournament.playoff){      
                var pind = (player.playoff)?"►":"";
                lbrow.appendChild(this.buildTD(pind,["td-playoff"]));
            }
            if (this.config.showFlags && player.flagHref !== '') {
                var fHTML = this.flaghtml.replace("http", player.flagHref);
                lbrow.appendChild(this.buildTD(fHTML,["td-img"]));               
            }
            else if (player.flagHref === '') {
              lbrow.appendChild(this.buildTD(''));
            }
            lbrow.appendChild(this.buildTD(player.name));

        
            cl = this.getScoreColorClass(player.roundScore);
            cl.push("td-center-aligned");
            lbrow.appendChild(this.buildTD(player.roundScore,cl));
     
            cl = this.getScoreColorClass(player.score);
            cl.push("td-center-aligned");
            lbrow.appendChild(this.buildTD(player.score, cl));
            lbrow.appendChild(this.buildTD(player.thru, ["td-right-aligned"]));
            
        }
        return leaderboard;
    },

    buildTournamentList: function(tournaments, border = true){
        // Build the list of upcming tournaments
        
        //Create the HTML table
        var tourTable = document.createElement("table");
        tourTable.classList.add("tournament-table");

        var firstRowClasses = [ this.fontClass, "bright" ];
        

        for(var i in tournaments) { 

            
            var tournament = tournaments[i];
            
            var trow = document.createElement("tr");
            tourTable.appendChild(trow);

            var dateTd = document.createElement("td");
            dateTd.classList.add( ...firstRowClasses, "date-cell");
            if (border) dateTd.classList.add("border");
            if (this.config.showLocation) dateTd.rowSpan =2;
            dateTd.innerHTML = tournament.date;
            trow.appendChild(dateTd);

            var nameTd = document.createElement("td");
            nameTd.classList.add(...firstRowClasses);
            if (!this.config.showLocation && border) nameTd.classList.add("border");
            nameTd.innerHTML = tournament.name;
            trow.appendChild(nameTd);


            if (this.config.showPurse) {

                var purseTd = document.createElement("td");
                purseTd.classList.add(...firstRowClasses,"purse-cell");
                if(border) purseTd.classList.add("border");
                if (this.config.showLocation) purseTd.rowSpan =2;
                purseTd.innerHTML = "Purse: " + tournament.purse;
                trow.appendChild(purseTd);
            }

            tourTable.appendChild(trow);

            //Second Row
            if (this.config.showLocation){

                var secondRow = document.createElement("tr");
            
                tourTable.appendChild(secondRow);

                var locationTd = document.createElement("td");
                locationTd.colSpan =2;
                locationTd.classList.add("xsmall");
                if (border) locationTd.classList.add("border");
                locationTd.innerHTML = tournament.location; 
                secondRow.appendChild(locationTd);
            }
        }
        

        return tourTable;

    },

      //Create a TH of the Leader Board
    buildRankingTh: function (val) {

        var th = document.createElement("th");
        th.classList.add(this.fontClass);
        if (this.config.colored) th.classList.add("color-headings");
        th.innerHTML = val;
        return th;

    },


    buildRankingTD: function (val) {

        var td = document.createElement("td");
        td.classList.add(this.fontClass);
        //if (classlist.length >0) td.classList.add(...classlist);
        td.innerHTML = val;           
        return td;
    },

    getCurWeekText: function(player){

        var arrowText ="";

        if (player.curPosition == player.lwPosition){
            arrowText="<span>►</span>";
        } else if (parseInt(player.curPosition) < parseInt(player.lwPosition) || player.lwPosition==""){
            arrowText =(this.config.colored)?"<span class='up'>▲</span>":"<span>▲</span>";  
        } 
        else if (parseInt(player.curPosition) > parseInt(player.lwPosition)){
            arrowText =(this.config.colored)?"<span class='down'>▼</span>":"<span>▼</span>";
        } 

        return (arrowText + player.curPosition);
    },
    

    buildRankList: function(rankings){

        
        //Create the HTML table
        var rankTable = document.createElement("table");
        rankTable.classList.add("ranking-table");

        //Create Table headings
        var rankHead = document.createElement("tr");
        rankTable.appendChild(rankHead);
        rankHead.appendChild(this.buildRankingTh("This<br>Week"));
        rankHead.appendChild(this.buildRankingTh("Last<br>Week"));

        thPlayerName = this.buildRankingTh("Player Name");
        thPlayerName.classList.add("player-name");
        if (this.config.showFlags) thPlayerName.colSpan = 2;
        rankHead.appendChild(thPlayerName);

        heading = rankings.pointsHeading;
        heading = heading.replace(" ","<br>");
        rankHead.appendChild(this.buildRankingTh(heading));


        //Create Table Body

        var numplayers = (this.config.numRankings < this.config.maxNumRankings )?this.config.numRankings:this.config.maxNumRankings;
        
        for (i = 0; i < numplayers; i++) {
            

            var player = rankings.rankings[i];
            var rankRow = document.createElement("tr");
            rankTable.appendChild(rankRow);

            rankRow.appendChild(this.buildRankingTD(this.getCurWeekText(player)));
            rankRow.appendChild(this.buildRankingTD(player.lwPosition));

            if (this.config.showFlags){
                flagHtml = this.flaghtml.replace("http",player.flagUrl);
                flagtd = this.buildRankingTD(flagHtml);
                flagtd.classList.add("img");
                rankRow.appendChild(flagtd);
            }

            tdPlayerName = this.buildRankingTD(player.name);
            tdPlayerName.classList.add("player-name");
            rankRow.appendChild(tdPlayerName);
            rankRow.appendChild(this.buildRankingTD(player.points));
        }

    
        return rankTable;
    },



    buildHeader: function(showActive){

        var header = document.createElement("header");

        if (showActive){
            headerText = this.config.header;
        } else {
            if (this.nonActiveIndex == 0){
                headerText = this.upcomingTournamentHeader;
            } else {
                obj = Object.entries(this.rankingObjs)[this.nonActiveIndex-1][1];
                headerText = obj.headerTxt;
            }
        }
       
        header.innerHTML =  headerText;
        if (this.config.showLogo){
            header.innerHTML = this.pgalogohtml + header.innerHTML;
        }
        return header;
    },

    /* Main Magic Mirror module to build the Contect of the module*/

    getDom: function () {

        var self = this;

        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = this.config.maxWidth;

        // If Data is not Loaded yet display the Loading Caption
        if (!this.loaded || !this.tournamentsLoaded) {
            wrapper.innerHTML = "Loading . . .";
            wrapper.classList.add("bright", "light", "small");
            return wrapper;
        }

        var tourney = this.tournament;
        var tourneyScheduled = (tourney.statusCode == "STATUS_SCHEDULED");

        var showActive = (!tourneyScheduled && this.config.showBoards);

        // creating the header
        if (this.config.useHeader != false) {   
            wrapper.appendChild(this.buildHeader(showActive));
        }

        //If Tounament not in Progress Show the upcoming tournaments and rankings   
        if (!showActive){

            if (this.nonActiveIndex == 0){
                list = this.buildTournamentList(this.tournaments);
            } else {
                rankingObj = Object.entries(this.rankingObjs)[this.nonActiveIndex-1][1].rankingObj;
                list = this.buildRankList(rankingObj);
            }
            
            wrapper.appendChild(list);
            return wrapper;
        }    

        //Tounament is in progress and Module is confugred to show boards
        //So build the boards
        curTourneyList = [tourney];
        tdetails = this.buildTournamentList(curTourneyList,false);
        wrapper.appendChild(tdetails);

        if (this.config.showBoards) {
            var leaderboard = this.buildLeaderBoard(tourney);
            wrapper.appendChild(leaderboard);
        }

        return wrapper;

    }, 


    // this rotates your data
    scheduleCarousel: function () {
        Log.debug("[MMM-PGA] schedule carousel");
        this.rotateInterval = setInterval(() => {

            if (this.config.favorites.length == 0) {
                this.boardIndex = 0;
            } else {
                this.boardIndex = (this.boardIndex == this.numBoards - 1) ? 0 : this.boardIndex + 1;
            }

            numRankingObj = Object.keys(this.rankingObjs).length;
            this.nonActiveIndex = (this.nonActiveIndex == numRankingObj )?0 : this.nonActiveIndex+1;
    
            this.updateDom(this.config.animationSpeed);
        }, this.config.rotateInterval);
    },


    // Called by MM Framework when new data has been retrieved
    socketNotificationReceived: function (notification, payload) {
        
        if (notification === "PGA_RESULT") {
            this.tournament = payload;
            this.loaded=true;
            if (this.rotateInterval == null) {
                this.scheduleCarousel();
            }
            this.updateDom(this.config.animationSpeed);
        }

        else if (notification == "PGA_TOURNAMENT_LIST") {
            this.tournaments = payload;
            this.tournamentsLoaded = true;
            this.updateDom(this.config.animationSpeed);

        }  
        else if (notification =="OWGR_RANKING") {
            this.rankingObjs.owgr = {headerTxt: this.owgrHeader, rankingObj: payload};
            this.updateDom(this.config.animationSpeed);
        }
        else if (notification == "FEDEXCUP_RANKING"){
            this.rankingObjs.fedex = {headerTxt: this.fedexCupHeader, rankingObj: payload};
            this.updateDom(this.config.animationSpeed);
        }
        else if (notification =="UPDATE_FAVORITES") {
            Log.debug("[MMM-PGA] Update Favorites");
            this.updateFavorites();
        }
        else {
            this.updateDom(this.config.initialLoadDelay);
        }
   
    },
});