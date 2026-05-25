// adventure-view.js - Macera Modu Çizim, Render ve 50 Seviye Arayüzü

// Macera moduna ait global nesne dizileri ve bölüm takipçileri
let coins = [];
let nextCoinY = 0;
let selectedLevel = 1;
let currentLevel = parseInt(localStorage.getItem('nc_currentlevel')) || 1; // Açılan son bölüm datası
let adventureTargetScore = 20;

function saveAdventureData() {
    localStorage.setItem('nc_currentlevel', currentLevel);
}

// Macera Modunun Ana Çizim ve Render Döngüsü (Küpün ekranda kalma sırrını korur)
function adventureGameLoop() {
    if (gameMode !== 'ADVENTURE') return; // Eğer mod değişirse bu döngü boşa çizim yapmaz

    // Koyu neon arka plan temizliği
    ctx.fillStyle = '#0c0c0e'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Eski renk tonlarıyla duvar temalarını çiz
    drawDecors();
    
    // Eğer oyun oynanıyorsa, beynin hesaplamalarını tetikle (adventure-logic.js)
    if (gameState === 'PLAYING') {
        updateAdventureLogic();
    }
    
    // 1. ENGELLERİ ÇİZ (Sonsuz modla aynı ölümcül pembe neon tonu)
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

    // 2. PARALARI ÇİZ (O meşhur parlak retro altın sarısı tonuyla)
    coins.forEach(coin => {
        if (!coin.collected) {
            let realY = coin.getRealY();
            if (realY > -50 && realY < canvas.height + 50) {
                ctx.save();
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ffd700'; // Altın sarısı neon parlaması
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(coin.x, realY, coin.size / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Paranın ortasına şık bir iç halka detayı
                ctx.strokeStyle = '#0c0c0e';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(coin.x, realY, coin.size / 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    // Oyuncunun neon turkuaz küpünü çiz
    player.draw();
    
    // Oyun bitse veya kazanılsa bile render'ı durdurma (Küpün kaybolmama sırrı)
    requestAnimationFrame(adventureGameLoop);
}

// --- 50 BÖLÜMLÜK SEÇİM EKRANINI DİNAMİK OLUŞTURMA MOTORU ---
function buildAdventureGrid() {
    const grid = document.getElementById('adventureGrid');
    if (!grid) return;
    grid.innerHTML = ''; // Eski butonları temizle
    
    for (let i = 1; i <= 50; i++) {
        const card = document.createElement('div');
        card.classList.add('level-card');
        card.innerText = i;
        
        // Eğer oyuncunun seviyesi buraya yetiyorsa bölümün kilidini aç (Yeşil yap)
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
            // Kilitli bölümlere asma kilit emojisi koyalım
            card.innerText = '🔒';
            card.style.fontSize = '12px';
        }
        grid.appendChild(card);
    }
}

// --- MACERA MODU BUTON BAĞLANTILARI ---

// Ana menüden Macera Paneline geçiş
document.getElementById('adventureMenuBtn').addEventListener('click', () => {
    initAudio();
    buildAdventureGrid(); // 50 bölümü hafızadaki son duruma göre anlık inşa et
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('adventureMenu').classList.remove('hidden');
});

// Macera panelinden ana menüye geri dönüş
document.getElementById('backFromAdventureBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('adventureMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});
