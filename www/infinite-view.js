// infinite-view.js - Sonsuz Mod Çizim, Render ve Arayüz Dünyası

// Sonsuz moda ait global nesne dizisi
let obstacles = [];
let nextObstacleY = 0;
let consecutiveLeftCount = 0;
let consecutiveRightCount = 0;

// Sonsuz Modun Ana Çizim ve Render Döngüsü (Küpün ekranda kalma sırrını korur)
function infiniteGameLoop() {
    if (gameMode !== 'INFINITE') return; // Eğer mod değişirse bu döngü boşa çizim yapmaz

    // Arka planı temizle ve koyu neon siyahı yap
    ctx.fillStyle = '#0c0c0e'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Eski renk tonlarıyla seçilen arka plan duvar dekorunu çiz
    drawDecors();
    
    // Eğer oyun oynanıyorsa, beynin hesaplamalarını tetikle (infinite-logic.js)
    if (gameState === 'PLAYING') {
        updateInfiniteLogic();
    }
    
    // Engelleri o meşhur ölümcül pembe neon tonuyla ekrana çiz
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
    
    // Oyuncunun neon turkuaz küpünü ve animasyonlu açısını çiz
    player.draw();
    
    // Oyun bitse veya menüde olsak bile render'ı durdurma (Küpün kaybolmama sırrı)
    requestAnimationFrame(infiniteGameLoop);
}

// --- SONSUZ MOD VE ANA MENÜ BUTON BAĞLANTILARI ---

// Giriş ekranından Sonsuz Mod zorluk seçimine geçiş
document.getElementById('playMenuBtn').addEventListener('click', () => {
    initAudio(); 
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('difficultyMenu').classList.remove('hidden');
});

// Zorluk seçim menüsünden ana menüye geri dönüş
document.getElementById('backToMainBtn').addEventListener('click', () => {
    initAudio(); 
    document.getElementById('difficultyMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

// Zorluk butonları - Doğrudan beynin başlatma fonksiyonunu ve render akışını tetikler
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

// Elendin ekranındaki Yeniden Dene butonu
document.getElementById('restartBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('gameOverMenu').classList.add('hidden');
    if (gameMode === 'INFINITE') {
        gameState = 'PLAYING';
        startInfiniteGame(selectedDifficulty);
    }
});

// Elendin ekranından Ana Menüye dönüş butonu
document.getElementById('toMenuBtn').addEventListener('click', () => {
    initAudio(); 
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    gameState = 'MENU'; 
    updateMenuUI();
});
