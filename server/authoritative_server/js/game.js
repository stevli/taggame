var mapSize = 3000;

//SERVER


const players = {};

const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
	  setBounds: {
            x: 0,
            y: 0,
            width: mapSize,
            height: mapSize
      }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};

function preload() {
  this.load.image('ship', 'assets/dude2.png');
  this.load.image('star', 'assets/banana.png');
}

function create() {
  const self = this;
  this.players = this.physics.add.group();
  this.allowInputs = true;
  this.allowTransfer = true;
  this.timeSinceStart = 0;
  this.timeSinceTransfer = 0;
  this.physics.world.setBoundsCollision(true,true,true,true);
  this.star = this.physics.add.image(randomPosition(mapSize), randomPosition(mapSize), 'star');



  ///half second timer
  this.time.addEvent({
	  delay: 500,
	  callback: () => {
		  this.timeSinceStart++;
		  this.timeSinceTransfer++;
		  self.players.getChildren().forEach((player) => {
				if (players[player.playerId].team == 'red') {
					players[player.playerId].score += 1;
				}
		    players[player.playerId].timeSinceSpecial += 1;
		  });
	  },
      loop: true
  });
	  

  this.scores = {
    first: 0,
    second: 0,
	third: 0,
  };
  
  
  
  ///five second timer
  this.time.addEvent({
	  delay: 1000,
	  callback: () => {
		  var scoreArray = [];
		  self.players.getChildren().forEach((player) => {
				scoreArray[scoreArray.length] = players[player.playerId];
		  });
		  scoreArray.sort(function(a, b){return a.score - b.score});
          this.scores.first = scoreArray[scoreArray.length - 1];
          this.scores.second = scoreArray[scoreArray.length - 2];
          this.scores.third = scoreArray[scoreArray.length - 3];
          io.emit('updateScore', this.scores);
	  },
      loop: true
  });
  
 
 
  ///player collision event
  this.physics.add.collider(this.players, this.players, function(player1, player2) {

	if (self.allowTransfer){
	if (players[player1.playerId].team != players[player2.playerId].team){
		
		self.timeSinceTransfer = 0;
		self.allowTransfer = false;
		self.allowInputs = false;
		
		
		var temp = players[player1.playerId].team;
		players[player1.playerId].team = players[player2.playerId].team;
		players[player2.playerId].team = temp;
		
		players[player1.playerId].timeSinceSpecial = 0;
		players[player2.playerId].timeSinceSpecial = 0;
		
		
		io.emit('playerUpdates', players);
		io.emit('changeCurrentPlayers', players);
	}
	}
  });
  
  ///banana collision event
  this.physics.add.overlap(this.players, this.star, function (star, player) {
    
	players[player.playerId].team = 'red';
    self.star.setPosition(-1000, -1000);
	io.emit('changeCurrentPlayers', players);
    io.emit('updateScore', self.scores);
    io.emit('starLocation', { x: self.star.x, y: self.star.y });
  });
  
  
	///when a player connects:
    io.on('connection', function (socket) {
    console.log('a user connected');
	
	
    // create a new player and add it to players object
    players[socket.id] = {
      score: 0,
      x: Math.floor(Math.random() * (mapSize - 100)) + 50,
      y: Math.floor(Math.random() * (mapSize - 100)) + 50,
      playerId: socket.id,
      team: 'blue',
      input: {
        left: false,
        right: false,
        up: false,
		down: false,
		space: false
      },
	  timeSinceSpecial: 0,
	  isFrozen: false
    };

	
    //add player to server
    addPlayer(self, players[socket.id]);
	
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
    socket.emit('starLocation', { x: self.star.x, y: self.star.y });
    socket.emit('updateScore', self.scores);


    // disconnect from sever
    socket.on('disconnect', function () {
      console.log('user disconnected');
      removePlayer(self, socket.id);
      delete players[socket.id];
      io.emit('disconnect', socket.id);
    });



    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
  });
}

function update() {
	
  ///handle player input
  this.players.getChildren().forEach((player) => {

  
//blue team input
  const input = players[player.playerId].input; 
  if (players[player.playerId].team == 'blue' && (this.allowInputs == true && !players[player.playerId].isFrozen)) {
    if (input.left) {
            player.setVelocityX(-200);
    }
	if (input.right) {
            player.setVelocityX(200);
    }
	if (!input.right&&!input.left){
            player.setVelocityX(0);
    }

    if (input.up) {
            player.setVelocityY(-200);
    }
	if (input.down) {
			player.setVelocityY(200);	
	}
	if (!input.up&&!input.down){
            player.setVelocityY(0);
    }
	
	if (input.space) {
			if (players[player.playerId].timeSinceSpecial  >= 6){
				
					player.setVelocityY(player.body.velocity.y*5);
					player.setVelocityX(player.body.velocity.x*5);
					players[player.playerId].timeSinceSpecial -= 1;
				
			}
		}	
	
	} else if (players[player.playerId].team == 'blue' && (this.allowInputs == false || players[player.playerId].isFrozen)) {
		    players[player.playerId].isFrozen = true;
	        player.setVelocityX(0);
	        player.setVelocityY(0);
	

//red team input
  } else if (players[player.playerId].team == 'red'){
	if (input.left) {
			player.setVelocityX(-350);
    } else if (input.right) {
			player.setVelocityX(350);
    } else {
			player.setVelocityX(0);
    }
	
	if (input.up) {
			player.setVelocityY(-350);
    } else if (input.down) {
			player.setVelocityY(350);
	} else {
			player.setVelocityY(0);
    }
	
	if (input.space){
		if (players[player.playerId].timeSinceSpecial >= 20) {
			
			players[player.playerId].timeSinceSpecial = 0;
			
			this.players.getChildren().forEach((playerz) => {
				if(  Math.abs(player.x - playerz.x) <= 400 && Math.abs(player.y - playerz.y) <= 300){
					players[playerz.playerId].isFrozen = true;	
					this.timeSinceTransfer = 0;
					io.emit('changeCurrentPlayers', players);
					
				}
			});
		}
	}
  }
  
  
  if (this.allowInputs == false){
	  players[player.playerId].isFrozen = true;
	  io.emit('changeCurrentPlayers', players);
  }
 
//  transfer and movement cooldown  
  if (this.timeSinceTransfer == 4) {
	  players[player.playerId].isFrozen = false;
	  this.allowTransfer = true;
	  this.allowInputs = true;
	  io.emit('changeCurrentPlayers', players);
  }
  
  if (players[player.playerId].timeSinceSpecial > 50){
	  players[player.playerId].timeSinceSpecial = 50;
  }
	 	  
  
  
	//set our changes
	players[player.playerId].x = player.x;
	players[player.playerId].y = player.y;
	
	
	//world boundaries
	if(player.y<10){
		players[player.playerId].y=10;
		player.setVelocityY(10);
	}
	if(player.x<10){
		players[player.playerId].x=10;
		player.setVelocityX(10);
	}
	if(player.y > (mapSize - 10)){
		players[player.playerId].y = mapSize - 10;
		player.setVelocityY(-10);
	}
	if(player.x > (mapSize - 10)){
		players[player.playerId].x = mapSize - 10;
		player.setVelocityX(-10);
	}
	
  });
  
  io.emit('playerUpdates', players);
}



///other functions      
function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}



function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
    }
  });
}



function addPlayer(self, playerInfo) {
  const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  player.setCollideWorldBounds(true);
  player.onWorldBounds = true;
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}



function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
		
		if (players[player.playerId].team === 'red'){
			self.star.setPosition(players[player.playerId].x, players[player.playerId].y);
			self.allowInputs = true;
			io.emit('starLocation', { x: self.star.x, y: self.star.y });
		}
      player.destroy();
    }
  });
}



const game = new Phaser.Game(config);
window.gameLoaded();
