if(window.innerWidth<800){
	alert("Sorry, the game is only supported for PCs and laptops :(");
}

function playSound(file, silent){
  var cAudio = new Audio("https://fathycoins.000webhostapp.com/music/" + file);
  if(silent) cAudio.muted = true;
  cAudio.play();
}

class Clock{
	constructor(display){
		this.display = display;
		this.btn = null;
	}
	start(){
		this.btn = setInterval(()=>{
			this.display.innerText = +(this.display.innerText) + 1;
		},1000);
	}
	stop(){
		clearInterval(this.btn);
	}
}


//Controllers
var playerXSpeed = 10;
var gravity = 30;
var jumpSpeed = 18;
var wobbleSpeed = 10;
var wobbleDist = 0.1;
var scale = 20;

var time = document.getElementById('time');
var score = document.getElementById('score');
var coinsLeft = document.getElementById('coinsLeft');



class Level{
	constructor(plan){
		this.rows = plan.trim().split("\n").map(c => [...c]);
		this.height = this.rows.length;
		this.width = this.rows[0].length;
		this.startActors = [];

		this.rows = this.rows.map((row,y)=>{
			return row.map((ch,x)=>{
				let type = levelChars[ch];
				if(typeof type == "string"){return type;}
				this.startActors.push(type.create(new Vec(x,y),ch));
				return "empty";
			});
		});
	}
}


class Vec{
	constructor(x,y){
		this.x = x;
		this.y = y;
	}
	plus(other){
		return new Vec(this.x + other.x, this.y + other.y);
	}
	times(factor){
		return new Vec(this.x * factor, this.y * factor);
	}
}


class State{
	constructor(level,actors,status){
		this.level = level;
		this.actors = actors;
		this.status = status;
	}
	get player(){return this.actors.find(a=>a.type == "player");}
	static start(level){return new State(level,level.startActors,"playing");}
}



class Player{
	constructor(pos,speed){
		this.pos = pos;
		this.speed = speed;
	}
	get type(){return "player";}
	static create(pos){return new Player(pos.plus(new Vec(0,-4)),new Vec(0,0));}
}
Player.prototype.size = new Vec(0.8,1.5);


class Lava{
	constructor(pos, speed, reset){
		this.pos = pos;
		this.speed = speed;
		this.reset = reset;
	}
	get type(){return "lava";}
	static create(pos ,ch){
		if(ch == "="){return new Lava(pos,new Vec(2,0));}
		if(ch == "|"){return new Lava(pos, new Vec(0,2));}
		if(ch == "v"){return new Lava(pos, new Vec(0,3),pos);}
	}
}
Lava.prototype.size = new Vec(1,1);


class Coin{
	constructor(pos,basePos,wobble){
		this.pos = pos;
		this.basePos = basePos;
		this.wobble = wobble;
	}
	get type(){return "coin";}
	static create(pos){
		let basePos = pos.plus(new Vec(0.2,0.1));
		return new Coin(basePos, basePos, Math.random()*Math.PI*2);
	}
}
Coin.prototype.size = new Vec(0.6,0.6);


class Monster{
	constructor(pos,speed,direction){
		this.pos = pos;
		this.speed = speed;
		this.right=direction;
		if(direction==undefined || direction==null){this.right = true;}
	}
	get type(){return "monster";}
	static create(pos){
		return new Monster(pos,new Vec(2+(Math.floor(Math.random()*3)),0));
	}
}
Monster.prototype.size = new Vec(1,1);


const levelChars = {
	"." : "empty",
	"#" : "wall",
	"+" : "lava",
	"@" : Player,
	"o" : Coin,
	"=" : Lava,
	"|" : Lava,
	"v" : Lava,
	"M" : Monster
};

//Helper function .. creates HTML elemets
function elt(name, attrs, ...children) {
  let dom = document.createElement(name);
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  for (let child of children) {
    dom.appendChild(child);
  }
  return dom;
}


class DOMDisplay {
  constructor(parent, level) {
    this.dom = elt("div", {class: "game"}, drawGrid(level));
    this.actorLayer = null;
    parent.appendChild(this.dom);
  }
  clear() { this.dom.remove(); }
}


function drawGrid(level) {
  return elt("table", {
    class: "background",
    style: `width: ${level.width * scale}px`
  }, ...level.rows.map(row =>
    elt("tr", {style: `height: ${scale}px`},
        ...row.map(type => elt("td", {class: type})))
  ));
}


function drawActors(actors) {
  return elt("div", {}, ...actors.map(actor => {
    let rect = elt("div", {class: `actor ${actor.type}`});
    rect.style.width = `${actor.size.x * scale}px`;
    rect.style.height = `${actor.size.y * scale}px`;
    rect.style.left = `${actor.pos.x * scale}px`;
    rect.style.top = `${actor.pos.y * scale}px`;
		if(actor.type == "monster"){
			if(actor.right){rect.style.backgroundImage = "url('imgs/monsterRight.png')";}
			else{rect.style.backgroundImage = "url('imgs/monsterLeft.png')";}
		}
    return rect;
  }));
}

DOMDisplay.prototype.syncState = function(state) {
	if(state.status == "pause"){return;}
  if (this.actorLayer) this.actorLayer.remove();
  this.actorLayer = drawActors(state.actors);
  this.dom.appendChild(this.actorLayer);
  this.dom.className = `game ${state.status}`;
  this.scrollPlayerIntoView(state);
};


DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
  let width = this.dom.clientWidth;
  let height = this.dom.clientHeight;
  let margin = width / 3;

  // The viewport
  let left = this.dom.scrollLeft, right = left + width;
  let top = this.dom.scrollTop, bottom = top + height;

  let player = state.player;
  let center = player.pos.plus(player.size.times(0.5))
                         .times(scale);

  if (center.x < left + margin) {
    this.dom.scrollLeft = center.x - margin;
  } else if (center.x > right - margin) {
    this.dom.scrollLeft = center.x + margin - width;
  }
  if (center.y < top + margin) {
    this.dom.scrollTop = center.y - margin;
  } else if (center.y > bottom - margin) {
    this.dom.scrollTop = center.y + margin - height;
  }
};


Level.prototype.touches = function(pos, size, type) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      let isOutside = x < 0 || x >= this.width ||
                      y < 0 || y >= this.height;
      let here = isOutside ? "wall" : this.rows[y][x];
      if (here == type) return true;
    }
  }
  return false;
};


State.prototype.update = function(time, keys) {
  let actors = this.actors
    .map(actor => actor.update(time, this, keys));
  let newState = new State(this.level, actors, this.status);

  if (newState.status != "playing") return newState;

  let player = newState.player;
  if (this.level.touches(player.pos, player.size, "lava")) {
		playSound("lose.mp3");
		score.innerText = Math.max( +(score.innerText) - 15 , 0);
    return new State(this.level, actors, "lost");
  }
	if (this.level.touches(player.pos, player.size, "monster")) {
		playSound("lose.mp3");
    return new State(this.level, actors, "lost");
  }

  for (let actor of actors) {
    if (actor != player && overlap(actor, player)) {
      newState = actor.collide(newState);
    }
  }
  return newState;
};


function overlap(actor1, actor2) {
  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}


Lava.prototype.collide = function(state) {
	playSound("lose.mp3");
	score.innerText = Math.max( +(score.innerText) - 15 , 0);
  return new State(state.level, state.actors, "lost");
};


Monster.prototype.collide = function(state) {
	if(state.player.pos.y + state.player.size.y < this.pos.y + 0.3){
		playSound("coin.mp3");
		score.innerText = +(score.innerText) + 5;
		let filtered = state.actors.filter(a => a != this);
		return new State(state.level, filtered, state.status )
	}
	playSound("lose.mp3");
	score.innerText = Math.max( +(score.innerText) - 15 , 0);
  return new State(state.level, state.actors, "lost");
};


Coin.prototype.collide = function(state) {
	playSound("coin.mp3");
	score.innerText = +(score.innerText) + 1;
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
	coinsLeft.innerText = filtered.filter(a => a.type == "coin").length;
  if (!filtered.some(a => a.type == "coin")) {
		status = "won";
		playSound("win.mp3");
		score.innerText = +(score.innerText) + 10;
	}
  return new State(state.level, filtered, status);
};


Lava.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, "wall")) {
    return new Lava(newPos, this.speed, this.reset);
  } else if (this.reset) {
    return new Lava(this.reset, this.speed, this.reset);
  } else {
    return new Lava(this.pos, this.speed.times(-1));
  }
};


Monster.prototype.update = function(time,state) {
	let newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, "wall")) {
    return new Monster(newPos, this.speed, this.right);
  } else {
    return new Monster(this.pos, this.speed.times(-1), !this.right);
  }
};


Coin.prototype.update = function(time) {
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                  this.basePos, wobble);
};


Player.prototype.update = function(time, state, keys) {
  let xSpeed = 0;
  if (keys.ArrowLeft) xSpeed -= playerXSpeed;
  if (keys.ArrowRight) xSpeed += playerXSpeed;
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!state.level.touches(movedX, this.size, "wall")) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall")) {
    pos = movedY;
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } else {
    ySpeed = 0;
  }
  return new Player(pos, new Vec(xSpeed, ySpeed));
};

function trackKeys(keys) {
  let down = Object.create(null);
  function track(event) {
    if (keys.includes(event.key)) {
      down[event.key] = event.type == "keydown";
      event.preventDefault();
    }
  }
  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);
	down.unregister = () => {
      window.removeEventListener("keydown", track);
      window.removeEventListener("keyup", track);
  };
  return down;
}

const arrowKeys =
  trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);


function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    if (lastTime != null) {
      let timeStep = Math.min(time - lastTime, 100) / 1000;
      if (frameFunc(timeStep) === false) return;
    }
    lastTime = time;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function runLevel(level, Display, clock) {
  let display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 0.6;
	let running = "yes";
	coinsLeft.innerText = level.startActors.filter(a => a.type == "coin").length;
  return new Promise(resolve => {

		function escHandler(event,display) {
        if (event.key != "Escape") return;
        event.preventDefault();
        if (running == "no") {
          running = "yes";
					document.getElementById('start').style.display = 'none';
					clock.start();
          runAnimation(frame);
        } else if (running == "yes") {
          running = "pausing";
					let banner = document.getElementById('start');
					document.body.appendChild(banner);
					banner.style.display = 'block';
					clock.stop();
        } else {
          running = "yes";
        }
      }
      window.addEventListener("keydown", escHandler);

			function frame(time) {
        if (running == "pausing") {
          running = "no";
          return false;
        }

				state = state.update(time, arrowKeys);
	      display.syncState(state);
	      if (state.status == "playing") {
	        return true;
	      } else if (ending > 0) {
					playerXSpeed = 0;
					jumpSpeed = 0;
	        ending -= time;
	        return true;
	      } else {
					playerXSpeed = 10;
					jumpSpeed = 18;
	        display.clear();
	        resolve(state.status);
	        return false;
        }
      }
			runAnimation(frame);
	});
}

async function runGame(plans, Display) {
	var clock = new Clock(time);
	clock.start();
  for (let level = 0; level < plans.length;) {
    let status = await runLevel(new Level(plans[level]),
                                Display, clock);
    if (status == "won") level++;
  }
	clock.stop();
	document.getElementById('scoreBoard').innerText = "Your total score : " + Math.floor(+(score.innerText) * +1000/(time.innerText));
	document.getElementById('scoreBoard').style.maxWidth = "600px";
  document.getElementById('end').style.display = "block";
}
