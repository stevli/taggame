const players = {};
//asdfasf
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
            width: 1000,
            height: 1000,
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
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('star', 'assets/star_gold.png');
  //this.physics.world.setBoundsCollision(true,true,true,true);
}

function create() {
  const self = this;
  this.players = this.physics.add.group();
  this.allowInputs = true;
  this.allowTransfer = true;
  
  this.physics.world.setBoundsCollision(true,true,true,true);

  this.scores = {
    blue: 0,
    red: 0
  };

  this.star = this.physics.add.image(randomPosition(1000), randomPosition(1000), 'star');
 
  this.physics.add.collider(this.players, this.players, function(player1, player2) {
	//console.log(players[player1.playerId].team);
	if (self.allowTransfer){
	//io.emit('inputchange');
	self.allowTransfer = false;
	if (players[player1.playerId].team != players[player2.playerId].team){
		self.allowInputs = false;
		//players[player1.playerId].y = randomPosition(1000);
		//players[player1.playerId].x = randomPosition(1000);
		//console.log(players[player1.playerId].x);
		io.emit('playerUpdates', players);
		var temp = players[player1.playerId].team;
		players[player1.playerId].team = players[player2.playerId].team;
		players[player2.playerId].team = temp;
		io.emit('currentPlayers', players);
	}
	//console.log(players[player1.playerId].x);
	//console.log(players[player1.playerId].team);
	}
  });
  
  this.physics.add.overlap(this.players, this.star, function (star, player) {
    
	players[player.playerId].team = 'red';
    self.star.setPosition(-500, -500);
	io.emit('currentPlayers', players);
    io.emit('updateScore', self.scores);
    io.emit('starLocation', { x: self.star.x, y: self.star.y });
  });

  io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      hp: 1,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: 'blue',
      input: {
        left: false,
        right: false,
        up: false,
		down: false,
		space: false
      }
    };
    /// add player to server
    addPlayer(self, players[socket.id]);
	for(var i=0;i<players.length;i++){
		players[i].body.setCollideWorldBounds(true);
		players[i].body.onWorldBounds = true;
	}
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);
    // send the star object to the new player
    socket.emit('starLocation', { x: self.star.x, y: self.star.y });
    // send the current scores
    socket.emit('updateScore', self.scores);

    socket.on('disconnect', function () {
      console.log('user disconnected');
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
  });
}

function update() {
	
  this.players.getChildren().forEach((player) => {
  const input = players[player.playerId].input;
  console.log(this.allowInputs);
  if (players[player.playerId].team == 'blue' && (this.allowInputs == true)){
    if (input.left) {
      player.setVelocityX(-200);
    } else if (input.right) {
      player.setVelocityX(200);
    } else {
      player.setVelocityX(0);
    }

    if (input.up) {
	  //this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration);
            player.setVelocityY(-200);
    } else if (input.down) {
			player.setVelocityY(200);
		
	} else {
      player.setVelocityY(0);
    }
	
	//if (input.space) {
		//player.
			
	//}
  }
  else if (players[player.playerId].team == 'blue' && (this.allowInputs == false)){
	player.setVelocityX(0);
	player.setVelocityY(0);
	
  }
  else if (players[player.playerId].team == 'red'){
	if (input.left) {
      player.setVelocityX(-250);
    } else if (input.right) {
      player.setVelocityX(250);
    } else {
      player.setVelocityX(0);
    }
	
	if (input.up) {
	  //this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration);
      player.setVelocityY(-250);
    } else if (input.down) {
	  player.setVelocityY(250);
	} else {
      player.setVelocityY(0);
    }
  }
  
	//if(player.x>=0||player.x<=1000)
		players[player.playerId].x = player.x;
	//if(player.y>=0||player.y<=1000)
		players[player.playerId].y = player.y;
    players[player.playerId].rotation = player.rotation;
	if(player.y<10){
		players[player.playerId].y=10;
		player.setVelocityY(10);
	}
	if(player.x<10){
		players[player.playerId].x=10;
		player.setVelocityX(10);
	}
	if(player.y>990){
		players[player.playerId].y=990;
		player.setVelocityY(-10);
	}
	if(player.x>990){
		players[player.playerId].x=990;
		player.setVelocityX(-10);
	}
  });
  //this.physics.world.wrap(this.players, 5);
  //this.physics.world.setBoundsCollision(true,true,true,true);
  /*this.physics.add.collider(this.players, this.players, function(player1, player2) {
	//console.log(players[player1.playerId].team);
	if (players[player1.playerId].team != players[player2.playerId].team){
		players[player1.playerId].y = randomPosition(1000);
		players[player1.playerId].x = randomPosition(1000);
		//console.log(players[player1.playerId].x);
		//io.emit('playerUpdates', players);
		var temp = players[player1.playerId].team;
		players[player1.playerId].team = players[player2.playerId].team;
		players[player2.playerId].team = temp;
		io.emit('currentPlayers', players);
	}
	//console.log(players[player1.playerId].x);
	//console.log(players[player1.playerId].team);
  });*/
  io.emit('playerUpdates', players);
}
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
  //player.setDrag(100);
  //player.setAngularDrag(100);
  //player.setMaxVelocity(200);
  player.setCollideWorldBounds(true);
  player.onWorldBounds = true;
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
		//console.log('func worked but didnt');
		//console.log(players[player.playerId].team);
		if (players[player.playerId].team === 'red'){
			self.star.setPosition(players[player.playerId].x, players[player.playerId].y);
			self.allowInputs = true;
			console.log(this.allowInputs);
			io.emit('starLocation', { x: self.star.x, y: self.star.y });
		}
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.gameLoaded();
