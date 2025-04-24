const Log = require('logger')
const flags = require('./flags.js');

module.exports = {

    url: "http://www.owgr.com/ranking/",
    rapidUrl: 'https://golf-leaderboard-data.p.rapidapi.com/world-rankings',

    async getOWGRData(maxPlayers, rapidAPIKey, callback) {

          var rapidKey = rapidAPIKey;
          const response = await fetch(this.rapidUrl, {
              method: 'GET',
              headers: {
                  'X-RapidAPI-Key': rapidKey,
                  'X-RapidAPI-Host': 'golf-leaderboard-data.p.rapidapi.com'
              }
          })

              const data = await response.json();

          var owgrRanking = {
              pointsHeading: "Average Points",
              rankings: []
          };
          var payload = data;
          try {
            if (payload.results.rankings.length > 1) {
              for (var i = 0; i < payload.results.rankings.length; i++) {
                  flagName = payload.results.rankings[i].player_name.replace(/\s/g, '');
                  owgrRanking.rankings.push({
                      "name": payload.results.rankings[i].player_name,
                      "curPosition": payload.results.rankings[i].position,
                      "lwPosition": "1",
                      "points": payload.results.rankings[i].total_points,
                      "flagUrl": flags.getFlagURL(flagName)
                  });
                  if (i == maxPlayers)
                      break;
              }
            } 
          } catch (error) {
            Log.error("Unable to display OWGR rankings: " + payload.message);
            Log.error("URL fetch response: " + response.statusText);
          }
      callback(owgrRanking);

    }

}
