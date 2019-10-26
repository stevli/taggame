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
                width: 1000,
                height: 1000,
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

function preload() {
  this.load.image('background', 'assets/grd.png');
  this.load.image('ship', 'assets/dude2.png');
  this.load.image('otherPlayer', 'assets/dude3.png');
  this.load.image('star', 'assets/star_gold.png');
}

function create() {
  var self = this;
  //this.allowInput = true;
  this.add.image(750,750,'background');
  this.socket = io();
  this.players = this.add.group();
  this.cam=this.cameras.main.setBounds(0,0,1000,1000).setName('main');
  this.minimap = this.cameras.add(00, 00, 150, 150).setZoom(0.15).setName('mini');
  this.cursorsa = this.input.keyboard.createCursorKeys();
  this.a=0;
	
	var t = this.add.text(600, 15, "Leaderboard:", { font: "32px Arial", fill: "#ffffff", align: "center" });
    t.fixedToCamera = true;
    t.setScrollFactor(0);
  //this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  //this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].team === 'red') {
        displayPlayers(self, players[id], 'otherPlayer');
		
      } else {
        displayPlayers(self, players[id], 'ship');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'ship');
  });

  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });
  /*this.socket.on('inputchange', function () {
	  self.allowInput = (!self.allowInput);
	  console.log(self.allowInput);
  });*/
  this.socket.on('playerUpdates', function (players) {
    
	Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
        }
		if (players[id].playerId === self.socket.id) {
		  if (self.cursorsa.space.isDown) {
			console.log(players[id].x);
		  }
			self.cam.startFollow(players[self.socket.id]);
			self.minimap.startFollow(players[self.socket.id]);
		}
      });
    });
  });

  this.socket.on('updateScore', function (scores) {
    //self.blueScoreText.setText('Blue: ' + scores.blue);
    //self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('starLocation', function (starLocation) {
	console.log('star spawned');
	//if(starLocation.x!=-100&&starLocation.y!=-100){
		if (!self.star) {
		  self.star = self.add.image(starLocation.x, starLocation.y, 'star');
		} else {
		  self.star.setPosition(starLocation.x, starLocation.y);
		}
	//}else{
		//if(self.star)
			//self.star.destory();
	//}
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
  this.spaceKeyPressed = false;
  //lol
  //this.cam.startFollow(this.players[self.socket.id]);
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
  //this.cam.startFollow(this.players[self.socket.id]);
  //this.cam.main.scrollX = this.players[this.socket.id].x;
  //this.cameras.main.scrollY = this.players[id].y;
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  //if (playerInfo.team === 'blue') player.setTint(0x0000ff);
  //else player.setTint(0xff0000);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
  //self.cam.startFollow(player);
}
