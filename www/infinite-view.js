// infinite-view.js - Sonsuz Mod Çizim, Render ve Arayüz Dünyası

let obstacles = [];
let nextObstacleY = 0;
let consecutiveLeftCount = 0;
let consecutiveRightCount = 0;

function infiniteGameLoop() {
    if (gameMode !== 'INFINITE') return; 
    if (!ctx || !canvas) { requestAnimationFrame(infiniteGameLoop); return; }

    ctx.fillStyle = '#0c0c0e'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawDecors();
    
    if (gameState === 'PLAYING') {
        updateInfiniteLogic();
    }
    
    obstacles.forEach(obs => {
        let realY = obs.getRealY();
        if (realY > -50 && realY < canvas.height + 50) {
            ctx.save(); 
            ctx.shadowBlur = 15; 
            ctx.shadowColor = '#ff0055'; 
            ctx.fillStyle = '#ff0055'; 
            ctx.beginPath();
            if (obs.side === 'LEFT') {
                ctx.moveTo(WALL_LEFT, realY); 
                ctx.lineTo(WALL_LEFT + obs.width, realY + obs.height / 2); 
                ctx.lineTo(WALL_LEFT, realY + obs.height);
            } else {
                ctx.moveTo(WALL_RIGHT(), realY); 
                ctx.lineTo(WALL_RIGHT() - obs.width, realY + obs.height / 2); 
                ctx.lineTo(WALL_RIGHT(), realY + obs.height);
            }
            ctx.closePath(); 
            ctx.fill(); 
            ctx.restore();
        }
    }); 
    
    player.draw();
    requestAnimationFrame(infiniteGameLoop);
}

document.getElementById('playMenuBtn').addEventListener('click', () => {
    initAudio(); 
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('difficultyMenu').classList.remove('hidden');
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
    initAudio(); 
    document.getElementById('difficultyMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

document.getElementById('easyBtn').addEventListener('click', () => {
    initAudio();
    gameMode = 'INFINITE';
    gameState = 'PLAYING';
    document.getElementById('difficultyMenu').classList.add('hidden');
    startInfiniteGame('EASY');
    if (!loopStarted) { infiniteGameLoop(); loopStarted = true; }
});

document.getElementById('normalBtn').addEventListener('click', () => {
    initAudio();
    gameMode = 'INFINITE';
    gameState = 'PLAYING';
    document.getElementById('difficultyMenu').classList.add('hidden');
    startInfiniteGame('NORMAL');
    if (!loopStarted) { infiniteGameLoop(); loopStarted = true; }
});

document.getElementById('hardBtn').addEventListener('click', () => {
    initAudio();
    gameMode = 'INFINITE';
    gameState = 'PLAYING';
    document.getElementById('difficultyMenu').classList.add('hidden');
    startInfiniteGame('ZOR');
    if (!loopStarted) { infiniteGameLoop(); loopStarted = true; }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('gameOverMenu').classList.add('hidden');
    if (gameMode === 'INFINITE') {
        gameState = 'PLAYING';
        startInfiniteGame(selectedDifficulty);
    } else if (gameMode === 'ADVENTURE') {
        gameState = 'PLAYING';
        startAdventureLevel(selectedLevel);
    }
});

document.getElementById('toMenuBtn').addEventListener('click', () => {
    initAudio(); 
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    gameState = 'MENU'; 
    updateMenuUI();
});
