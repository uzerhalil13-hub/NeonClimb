const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- SAF SÖZÜKSEL SES MOTORU (WEB AUDIO API) ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// 1. TÜM MODLARDA DUVARA ÇARPMA SESİ (Kısa, net ve dijital siber tık)
function playHitSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(160, audioCtx.currentTime); 
    
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.07); 
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
}

// 2. TÜM MODLARDA ELENDİN / YANMA SESİ (Aşağı doğru sönen dijital lazer patlaması)
function playExplosionSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth'; 
    osc.frequency.setValueAtTime(280, audioCtx.currentTime); 
    osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.35); 
    
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
}

// 3. MACERA MODUNA ÖZEL KAZANMA SESİ (Peş peşe tetiklenen coşkulu iki siber nota)
function playWinSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(523.25, now); 
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc1.connect(gain1); gain1.connect(audioCtx.destination);
    osc1.start(now); osc1.stop(now + 0.1);
    
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(659.25, now + 0.1); 
    gain2.gain.setValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    osc2.start(now + 0.1); osc2.stop(now + 0.3);
}

// --- KALICI VERİLER (LOCALSTORAGE) ---
let highScore = parseInt(localStorage.getItem('nc_highscore')) || 0;
let totalCoins = parseInt(localStorage.getItem('nc_coins')) || 0;
let unlockedItems = JSON.parse(localStorage.getItem('nc_unlocked')) || ['c_classic_#00f2ff'];

function saveGameData() {
    localStorage.setItem('nc_highscore', highScore);
    localStorage.setItem('nc_coins', totalCoins);
    localStorage.setItem('nc_unlocked', JSON.stringify(unlockedItems));
}

let gameState = 'MENU';
let gameMode = 'INFINITE'; // 'INFINITE' veya 'ADVENTURE'
let score = 0;
let matchCoins = 0; 
let worldOffset = 0;
let gameSpeed = 4.5;

// --- DİNAMİK ZORLUK AYARLARI KÜTÜPHANESİ ---
let selectedDifficulty = 'NORMAL';
const DIFFICULTY_SETTINGS = {
    EASY: { startSpeed: 3.5, acceleration: 0.0004, minGap: 180, maxGap: 300 },
    NORMAL: { startSpeed: 4.5, acceleration: 0.0008, minGap: 150, maxGap: 290 },
    ZOR: { startSpeed: 5.5, acceleration: 0.0012, minGap: 120, maxGap: 220 }
};

// --- SEÇİLİ KOSTÜM VE DEKORLAR ---
let playerColor = '#00f2ff';
let playerShape = 'classic'; 
let currentDecor = 'default'; 

const WALL_LEFT = 35;
const WALL_RIGHT = () => canvas.width - 35;

const player = {
    x: 0,
    y: 0,
    size: 24,
    targetX: 0,
    speed: 14, 
    side: 'RIGHT', 
    lastTurnTime: 0,
    angle: 0,     
    startX: 0,    
    
    init() {
        this.y = canvas.height * 0.7; 
        this.side = 'RIGHT';
        this.x = WALL_RIGHT() - this.size / 2;
        this.targetX = this.x;
        this.startX = this.x;
        this.lastTurnTime = 0;
        this.angle = 0;
    },
    
    update() {
        if (this.x !== this.targetX) {
            let diff = this.targetX - this.x;
            if (Math.abs(diff) < this.speed) {
                this.x = this.targetX;
                this.angle = 0; 
                playHitSound(); // Hedefe ulaştığı (Duvara vurduğu) an tık sesi tetiklenir
            } else {
                this.x += Math.sign(diff) * this.speed;
                
                let totalDistance = Math.abs(this.targetX - this.startX);
                if (totalDistance > 0) {
                    let progress = Math.abs(this.x - this.startX) / totalDistance;
                    let direction = this.targetX > this.startX ? 1 : -1;
                    this.angle = progress * (Math.PI / 2) * direction; 
                }
            }
        }
    },
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.shadowBlur = 18;
        ctx.shadowColor = playerColor;
        ctx.fillStyle = playerColor;
        
        let halfSize = this.size / 2;
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        
        if (playerShape === 'smiley') {
            ctx.fillStyle = '#0c0c0e';
            ctx.fillRect(-halfSize + 5, -halfSize + 6, 3, 4);
            ctx.fillRect(-halfSize + 16, -halfSize + 6, 3, 4);
            ctx.strokeStyle = '#0c0c0e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(-halfSize + 12, -halfSize + 13, 5, 0, Math.PI, false);
            ctx.stroke();
        }
        ctx.restore();
    },
    
    changeSide() {
        let currentTime = Date.now();
        if (currentTime - this.lastTurnTime < 120) {
            return; 
        }
        this.lastTurnTime = currentTime;
        this.startX = this.x; 

        if (this.side === 'RIGHT') {
            this.side = 'LEFT';
            this.targetX = WALL_LEFT + this.size / 2;
        } else {
            this.side = 'RIGHT';
            this.targetX = WALL_RIGHT() - this.size / 2;
        }
    }
};

let consecutiveLeftCount = 0;
let consecutiveRightCount = 0;

class Obstacle {
    constructor(relativeY) {
        this.relativeY = relativeY;
        this.width = 30; 
        this.height = 20; 
        
        let chosenSide = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
        
        if (chosenSide === 'LEFT') {
            if (consecutiveLeftCount >= 3) {
                chosenSide = 'RIGHT';
                consecutiveLeftCount = 0;
                consecutiveRightCount = 1;
            } else {
                consecutiveLeftCount++;
                consecutiveRightCount = 0;
            }
        } else {
            if (consecutiveRightCount >= 3) {
                chosenSide = 'LEFT';
                consecutiveRightCount = 0;
                consecutiveLeftCount = 1;
            } else {
                consecutiveRightCount++;
                consecutiveLeftCount = 0;
            }
        }
        
        this.side = chosenSide;
    }
    getRealY() { return this.relativeY + worldOffset; }
    draw() {
        let realY = this.getRealY();
        if (realY > -50 && realY < canvas.height + 50) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            if (this.side === 'LEFT') {
                ctx.moveTo(WALL_LEFT, realY);
                ctx.lineTo(WALL_LEFT + this.width, realY + this.height / 2);
                ctx.lineTo(WALL_LEFT, realY + this.height);
            } else {
                ctx.moveTo(WALL_RIGHT(), realY);
                ctx.lineTo(WALL_RIGHT() - this.width, realY + this.height / 2);
                ctx.lineTo(WALL_RIGHT(), realY + this.height);
            }
            ctx.closePath(); ctx.fill(); ctx.restore();
        }
    }
}

let obstacles = [];
let nextObstacleY = 0;

function spawnObstacles() {
    let diffSetting = DIFFICULTY_SETTINGS[selectedDifficulty];
    while (nextObstacleY > -worldOffset - canvas.height) {
        obstacles.push(new Obstacle(nextObstacleY));
        let gap = Math.random() * (diffSetting.maxGap - diffSetting.minGap) + diffSetting.minGap;
        nextObstacleY -= gap; 
    }
}

function checkCollisions() {
    let px = player.x - player.size / 2;
    let py = player.y - player.size / 2;
    let pw = player.size;
    let ph = player.size;

    for (let obs of obstacles) {
        let oy = obs.getRealY();
        if (obs.side === 'LEFT') {
            if (px < WALL_LEFT + obs.width && px + pw > WALL_LEFT && py + ph > oy && py < oy + obs.height) {
                endGame(); break;
            }
        } else {
            if (px + pw > WALL_RIGHT() - obs.width && px < WALL_RIGHT() && py + ph > oy && py < oy + obs.height) {
                endGame(); break;
            }
        }
    }
}

function drawDecors() {
    let patternSize = 160; 
    let startY = (worldOffset % patternSize) - patternSize;
    ctx.save();
    
    for (let y = startY; y < canvas.height + patternSize; y += patternSize) {
        if (currentDecor === 'default') {
            ctx.strokeStyle = '#22222b';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(WALL_LEFT, y); ctx.lineTo(WALL_LEFT, y + patternSize);
            ctx.moveTo(WALL_RIGHT(), y); ctx.lineTo(WALL_RIGHT(), y + patternSize);
            ctx.stroke();
        } 
        else if (currentDecor === 'rock') {
            ctx.fillStyle = '#1c1c22';
            ctx.strokeStyle = '#2d2d38';
            ctx.lineWidth = 2;
            ctx.fillRect(0, y, WALL_LEFT, patternSize - 10);
            ctx.strokeRect(0, y, WALL_LEFT, patternSize - 10);
            ctx.fillRect(WALL_RIGHT(), y, canvas.width - WALL_RIGHT(), patternSize - 10);
            ctx.strokeRect(WALL_RIGHT(), y, canvas.width - WALL_RIGHT(), patternSize - 10);
        } 
        else if (currentDecor === 'cyber') {
            ctx.strokeStyle = '#00f2ff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.25;
            for (let ty = 0; ty < patternSize; ty += 20) {
                ctx.strokeRect(0, y + ty, WALL_LEFT, 20);
                ctx.strokeRect(WALL_RIGHT(), y + ty, canvas.width - WALL_RIGHT(), 20);
            }
            ctx.globalAlpha = 1.0;
        } 
        else if (currentDecor === 'matrix') {
            ctx.fillStyle = '#39ff14';
            ctx.globalAlpha = 0.3;
            ctx.font = '10px monospace';
            ctx.fillText("10101", 5, y + 30);
            ctx.fillText("0110", WALL_RIGHT() + 5, y + 60);
            ctx.fillText("1101", 12, y + 100);
            ctx.fillText("0011", WALL_RIGHT() + 10, y + 120);
            ctx.globalAlpha = 1.0;
        }
    }
    ctx.strokeStyle = '#18181f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WALL_LEFT, 0); ctx.lineTo(WALL_LEFT, canvas.height);
    ctx.moveTo(WALL_RIGHT(), 0); ctx.lineTo(WALL_RIGHT(), canvas.height);
    ctx.stroke();
    ctx.restore();
}

function updateHUD() {
    document.getElementById('liveScore').innerText = 'Skor: ' + score;
    document.getElementById('liveCoins').innerText = '🪙 ' + matchCoins;
}

function updateMenuUI() {
    document.getElementById('menuBest').innerText = 'REKOR: ' + highScore;
    document.getElementById('menuCoins').innerText = 'BAKİYE: 🪙 ' + totalCoins;
    document.getElementById('shopBalance').innerText = 'Bakiye: 🪙 ' + totalCoins;
}

function gameLoop() {
    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawDecors(); 
    
    if (gameState === 'PLAYING') {
        let currentDiffConfig = DIFFICULTY_SETTINGS[selectedDifficulty];
        
        worldOffset += gameSpeed;
        if (gameMode === 'INFINITE') {
            gameSpeed += currentDiffConfig.acceleration; 
        }
        score = Math.floor(worldOffset / 160);
        matchCoins = Math.floor(score / 5);
        
        updateHUD();
        spawnObstacles();
        player.update();
        checkCollisions();
        obstacles = obstacles.filter(obs => obs.getRealY() < canvas.height + 100);
    }
    
    obstacles.forEach(obs => obs.draw());
    player.draw();
    
    requestAnimationFrame(gameLoop);
}

function startGame(diff, mode = 'INFINITE') {
    initAudio(); // Kullanıcı ekrana dokunduğu an ses motorunu canlandırıyoruz
    selectedDifficulty = diff;
    gameMode = mode;
    gameState = 'PLAYING';
    score = 0;
    matchCoins = 0;
    worldOffset = 0;
    consecutiveLeftCount = 0;
    consecutiveRightCount = 0;
    
    gameSpeed = DIFFICULTY_SETTINGS[selectedDifficulty].startSpeed;
    
    nextObstacleY = -200;
    obstacles = [];
    player.init();
    updateHUD();
    
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('difficultyMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
}

function endGame() {
    gameState = 'GAMEOVER';
    playExplosionSound(); // Elenme anında lazer patlama sesi çalar
    
    totalCoins += matchCoins;
    if (gameMode === 'INFINITE' && score > highScore) {
        highScore = score;
    }
    saveGameData();
    
    document.getElementById('finalScore').innerText = 'Skor: ' + score;
    document.getElementById('gainedCoins').innerText = 'Kazanılan: +🪙 ' + matchCoins;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

// --- MARKET MOTORU ---
function buildShopUI() {
    const cubesGrid = document.getElementById('cubesGrid');
    const decorsGrid = document.getElementById('decorsGrid');
    cubesGrid.innerHTML = '';
    decorsGrid.innerHTML = '';
    
    CUBES_DATA.forEach(cube => {
        let item = document.createElement('div');
        item.className = 'shop-item';
        item.style.backgroundColor = cube.color;
        if (cube.type === 'smiley') {
            item.innerHTML = `<span style="color:#0c0c0e; font-size:1.1rem; font-weight:bold; margin-top:-4px;">☺</span>`;
        }
        if (unlockedItems.includes(cube.id)) {
            item.classList.add('purchased');
            if (playerColor === cube.color && playerShape === cube.type) item.classList.add('active');
        } else {
            item.classList.add('locked');
            item.setAttribute('data-price', cube.price);
        }
        item.addEventListener('click', () => handleShopClick(cube, 'cube'));
        cubesGrid.appendChild(item);
    });
    
    DECORS_DATA.forEach(decor => {
        let item = document.createElement('div');
        item.className = 'shop-item';
        item.style.borderStyle = 'dashed';
        item.innerText = decor.label;
        if (unlockedItems.includes(decor.id) || decor.price === 0) {
            if (!unlockedItems.includes(decor.id)) unlockedItems.push(decor.id);
            item.classList.add('purchased');
            if (currentDecor === decor.key) item.classList.add('active');
        } else {
            item.classList.add('locked');
            item.setAttribute('data-price', decor.price);
        }
        item.addEventListener('click', () => handleShopClick(decor, 'decor'));
        decorsGrid.appendChild(item);
    });
}

function handleShopClick(product, category) {
    initAudio();
    if (unlockedItems.includes(product.id)) {
        if (category === 'cube') {
            playerColor = product.color;
            playerShape = product.type;
        } else {
            currentDecor = product.key;
        }
    } else {
        if (totalCoins >= product.price) {
            totalCoins -= product.price;
            unlockedItems.push(product.id);
            saveGameData();
            if (category === 'cube') {
                playerColor = product.color;
                playerShape = product.type;
            } else {
                currentDecor = product.key;
            }
        } else {
            alert('Yetersiz Bakiye! 🪙'); return;
        }
    }
    saveGameData(); updateMenuUI(); buildShopUI();
}

// --- DOKUNMATİK EKRAN TETİKLEYİCİLERİ ---
window.addEventListener('touchstart', (e) => {
    initAudio();
    if (gameState === 'PLAYING') {
        player.changeSide(); e.preventDefault();
    }
}, { passive: false });

window.addEventListener('mousedown', () => {
    initAudio();
    if (gameState === 'PLAYING') player.changeSide();
});

// --- UI BUTON DİNLEYİCİLERİ ---
document.getElementById('playMenuBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('difficultyMenu').classList.remove('hidden');
});

document.getElementById('adventureMenuBtn').addEventListener('click', () => {
    initAudio();
    // Macera Modu tıklandığında doğrudan orta zorluk seviyesinde başlatıyoruz (Şimdilik altyapı hazırlığı)
    startGame('NORMAL', 'ADVENTURE');
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('difficultyMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

document.getElementById('easyBtn').addEventListener('click', () => startGame('EASY', 'INFINITE'));
document.getElementById('normalBtn').addEventListener('click', () => startGame('NORMAL', 'INFINITE'));
document.getElementById('hardBtn').addEventListener('click', () => startGame('ZOR', 'INFINITE'));

document.getElementById('restartBtn').addEventListener('click', () => startGame(selectedDifficulty, gameMode));

document.getElementById('toMenuBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    gameState = 'MENU';
    updateMenuUI();
});

document.getElementById('shopBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('shopMenu').classList.remove('hidden');
    buildShopUI(); updateMenuUI();
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('shopMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    updateMenuUI();
});

document.getElementById('tabCubes').addEventListener('click', () => {
    initAudio();
    document.getElementById('tabCubes').classList.add('active');
    document.getElementById('tabDecors').classList.remove('active');
    document.getElementById('cubesGrid').classList.remove('hidden');
    document.getElementById('decorsGrid').classList.add('hidden');
});

document.getElementById('tabDecors').addEventListener('click', () => {
    initAudio();
    document.getElementById('tabDecors').classList.add('active');
    document.getElementById('tabCubes').classList.remove('active');
    document.getElementById('decorsGrid').classList.remove('hidden');
    document.getElementById('cubesGrid').classList.add('hidden');
});

updateMenuUI();
gameLoop();
