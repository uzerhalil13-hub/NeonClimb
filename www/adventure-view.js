// adventure-view.js - Macera Modu Harita Yapımı ve Obje Çizimleri

function drawAdventureView() {
    // Macera engellerini çiz
    advObstacles.forEach(obs => {
        let realY = obs.getRealY();
        if (realY > -40 && realY < canvas.height + 40) {
            ctx.save();
            ctx.shadowBlur = 12;
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
            ctx.fill();
            ctx.restore();
        }
    });

    // Macera paralarını parlak altın rengi daireler olarak çiz
    advCoins.forEach(coin => {
        if (!coin.collected) {
            let realY = coin.getRealY();
            if (realY > -30 && realY < canvas.height + 30) {
                ctx.save();
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffd700';
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(coin.x, realY, coin.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    });
}

function buildAdventureGrid() {
    const grid = document.getElementById('adventureGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 1; i <= 50; i++) {
        const card = document.createElement('div');
        card.classList.add('level-card');
        
        if (i <= currentLevel) {
            card.classList.add('unlocked');
            card.innerText = i;
            card.addEventListener('click', () => {
                document.getElementById('adventureMenu').classList.add('hidden');
                startAdventureLevel(i);
                if (!loopStarted) { loopStarted = true; mainGameLoop(); }
            });
        } else {
            card.innerText = '🔒';
            card.style.opacity = '0.4';
        }
        grid.appendChild(card);
    }
}

// Buton Tetikleyicileri
document.getElementById('adventureModeBtn').addEventListener('click', () => {
    buildAdventureGrid();
    document.getElementById('modeMenu').classList.add('hidden');
    document.getElementById('adventureMenu').classList.remove('hidden');
});

document.getElementById('backFromAdventureBtn').addEventListener('click', () => {
    document.getElementById('adventureMenu').classList.add('hidden');
    document.getElementById('modeMenu').classList.remove('hidden');
});
