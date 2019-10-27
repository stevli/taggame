var mapSize = 3000;
//CLIENT
var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
        default: 'arcade',
        arcade: {
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
  }
};

var game = new Phaser.Game(config);


//load assets
function preload() {
  this.load.image('background', 'assets/grd.png');
  this.load.image('dude', 'assets/dude2.png');
  this.load.image('bananaMan', 'assets/dude3.png');
  this.load.image('star', 'assets/banana.png');
}



function create() {
  var self = this;
  this.add.image((mapSize / 2),(mapSize / 2),'background');
  this.socket = io();
  this.players = this.add.group();
  this.cam=this.cameras.main.setBounds(0, 0, mapSize, mapSize).setName('main');
  this.minimap = this.cameras.add(00, 00, 150, 150).setZoom(0.15).setName('mini');
  this.cursorsa = this.input.keyboard.createCursorKeys();
  //this.a=0;
	
  this.t = this.add.text(600, 15, "Leaderboard:\n" + "0\n" + "0\n" + "0\n", { font: "32px Arial", fill: "#ffffff", align: "center" });
  this.t.fixedToCamera = true;
  this.t.setScrollFactor(0);
  
  
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].team === 'red') {
        displayPlayers(self, players[id], 'bananaMan');
		
      } else {
        displayPlayers(self, players[id], 'dude');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'dude');
  });

  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });
  this.socket.on('playerUpdates', function (players) {
    
	Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
        }
		if (players[id].playerId === self.socket.id) {
		  //if (self.cursorsa.space.isDown) {
		  //}
			self.cam.startFollow(players[self.socket.id]);
			self.minimap.startFollow(players[self.socket.id]);
		}
      });
    });
  });

  this.socket.on('updateScore', function (scores) {
    self.t.setText("Leaderboard:\n" + scores.first + "\n" + scores.second + "\n" + scores.third);
  });

  this.socket.on('starLocation', function (starLocation) {
		if (!self.star) {
		  self.star = self.add.image(starLocation.x, starLocation.y, 'star');
		} else {
		  self.star.setPosition(starLocation.x, starLocation.y);
		}
	
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
  this.spaceKeyPressed = false;
}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  const down = this.downKeyPressed;
  const space = this.spaceKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }

  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else if (this.cursors.down.isDown) {
    this.downKeyPressed = true;
  } else {
    this.upKeyPressed = false;
    this.downKeyPressed = false;
  }
  
  if (this.cursors.space.isDown) {
	  this.spaceKeyPressed = true;
  }else{
	  this.spaceKeyPressed = false;
  }
  

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down !== this.downKeyPressed || space !== this.spaceKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed , space: this.spaceKeyPressed });
  }

}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
