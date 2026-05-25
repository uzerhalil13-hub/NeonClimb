// infinite-logic.js - Sonsuz Mod Saf Fizik ve Hesaplama Beyni

class InfiniteObstacle {
    constructor(relativeY) {
        this.relativeY = relativeY;
        this.width = 30;
        this.height = 20;
        
        let chosenSide = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
        if (chosenSide === 'LEFT') {
            if (consecutiveLeftCount >= 3) { chosenSide = 'RIGHT'; consecutiveLeftCount = 0; consecutiveRightCount = 1; }
            else { consecutiveLeftCount++; consecutiveRightCount = 0; }
        } else {
            if (consecutiveRightCount >= 3) { chosenSide = 'LEFT'; consecutiveRightCount = 0; consecutiveLeftCount = 1; }
            else { consecutiveRightCount++; consecutiveLeftCount = 0; }
        }
        this.side = chosenSide;
    }
    getRealY() { return this.relativeY + worldOffset; }
}

function startInfiniteGame(diff) {
    initAudio();
    selectedDifficulty = diff;
    gameMode = 'INFINITE';
    gameState = 'PLAYING';
    
    score = 0; 
    matchCoins = 0; 
    worldOffset = 0;
    consecutiveLeftCount = 0; 
    consecutiveRightCount = 0;
    obstacles = []; 
    nextObstacleY = -200; 
    
    if (typeof DIFFICULTY_SETTINGS !== 'undefined' && DIFFICULTY_SETTINGS[selectedDifficulty]) {
        gameSpeed = DIFFICULTY_SETTINGS[selectedDifficulty].startSpeed; 
    } else {
        gameSpeed = 4.5; 
    }
    
    if (player && typeof player.init === 'function') {
        player.init(); 
    }
    
    updateHUD();
    
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('difficultyMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    
    if (!loopStarted) {
        loopStarted = true;
        if (typeof infiniteGameLoop === 'function') infiniteGameLoop();
    }
}

function updateInfiniteLogic() {
    if (gameState !== 'PLAYING' || gameMode !== 'INFINITE') return;

    let diffSetting = (typeof DIFFICULTY_SETTINGS !== 'undefined') ? DIFFICULTY_SETTINGS[selectedDifficulty] : { startSpeed: 4.5, acceleration: 0.0005, minGap: 160, maxGap: 280 };
    
    worldOffset += gameSpeed;
    gameSpeed += diffSetting.acceleration || 0.0005; 
    
    score = Math.floor(worldOffset / 160);
    matchCoins = Math.floor(score / 5); 
    updateHUD();

    let cHeight = (canvas && canvas.height) ? canvas.height : 800;

    while (nextObstacleY > -worldOffset - cHeight) {
        obstacles.push(new InfiniteObstacle(nextObstacleY));
        let gap = Math.random() * (diffSetting.maxGap - diffSetting.minGap) + diffSetting.minGap;
        nextObstacleY -= gap; 
    }

    if (player && typeof player.update === 'function') {
        player.update(); 
    }
    
    let px = player.x - player.size / 2; 
    let py = player.y - player.size / 2;
    let pw = player.size; 
    let ph = player.size;
    
    for (let obs of obstacles) {
        let oy = obs.getRealY();
        if (obs.side === 'LEFT') {
            if (px < WALL_LEFT + obs.width && px + pw > WALL_LEFT && py + ph > oy && py < oy + obs.height) { 
                triggerInfiniteGameOver(); 
                return; 
            }
        } else {
            if (px + pw > WALL_RIGHT() - obs.width && px < WALL_RIGHT() && py + ph > oy && py < oy + obs.height) { 
                triggerInfiniteGameOver(); 
                return; 
            }
        }
    }
    
    obstacles = obstacles.filter(obs => obs.getRealY() < cHeight + 100);
}

function triggerInfiniteGameOver() {
    gameState = 'GAMEOVER';
    totalCoins += matchCoins;
    if (score > highScore) { highScore = score; }
    saveGameData();
    
    const title = document.getElementById('gameOverTitle');
    title.innerText = 'ELENDİN!'; 
    title.style.color = '#ff0055'; 
    title.style.textShadow = '0 0 15px #ff0055';

    document.getElementById('finalScore').innerText = 'Skor: ' + score;
    document.getElementById('gainedCoins').innerText = 'Kazanılan: +🪙 ' + matchCoins;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}
