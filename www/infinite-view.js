// infinite-view.js - Normal Mod Arayüz ve Görünüm Çizim Döngüsü

function mainGameLoop() {
    if (!ctx || !canvas) { requestAnimationFrame(mainGameLoop); return; }

    // Ekranı temizle
    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawDecors();

    if (gameMode === 'INFINITE') {
        if (gameState === 'PLAYING') updateInfiniteLogic();

        // Sonsuz mod engellerini neon kırmızı üçgen olarak çiz
        infiniteObstacles.forEach(obs => {
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
    } 
    else if (gameMode === 'ADVENTURE') {
        if (gameState === 'PLAYING') updateAdventureLogic();
        drawAdventureView(); // Çizim yetkisi macera view katmanına devredilir
    }

    player.draw();
    requestAnimationFrame(mainGameLoop);
}

// --- MENÜ VE EKRAN ETKİLEŞİM DİNLEYİCİLERİ ---
document.getElementById('playMenuBtn').addEventListener('click', () => {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('modeMenu').classList.remove('hidden');
});

document.getElementById('normalModeBtn').addEventListener('click', () => {
    document.getElementById('modeMenu').classList.add('hidden');
    document.getElementById('difficultyMenu').classList.remove('hidden');
});

document.getElementById('backFromModeBtn').addEventListener('click', () => {
    document.getElementById('modeMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

document.getElementById('backFromDiffBtn').addEventListener('click', () => {
    document.getElementById('difficultyMenu').classList.add('hidden');
    document.getElementById('modeMenu').classList.remove('hidden');
});

// Zorluk Seçimleri
document.getElementById('easyBtn').addEventListener('click', () => {
    document.getElementById('difficultyMenu').classList.add('hidden');
    startNormalGame('EASY');
    if (!loopStarted) { loopStarted = true; mainGameLoop(); }
});
document.getElementById('normalBtn').addEventListener('click', () => {
    document.getElementById('difficultyMenu').classList.add('hidden');
    startNormalGame('NORMAL');
    if (!loopStarted) { loopStarted = true; mainGameLoop(); }
});
document.getElementById('hardBtn').addEventListener('click', () => {
    document.getElementById('difficultyMenu').classList.add('hidden');
    startNormalGame('ZOR');
    if (!loopStarted) { loopStarted = true; mainGameLoop(); }
});

// Ekran Tıklama / Dokunma Dinleyicisi (Küpün Zıt Duvara Fırlama Tetikleyicisi)
document.getElementById('gameCanvas').addEventListener('mousedown', (e) => {
    if (gameState === 'PLAYING') player.tap();
});
document.getElementById('gameCanvas').addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') player.tap();
}, { passive: true });

// Profil İşlemleri
document.getElementById('profileMenuBtn').addEventListener('click', () => {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('profileMenu').classList.remove('hidden');
});
document.getElementById('saveProfileBtn').addEventListener('click', () => {
    let inp = document.getElementById('usernameInput').value.trim();
    if (inp) {
        username = inp; saveGameData(); updateMenuUI();
        alert("Profil adı güncellendi reis!");
    }
});
document.getElementById('backFromProfileBtn').addEventListener('click', () => {
    document.getElementById('profileMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

// Market Olayları
document.getElementById('shopMenuBtn').addEventListener('click', () => {
    buildShopGrids();
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('shopMenu').classList.remove('hidden');
});
document.getElementById('backFromShopBtn').addEventListener('click', () => {
    document.getElementById('shopMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});
document.getElementById('tabCubes').addEventListener('click', () => {
    document.getElementById('cubesGrid').classList.remove('hidden');
    document.getElementById('decorsGrid').classList.add('hidden');
});
document.getElementById('tabDecors').addEventListener('click', () => {
    document.getElementById('decorsGrid').classList.remove('hidden');
    document.getElementById('cubesGrid').classList.add('hidden');
});

// Yeniden Başlat ve Menüye Dönüş Butonları
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOverMenu').classList.add('hidden');
    if (gameMode === 'INFINITE') startNormalGame(selectedDifficulty);
    else startAdventureLevel(selectedLevel);
});
document.getElementById('toMenuBtn').addEventListener('click', () => {
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    gameState = 'MENU';
    updateMenuUI();
});
