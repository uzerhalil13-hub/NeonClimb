const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ekran boyutunu cihaz çözünürlüğüne sabitleme
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Oyun Durum Değişkenleri
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let worldOffset = 0; // Dünyanın aşağı kayma miktarı
let gameSpeed = 5; // Başlangıç akış hızı

// Küp Özelleştirme Verisi
let playerColor = '#00f2ff';

// Oyuncu Nesnesi (Küp)
const player = {
    x: canvas.width / 2,
    y: canvas.height * 0.65, // Ekrandaki dikey konumu tamamen SABİT duracak
    size: 26,
    targetX: canvas.width / 2,
    baseSpeed: 18, // Sağa sola kayma hızı (Akıcı ama keskin)
    direction: 1, // 1: Sağ, -1: Sol
    
    init() {
        this.x = canvas.width / 2;
        this.targetX = this.x;
        this.direction = 1;
    },
    
    update() {
        // İstenen yöne doğru tamamen DÜZ ve keskin yatay hareket mantığı
        if (this.x !== this.targetX) {
            let diff = this.targetX - this.x;
            if (Math.abs(diff) < this.baseSpeed) {
                this.x = this.targetX;
            } else {
                this.x += Math.sign(diff) * this.baseSpeed;
            }
        }
        
        // Ekran kenar sınırları koruması
        const padding = 35; 
        if (this.x < padding) this.x = padding;
        if (this.x > canvas.width - padding) this.x = canvas.width - padding;
    },
    
    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = playerColor;
        ctx.fillStyle = playerColor;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    },
    
    changeDirection() {
        // Gelişmiş Hassasiyet: Basıldığı an bekleme yapmadan hedef konumu tam ters yöne fırlatır
        this.direction *= -1;
        const jumpDistance = canvas.width * 0.35; // Yana kayma genişliği
        this.targetX = this.x + (this.direction * jumpDistance);
    }
};

// Engeller Sınıfı
class Obstacle {
    constructor(relativeY) {
        this.relativeY = relativeY; // Dünyaya göre konumu
        this.sizeWidth = Math.random() * 60 + 50;
        this.sizeHeight = 20;
        // Engel solda mı sağda mı rastgele belirlenir
        this.x = Math.random() > 0.5 ? 40 : canvas.width - 40 - this.sizeWidth;
    }
    
    getRealY() {
        // Küp sabit dururken engellerin aşağı kayma matematiksel karşılığı
        return this.relativeY + worldOffset;
    }
    
    draw() {
        let realY = this.getRealY();
        // Sadece ekranda görünen engelleri çiz
        if (realY > -50 && realY < canvas.height + 50) {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(this.x, realY, this.sizeWidth, this.sizeHeight);
            ctx.restore();
        }
    }
}

let obstacles = [];
let nextObstacleY = 0;

function spawnObstacles() {
    // Küpün yukarısında (yani negatif düzlemde) sürekli yeni engeller üretilir
    while (nextObstacleY > -worldOffset - canvas.height) {
        obstacles.push(new Obstacle(nextObstacleY));
        nextObstacleY -= Math.random() * 180 + 160; // Engeller arası mesafe dengesi
    }
}

// Çarpışma Test Algoritması (AABB)
function checkCollisions() {
    for (let obs of obstacles) {
        let obsRealY = obs.getRealY();
        
        if (
            player.x - player.size/2 < obs.x + obs.sizeWidth &&
            player.x + player.size/2 > obs.x &&
            player.y - player.size/2 < obsRealY + obs.sizeHeight &&
            player.y + player.size/2 > obsRealY
        ) {
            endGame();
            break;
        }
    }
}

// Yan Sınır Çizgileri (Dünya Akış Hissiyatı İçin)
function drawWalls() {
    ctx.strokeStyle = '#33333d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(30, canvas.height);
    ctx.moveTo(canvas.width - 30, 0);
    ctx.lineTo(canvas.width - 30, canvas.height);
    ctx.stroke();
}

// Ana Oyun Döngüsü (Game Loop)
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawWalls();
    
    if (gameState === 'PLAYING') {
        // Küp sabit kalırken dünya (arka plan ve engeller) aşağı akar
        worldOffset += gameSpeed;
        gameSpeed += 0.001; // Zamanla hafifçe zorlaşma ivmesi
        
        // Geçilen engellerden skor kazanma
        score = Math.floor(worldOffset / 150);
        document.getElementById('liveScore').innerText = 'Skor: ' + score;
        
        spawnObstacles();
        player.update();
    }
    
    // Çizim Emirleri
    obstacles.forEach(obs => obs.draw());
    player.draw();
    
    if (gameState === 'PLAYING') {
        checkCollisions();
        // Ekrandan tamamen çıkıp geride kalan eski engelleri temizle
        obstacles = obstacles.filter(obs => obs.getRealY() < canvas.height + 100);
    }
    
    requestAnimationFrame(gameLoop);
}

// OYUN KONTROL AKIŞLARI
function startGame() {
    gameState = 'PLAYING';
    score = 0;
    worldOffset = 0;
    gameSpeed = 5;
    nextObstacleY = -200;
    obstacles = [];
    player.init();
    
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
}

function endGame() {
    gameState = 'GAMEOVER';
    document.getElementById('finalScore').innerText = 'Skor: ' + score;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

// DOKUNMA VE TIKLAMA OLAYLARI (Hassasiyet Odaklı)
window.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        player.changeDirection();
        e.preventDefault(); // Telefon ekranının titremesini veya kaymasını önler
    }
}, { passive: false });

// Bilgisayar tarayıcısında test etmek için klik desteği
window.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') {
        player.changeDirection();
    }
});

// MENÜ BUTON TETİKLEYİCİLERİ
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

document.getElementById('toMenuBtn').addEventListener('click', () => {
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    gameState = 'MENU';
});

document.getElementById('shopBtn').addEventListener('click', () => {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('shopMenu').classList.remove('hidden');
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    document.getElementById('shopMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

// Mağaza Renk Seçim Yönetimi
document.querySelectorAll('.shop-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.shop-item').forEach(i => i.classList.remove('active'));
        e.target.classList.add('active');
        playerColor = e.target.getAttribute('data-color');
    });
});

// Motoru İlk Kez Ateşleme
gameLoop();
