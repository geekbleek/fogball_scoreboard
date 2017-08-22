var _ = require('lodash');
//var r = require('rethinkdb');

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://192.168.195.7')

var request = require("request");
var five = require("johnny-five");
var Raspi = require("raspi-io");
var board = new 
five.Board({
  io: new Raspi(),
  repl: false
});

var relays = []
var bell = []
var gameOn = false

var team1Score = 0
var team2Score = 0

client.on('connect', function () {
  client.subscribe('#')
  //client.publish('presence', 'Hello mqtt')
})

board.on("ready", function() {
  relays[1] = new five.Relay({
    pin: "P1-7",
    type: "NC"}
  );

  relays[2] = new five.Relay({
    pin: "P1-11",
    type: "NC"}
  );

  relays[3] = new five.Relay({
    pin: "P1-13",
    type: "NC"}
  );

  relays[4] = new five.Relay({
    pin: "P1-15",
    type: "NC"}
  );

  relays[5] = new five.Relay({
    pin: "P1-29",
    type: "NC"}
  );

  relays[6] = new five.Relay({
    pin: "P1-31",
    type: "NC"}
  );

  relays[7] = new five.Relay({
    pin: "P1-33",
    type: "NC"}
  );

  relays[8] = new five.Relay({
    pin: "P1-35",
    type: "NC"}
  );

  relays[9] = new five.Relay({
    pin: "P1-37",
    type: "NC"}
  );

  relays[10] = new five.Relay({
    pin: "P1-40",
    type: "NC"}
  );

  relays[11] = new five.Relay({
    pin: "P1-38",
    type: "NC"}
  );


  for(var i = 1; i < relays.length; i++) {
    relays[i].off();
  }

  bell[0] = null //keep array 1 based
  bell.push(relays[11])

  // //relay.on()
  // console.log('relay on')
  // setTimeout(function(){
  //   relay.off();
  //   console.log('relay off');
  // },200)

  // this.repl.inject({
  //   relays: relays
  // });
  // setTimeout(function(){
  //   //setScore(4,4)
  //   setWinner(0,5)
  // },2000)

  

  //setWinner(5,0)

});


r.connect({
    host: '192.168.73.22',
    port: 28015,
    db: 'foosball'
}, function(err, conn) {
    if (!err) {
        console.log('connected!');
        streamChanges(conn);
    }
    else {
        console.log(err);
    }
});


client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString())
  processMQTT(JSON.parse(message))
  client.end()
})


function processMQTT(message) {

  if (message.Player == 1) {
    team1Score++
  }
  else if (message.Player == 2) {
    team2Score++
  }  

  if (team1Score < 5 && team2Score < 5) {
      setScore(team1Score, team2Score);
  }
  else if (team1Score == 5 && team2Score < 5  || team2Score == 5 && team1Score < 5) {
      setWinner(team1Score, team2Score)
  }
  else if (team1Score > 5 || team2Score > 5) {
      console.log('Ignoring large score - game over')
      gameOn = false
      resetGame();
  }
      

}

function streamChanges(conn) {
    r.table('games').filter(
      r.row('active').eq(true)
      ).changes().run(conn, function(err, cursor) {
        cursor.each(function(err, row){
            if(!err){ 
                //console.dir(row)
                //processScore(row);
                processDB(row);

            }
            else (console.log(err))
        })
    });
}




// function processScore(update) {
//     if (update.new_val && update.new_val.active && update.new_val.active == true) {
//         console.log('Player 1 score: '+update.new_val.player1.score)
//         console.log('Player 2 score: '+update.new_val.player2.score)

//         if (update.new_val.player1.score == 0 && update.new_val.player2.score == 0) {
//             resetScore();
//         }
//         else if (update.new_val.player1.score < 5 && update.new_val.player2.score < 5) {
//             setScore(update.new_val.player1.score, update.new_val.player2.score);
//         }
//         else if (update.new_val.player1.score == 5 && update.new_val.player2.score < 5  || update.new_val.player2.score == 5 && update.new_val.player1.score < 5) {
//             setWinner(update.new_val.player1.score, update.new_val.player2.score)
//         }
//         else if (update.new_val.player1.score > 5 || update.new_val.player2.score > 5) {
//             console.log('Ignoring large score - game over')
//             gameOn = false
//             resetGame();
//         }
        
//     }
// }


function processDB(update) {
    if (update.new_val && update.new_val.active && update.new_val.active == true) {
        console.log('Player 1 score from DB: '+update.new_val.player1.score)
        console.log('Player 2 score from DB: '+update.new_val.player2.score)

        if (update.new_val.player1.score == 0 && update.new_val.player2.score == 0) {
            resetScore();
        }
        
    }
}

function resetScore() {
    team1Score = 0
    team2Score = 0
    for(var i = 1; i < relays.length; i++) {
        relays[i].off();
    }
    gameOn = true
}

function setScore (team1, team2) {
    resetScore();
    flashOn(bell)

    for(var i = 1; i <= team1; i++) {
        relays[i].on();
    }

    for(var i = 6; i <= team2 + 5; i++) {
        relays[i].on();
    }
}

function setWinner (team1, team2) {
    if (gameOn = true) {

      callDX();

      gameOn = false
      console.log('setting winner');
      //var times = 10;

      if (team1 == 5) {
          winners = _.dropRight(relays, 6);
      }
      else {
          winners = _.drop(relays,5);
      }

      winners.push(relays[11])

      console.log('winners.length is '+winners.length)
      

      flashOnTimer = setInterval(function(){
        flashOn(winners)
      },250)


      setTimeout(function(){
          clearInterval(flashOnTimer);
          //resetScore();
          setTimeout(function(){
            resetGame();
          },2000)
          // clearInterval(flashOffTimer);
      },5000)
    }


}

function callDX() {
  var options = { method: 'POST',
  url: 'http://10.10.20.10:8181/AutomationFX/api/cti/calls/SEP881DFC60ED16/5555?apikey=endpoint12345' };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log('Called DX');
  });
}

function resetGame(){
  var options = { method: 'POST',
  url: 'http://192.168.73.100:5000/api/foosball/default' };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log('Reset Game');
  });

}


function flashOn(winners){
    //console.log('Flashing lights or bell')
    for(var i = 1; i < winners.length ; i++) {
      winners[i].on();
      turnOff(winners[i]);
    }
}

function turnOff(winner){
  setTimeout(function(){
    winner.off();
  },125)
}




