// shop.js - Ortak Hafıza, Dinamik Mağaza ve Arayüz Yönetim Merkezi

// --- GÜVENLİ SES BAŞLATICI EMÜLATÖRÜ ---
function initAudio() {
    console.log("HiGames Ses Sistemi Aktif.");
}

// Global Canvas ve Context Referansları (Tüm dosyalarda ortak kullanılır)
let canvas, ctx;

// --- 1. GLOBAL PARAMETRELER VE ZORLUK AYARLARI (TURNUVA STANDARTI) ---
const DIFFICULTY_SETTINGS = {
    'EASY':   { startSpeed: 3.5, acceleration: 0.0002, minGap: 200, maxGap: 320 },
    'NORMAL': { startSpeed: 4.5, acceleration: 0.0005, minGap: 160, maxGap: 280 }, 
    'ZOR':    { startSpeed: 5.5, acceleration: 0.0009, minGap: 120, maxGap: 220 }
};

// --- 2. KALICI HAFIZA KONTROLLERİ ---
let highScore = parseInt(localStorage.getItem('nc_highscore')) || 0;
let totalCoins = parseInt(localStorage.getItem('nc_coins')) || 0;

let unlockedItems = JSON.parse(localStorage.getItem('nc_unlocked')) || ['c_classic_#00f2ff', 'd_default'];
let currentCube = localStorage.getItem('nc_currentcube') || 'c_classic_#00f2ff';
let currentDecor = localStorage.getItem('nc_currentdecor') || 'default'; 

let playerShape = 'classic';
let playerColor = '#00f2ff';

function syncPlayerSkin() {
    if (typeof CUBES_DATA !== 'undefined') {
        const activeCube = CUBES_DATA.find(c => c.id === currentCube) || CUBES_DATA[0];
        playerShape = activeCube.type;
        playerColor = activeCube.color;
    }
}

// Ortak durum ve motor değişkenleri
let gameState = 'MENU';
let gameMode = 'INFINITE';
let score = 0;
let matchCoins = 0;
let worldOffset = 0;
let gameSpeed = 4.5;
let loopStarted = false;
let adventureLoopStarted = false; 
let adventureCurrentSpeed = 4.5;

const WALL_LEFT = 35;
const WALL_RIGHT = () => (canvas ? canvas.width : 480) - 35;

function saveGameData() {
    localStorage.setItem('nc_highscore', highScore);
    localStorage.setItem('nc_coins', totalCoins);
    localStorage.setItem('nc_unlocked', JSON.stringify(unlockedItems));
}

// --- 3. OYUNCU (PLAYER) SINIFI VE NESNESİ ---
class GamePlayer {
    constructor() {
        this.size = 24;
        this.init();
    }
    init() {
        this.x = (canvas ? canvas.width : 480) / 2;
        this.y = (canvas ? canvas.height : 800) - 150;
        this.targetX = this.x;
        this.angle = 0;
    }
    update() {
        // Yumuşak dokunmatik takip fiziği
        this.x += (this.targetX - this.x) * 0.25;
        
        // Harekete duyarlı dinamik neon açısı yay efekti
        let diff = this.targetX - this.x;
        this.angle = diff * 0.04;
    }
    draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 15;
        ctx.shadowColor = playerColor;
        ctx.fillStyle = playerColor;
        
        if (playerShape === 'classic') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            // Alternatif küre/yuvarlak tasarımlar için taban çizim motoru
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Global oyuncu tetikleyicisi
const player = new GamePlayer();

// --- 4. HUD ARAYÜZ METİNLERİNİ GÜNCELLEME FONKSİYONU ---
function updateHUD() {
    const scoreDiv = document.getElementById('liveScore');
    const coinsDiv = document.getElementById('liveCoins');
    if (!scoreDiv || !coinsDiv) return;

    if (gameMode === 'INFINITE') {
        scoreDiv.innerText = 'Skor: ' + score;
        coinsDiv.innerText = '🪙 ' + matchCoins;
    } else {
        scoreDiv.innerText = 'Bölüm ' + selectedLevel + ': ' + score + '/' + adventureTargetScore;
        coinsDiv.innerText = '🪙 ' + matchCoins;
    }
}

function updateMenuUI() {
    document.getElementById('menuBest').innerText = 'REKOR: ' + highScore;
    document.getElementById('menuCoins').innerText = 'BAKİYE: 🪙 ' + totalCoins;
    document.getElementById('shopBalance').innerText = 'Bakiye: 🪙 ' + totalCoins;
}

// --- 5. ARKA PLAN DEKOR ÇİZİM MOTORU ---
let matrixY = 0;
function drawDecors() {
    if (!ctx || !canvas) return;
    ctx.save();
    if (currentDecor === 'default') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = (worldOffset % 40); y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    } 
    else if (currentDecor === 'rock') {
        ctx.fillStyle = '#222225';
        ctx.fillRect(0, 0, WALL_LEFT, canvas.height); ctx.fillRect(WALL_RIGHT(), 0, WALL_LEFT, canvas.height);
        ctx.strokeStyle = '#44444a'; ctx.lineWidth = 2;
        for (let y = (worldOffset % 60); y < canvas.height + 60; y += 60) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WALL_LEFT, y - 10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(WALL_RIGHT(), y); ctx.lineTo(canvas.width, y - 10); ctx.stroke();
        }
    } 
    else if (currentDecor === 'cyber') {
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(WALL_LEFT, 0); ctx.lineTo(WALL_LEFT, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(WALL_RIGHT(), 0); ctx.lineTo(WALL_RIGHT(), canvas.height); ctx.stroke(); // DÜZELTME: Kilitlenmeye sebep olan eksik ctx. eklendi
    } 
    else if (currentDecor === 'matrix') {
        ctx.fillStyle = 'rgba(57, 255, 20, 0.15)'; ctx.font = '10px monospace';
        matrixY = (matrixY + 1) % 40;
        for (let x = WALL_LEFT + 10; x < WALL_RIGHT() - 10; x += 30) {
            for (let y = matrixY; y < canvas.height; y += 50) {
                ctx.fillText(Math.random() > 0.5 ? "1" : "0", x, y);
            }
        }
    }
    
    ctx.shadowBlur = 0; ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(WALL_LEFT, 0); ctx.lineTo(WALL_LEFT, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(WALL_RIGHT(), 0); ctx.lineTo(WALL_RIGHT(), canvas.height); ctx.stroke();
    ctx.restore();
}

// --- 6. TAMAMEN DİNAMİK MAĞAZA (SHOP) OLUŞTURMA MOTORU ---
function buildShopGrids() {
    const cubesGrid = document.getElementById('cubesGrid');
    const decorsGrid = document.getElementById('decorsGrid');
    if (!cubesGrid || !decorsGrid) return;
    cubesGrid.innerHTML = ''; decorsGrid.innerHTML = '';

    if (typeof CUBES_DATA !== 'undefined') {
        CUBES_DATA.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('shop-item');
            if (currentCube === item.id) div.classList.add('equipped');
            
            let isUnlocked = unlockedItems.includes(item.id);
            div.innerHTML = `<div style="color:${item.color}; font-size:20px; margin-bottom:5px;">■</div>
                             <div style="color:#fff; font-size:12px; font-weight:bold;">${item.label}</div>
                             <div style="color:#ffd700; font-size:11px; margin-top:4px;">${isUnlocked ? 'KUŞANILDI' : '🪙 ' + item.price}</div>`;
            
            div.addEventListener('click', () => handleShopClick(item, 'CUBE'));
            cubesGrid.appendChild(div);
        });
    }

    if (typeof DECORS_DATA !== 'undefined') {
        DECORS_DATA.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('shop-item');
            if (currentDecor === item.key) div.classList.add('equipped');
            
            let isUnlocked = unlockedItems.includes(item.id);
            div.innerHTML = `<div style="color:#aaa; font-size:12px; font-weight:bold; margin-bottom:5px;">${item.label}</div>
                             <div style="color:#ffd700; font-size:11px; margin-top:4px;">${isUnlocked ? 'KUŞANILDI' : '🪙 ' + item.price}</div>`;
            
            div.addEventListener('click', () => handleShopClick(item, 'DECOR'));
            decorsGrid.appendChild(div);
        });
    }
}

function handleShopClick(item, type) {
    initAudio();
    let isUnlocked = unlockedItems.includes(item.id);
    
    if (isUnlocked) {
        if (type === 'CUBE') {
            currentCube = item.id;
            localStorage.setItem('nc_currentcube', currentCube);
            syncPlayerSkin(); 
        } else {
            currentDecor = item.key; 
            localStorage.setItem('nc_currentdecor', currentDecor);
        }
    } else {
        if (totalCoins >= item.price) {
            totalCoins -= item.price;
            unlockedItems.push(item.id);
            
            if (type === 'CUBE') {
                currentCube = item.id;
                localStorage.setItem('nc_currentcube', currentCube);
                syncPlayerSkin();
            } else {
                currentDecor = item.key;
                localStorage.setItem('nc_currentdecor', currentDecor);
            }
            saveGameData();
        } else {
            alert("Yetersiz Bakiye! Reis biraz daha coin toplaman lazım.");
            return;
        }
    }
    updateMenuUI();
    buildShopGrids();
}

// --- 7. BUTON OLAY DİNLEYİCİLERİ ---
document.getElementById('shopBtn').addEventListener('click', () => {
    initAudio(); updateMenuUI(); buildShopGrids();
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('shopMenu').classList.remove('hidden');
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('shopMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
});

document.getElementById('tabCubes').addEventListener('click', () => {
    document.getElementById('tabCubes').classList.add('active'); document.getElementById('tabDecors').classList.remove('active');
    document.getElementById('cubesGrid').classList.remove('hidden'); document.getElementById('decorsGrid').classList.add('hidden');
});

document.getElementById('tabDecors').addEventListener('click', () => {
    document.getElementById('tabDecors').classList.add('active'); document.getElementById('tabCubes').classList.remove('active');
    document.getElementById('decorsGrid').classList.remove('hidden'); document.getElementById('cubesGrid').classList.add('hidden');
});

// Canvas kararlılığını senkronize etme tetikleyicisi
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.clientWidth || 480;
        canvas.height = canvas.parentElement.clientHeight || 800;
        
        // Parmak/Mouse takip motoru bağlantısı
        const handleMove = (e) => {
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let rect = canvas.getBoundingClientRect();
            let relativeX = clientX - rect.left;
            
            if (relativeX < WALL_LEFT + player.size/2) relativeX = WALL_LEFT + player.size/2;
            if (relativeX > WALL_RIGHT() - player.size/2) relativeX = WALL_RIGHT() - player.size/2;
            player.targetX = relativeX;
        };
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('touchmove', handleMove, { passive: true });
    }
    syncPlayerSkin();
    updateMenuUI();
    updateHUD();
});
