var run=false;
var specialKey = "Enter";

document.addEventListener("keypress", event =>{
  if(event.key == specialKey){
    document.getElementById('start').style.display = 'none';
    document.getElementById('enter').innerText = 'Press Esc again to keep playing';
    pause=false;
    specialKey = "Bla";
    if(!run){run=true; runGame(GAME_LEVELS,DOMDisplay);}
    playSound("coin.mp3", true);
    playSound("win.mp3", true);
    playSound("lose.mp3", true);
  }
});
