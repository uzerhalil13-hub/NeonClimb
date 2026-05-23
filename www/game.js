const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameState = 'MENU';
let score = 0;
let worldOffset = 0;
let gameSpeed = 4.5;
let playerColor = '#00f2ff';

const WALL_LEFT = 35;
const WALL_RIGHT = () => canvas.width - 35;

const player = {
    x: 0,
    y: 0,
    size: 24,
    targetX: 0,
    speed: 14, // Akıcı, doğal ama geniş çapraz kavis yapmayan düz yatay hız oranı
    side: 'RIGHT', // İlk başlangıçta sağ duvara yapışık olması için
    
    init() {
        this.y = canvas.height * 0.7; // Küp ekranda dikey olarak tamamen SABİT kalacak
        this.side = 'RIGHT';
        this.x = WALL_RIGHT() - this.size / 2;
        this.targetX = this.x;
    },
    
    update() {
        // Tamamen yatay düzeyde pürüzsüz düz kayma hareketi
        if (this.x !== this.targetX) {
            let diff = this.targetX - this.x;
            if (Math.abs(diff) < this.speed) {
                this.x = this.targetX;
            } else {
                this.x += Math.sign(diff) * this.speed;
            }
        }
    },
    
    draw() {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = playerColor;
        ctx.fillStyle = playerColor;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    },
    
    changeSide() {
        // Gelişmiş Hassasiyet: Dokunulduğu an bekleme yapmadan hedefi karşı duvara kilitler
        if (this.side === 'RIGHT') {
            this.side = 'LEFT';
            this.targetX = WALL_LEFT + this.size / 2;
        } else {
            this.side = 'RIGHT';
            this.targetX = WALL_RIGHT() - this.size / 2;
        }
    }
};

// Nostaljik Üçgen Diken Engelleri
class Obstacle {
    constructor(relativeY) {
        this.relativeY = relativeY;
        this.width = 30; // Diken genişliği
        this.height = 20; // Diken yüksekliği
        this.side = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
    }
    
    getRealY() {
        return this.relativeY + worldOffset;
    }
    
    draw() {
        let realY = this.getRealY();
        if (realY > -50 && realY < canvas.height + 50) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            
            if (this.side === 'LEFT') {
                // Sol duvardaki üçgen diken
                ctx.moveTo(WALL_LEFT, realY);
                ctx.lineTo(WALL_LEFT + this.width, realY + this.height / 2);
                ctx.lineTo(WALL_LEFT, realY + this.height);
            } else {
                // Sağ duvardaki üçgen diken
                ctx.moveTo(WALL_RIGHT(), realY);
                ctx.lineTo(WALL_RIGHT() - this.width, realY + this.height / 2);
                ctx.lineTo(WALL_RIGHT(), realY + this.height);
            }
            
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}

let obstacles = [];
let nextObstacleY = 0;

function spawnObstacles() {
    while (nextObstacleY > -worldOffset - canvas.height) {
        obstacles.push(new Obstacle(nextObstacleY));
        nextObstacleY -= Math.random() * 140 + 150; // Dikenlerin dikey sıklık dengesi
    }
}

// Üçgen Çarpışma Kutusu Algoritması
function checkCollisions() {
    let px = player.x - player.size / 2;
    let py = player.y - player.size / 2;
    let pw = player.size;
    let ph = player.size;

    for (let obs of obstacles) {
        let oy = obs.getRealY();
        if (obs.side === 'LEFT') {
            if (px < WALL_LEFT + obs.width && px + pw > WALL_LEFT && py + ph > oy && py < oy + obs.height) {
                endGame();
                break;
            }
        } else {
            if (px + pw > WALL_RIGHT() - obs.width && px < WALL_RIGHT() && py + ph > oy && py < oy + obs.height) {
                endGame();
                break;
            }
        }
    }
}

// Neon Çizgili Yan Duvarlar
function drawWalls() {
    ctx.save();
    ctx.strokeStyle = '#22222b';
    ctx.lineWidth = 6;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#111118';
    
    ctx.beginPath();
    ctx.moveTo(WALL_LEFT, 0);
    ctx.lineTo(WALL_LEFT, canvas.height);
    ctx.moveTo(WALL_RIGHT(), 0);
    ctx.lineTo(WALL_RIGHT(), canvas.height);
    ctx.stroke();
    ctx.restore();
}

function gameLoop() {
    // Derin karanlık neon atmosfer arka planı
    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawWalls();
    
    if (gameState === 'PLAYING') {
        worldOffset += gameSpeed;
        gameSpeed += 0.0008; // Zamanla tatlı bir ivmeyle hızlanma
        score = Math.floor(worldOffset / 160);
        document.getElementById('liveScore').innerText = 'Skor: ' + score;
        
        spawnObstacles();
        player.update();
        checkCollisions();
        obstacles = obstacles.filter(obs => obs.getRealY() < canvas.height + 100);
    }
    
    obstacles.forEach(obs => obs.draw());
    player.draw();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    worldOffset = 0;
    gameSpeed = 4.5;
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

// Mobil Dokunmatik Ekran Filtreleri ve Tetikleyicileri
window.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        player.changeSide();
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') {
        player.changeSide();
    }
});

// Arayüz Buton Dinleyicileri
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

document.querySelectorAll('.shop-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.shop-item').forEach(i => i.classList.remove('active'));
        e.target.classList.add('active');
        playerColor = e.target.getAttribute('data-color');
    });
});

gameLoop();
