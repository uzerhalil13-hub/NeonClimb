// infinite-logic.js - Sonsuz Mod Saf Fizik ve Hesaplama Beyni

// Sonsuz moda özel engel sınıfı (Çizim kodu içermez, sadece veri tutar)
class InfiniteObstacle {
    constructor(relativeY) {
        this.relativeY = relativeY;
        this.width = 30;
        this.height = 20;
        
        // Homojen Dağıtım: Üst üste aynı yöne en fazla 3 engel gelebilir
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

// Sonsuz modu sıfırdan başlatan tetikleyici köprü
function startInfiniteGame(diff) {
    initAudio();
    selectedDifficulty = diff;
    gameMode = 'INFINITE';
    gameState = 'PLAYING';
    
    // Skor, ekonomi ve motor değişkenleri sıfırlanıyor
    score = 0; 
    matchCoins = 0; 
    worldOffset = 0;
    consecutiveLeftCount = 0; 
    consecutiveRightCount = 0;
    
    // Sadece sonsuz modun engellerini temizle
    obstacles = []; 
    nextObstacleY = -200; 
    
    // Seçilen zorluğa göre hız ve ivme ayarları yükleniyor
    gameSpeed = DIFFICULTY_SETTINGS[selectedDifficulty].startSpeed; 
    
    player.init(); 
    updateHUD();
    
    // Menüleri kapat
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('difficultyMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    
    // Eğer çizim/render döngüsü başlamadıysa motorun kalbini çalıştır
    if (!loopStarted) {
        loopStarted = true;
        infiniteGameLoop();
    }
}

// Sonsuz Modun Fizik Güncelleme Motoru (Her karede çalışır)
function updateInfiniteLogic() {
    if (gameState !== 'PLAYING' || gameMode !== 'INFINITE') return;

    // Dünyayı yukarı kaydır ve hızı ivmeye göre dinamik arttır
    worldOffset += gameSpeed;
    gameSpeed += DIFFICULTY_SETTINGS[selectedDifficulty].acceleration; 
    
    // Skoru hesapla ve geleneksel skor/5 formülüyle parayı otomatik artır
    score = Math.floor(worldOffset / 160);
    matchCoins = Math.floor(score / 5); 
    updateHUD();

    // Zorluk ayarlarına göre homojen engelleri dikey eksende üret
    let diffSetting = DIFFICULTY_SETTINGS[selectedDifficulty];
    while (nextObstacleY > -worldOffset - canvas.height) {
        obstacles.push(new InfiniteObstacle(nextObstacleY));
        let gap = Math.random() * (diffSetting.maxGap - diffSetting.minGap) + diffSetting.minGap;
        nextObstacleY -= gap; 
    }

    // Küpün hareket fiziğini güncelle
    player.update(); 
    
    // Çarpışmaları Kontrol Et
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
    
    // Ekrandan tamamen çıkan (aşağı kayıp kaybolan) eski engelleri hafızadan temizle
    obstacles = obstacles.filter(obs => obs.getRealY() < canvas.height + 100);
}

// Sonsuz modda yanma/gamelover tetikleyicisi
function triggerInfiniteGameOver() {
    gameState = 'GAMEOVER';
    playExplosionSound();
    
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
