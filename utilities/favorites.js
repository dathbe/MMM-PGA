async function readTextFile(file, callback) {
  const response = await fetch(file)
  const jsonResponse = await response.json()
  console.log(jsonResponse)
  console.log(typeof jsonResponse)
  callback(jsonResponse)
}

function displayFavs() {
  for (var i = 0; i < this.boards.length; i++) {
    var board = this.boards[i]
    var div = document.createElement('div')
    div.innerHTML = board.headerName
    document.body.appendChild(div)

    for (let j = 0; j < board.favoriteList.length; j++) {
      var fav = board.favoriteList[j]
      var playerdiv = document.createElement('div')
      playerdiv.innerHTML = fav
      div.appendChild(playerdiv)

      var btn = document.createElement('button')
      btn.innerHTML = 'button'

      div.appendChild(btn)
    }
  }
}

var self = window
readTextFile('favorites.json', function (text) {
  self.boards = text
  displayFavs()
  self.boards.pop()
  displayFavs()
})

let d = new Date()
document.body.innerHTML = '<h1>Today\'s date is ' + d + '</h1>'
