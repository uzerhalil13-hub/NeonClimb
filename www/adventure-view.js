// adventure-view.js - Macera Modu Çizim, Render ve 50 Seviye Arayüzü

let coins = [];
let nextCoinY = 0;
let selectedLevel = 1;
let currentLevel = parseInt(localStorage.getItem('nc_currentlevel')) || 1; 
let adventureTargetScore = 20;

function saveAdventureData() {
    localStorage.setItem('nc_currentlevel', currentLevel);
}

function adventureGameLoop() {
    if (gameMode !== 'ADVENTURE') return; 
    if (!ctx || !canvas) { requestAnimationFrame(adventureGameLoop); return; }

    ctx.fillStyle = '#0c0c0e'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawDecors();
    
    if (gameState === 'PLAYING') {
        updateAdventureLogic();
    }
    
    obstacles.forEach(obs => {
        let realY = obs.getRealY();
        if (realY > -50 && realY < canvas.height + 50) {
            ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = '#ff0055'; ctx.fillStyle = '#ff0055'; ctx.beginPath();
            if (obs.side === 'LEFT') {
                ctx.moveTo(WALL_LEFT, realY); ctx.lineTo(WALL_LEFT + obs.width, realY + obs.height / 2); ctx.lineTo(WALL_LEFT, realY + obs.height);
            } else {
                ctx.moveTo(WALL_RIGHT(), realY); ctx.lineTo(WALL_RIGHT() - obs.width, realY + obs.height / 2); ctx.lineTo(WALL_RIGHT(), realY + obs.height);
            }
            ctx.closePath(); ctx.fill(); ctx.restore();
        }
    });

    coins.forEach(coin => {
        if (!coin.collected) {
            let realY = coin.getRealY();
            if (realY > -50 && realY < canvas.height + 50) {
                ctx.save();
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ffd700'; 
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(coin.x, realY, coin.size / 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#0c0c0e';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(coin.x, realY, coin.size / 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    player.draw();
    requestAnimationFrame(adventureGameLoop);
}

function buildAdventureGrid() {
    const grid = document.getElementById('adventureGrid');
    if (!grid) return;
    grid.innerHTML = ''; 
    
    for (let i = 1; i <= 50; i++) {
        const card = document.createElement('div');
        card.classList.add('level-card');
        card.innerText = i;
        
        if (i <= currentLevel) {
            card.classList.add('unlocked');
            card.addEventListener('click', () => {
                initAudio();
                selectedLevel = i;
                gameMode = 'ADVENTURE';
                gameState = 'PLAYING';
                document.getElementById('adventureMenu').classList.add('hidden');
                startAdventureLevel(i);
                if (!adventureLoopStarted) { adventureGameLoop(); adventureLoopStarted = true; }
            });
        } else {
            card.innerText = '🔒';
            card.style.fontSize = '12px';
        }
        grid.appendChild(card);
    }
}

document.getElementById('adventureMenuBtn').addEventListener('click', () => {
    initAudio();
    buildAdventureGrid(); 
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('adventureMenu').classList.remove('hidden');
});

document.getElementById('backFromAdventureBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('adventureMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});
