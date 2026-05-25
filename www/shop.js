// shop.js - Ortak Hafıza, Mağaza Verileri ve Oyuncu Temel Fiziği

// --- 1. SABİT MAĞAZA VERİLERİ (HAFIZADAKİ RENK VE FIYATLAR) ---
const CUBES_DATA = [
    { id: 'c_classic_cyan', label: 'Neon Turkuaz', color: '#00f2ff', type: 'classic', price: 0 },
    { id: 'c_gold', label: 'Saf Altın', color: '#ffd700', type: 'classic', price: 150 },
    { id: 'c_ruby', label: 'Yakut Alevi', color: '#ff0055', type: 'classic', price: 300 },
    { id: 'c_matrix', label: 'Lojik Yeşil', color: '#39ff14', type: 'classic', price: 500 }
];

const DECORS_DATA = [
    { id: 'd_default', key: 'default', label: 'Klasik Izgara', price: 0 },
    { id: 'd_rock', key: 'rock', label: 'Kaya Duvarlar', price: 200 },
    { id: 'd_cyber', key: 'cyber', label: 'Siber Alan', price: 400 },
    { id: 'd_matrix', key: 'matrix', label: 'Kod Yağmuru', price: 600 }
];

// --- 2. GLOBAL MOTOR VE KANVAS TANIMLAMALARI ---
let canvas, ctx;
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let gameMode = 'INFINITE'; // INFINITE, ADVENTURE

// --- 3. PROFIL VE SKOR KAYITLARI ---
let username = localStorage.getItem('nc_username') || 'USER_' + Math.floor(1000 + Math.random() * 9000);
let totalCoins = parseInt(localStorage.getItem('nc_coins')) || 0;
let highScore = parseInt(localStorage.getItem('nc_highscore')) || 0;
let currentLevel = parseInt(localStorage.getItem('nc_currentlevel')) || 1; // Macera kilitli seviye takibi

let unlockedItems = JSON.parse(localStorage.getItem('nc_unlocked')) || ['c_classic_cyan', 'd_default'];
let currentCube = localStorage.getItem('nc_currentcube') || 'c_classic_cyan';
let currentDecor = localStorage.getItem('nc_currentdecor') || 'default';

let playerColor = '#00f2ff';
let playerShape = 'classic';

// Duvar Sabitleri
const WALL_LEFT = 35;
const WALL_RIGHT = () => (canvas ? canvas.width : 480) - 35;

// Oyun İçi Anlık Değişkenler
let score = 0;          // Skorda mesafe/engel puanı tutulur
let matchCoins = 0;     // O anki el toplanan para
let worldOffset = 0;    // Haritanın aşağı kayma pikseli
let gameSpeed = 4.5;    // Anlık oyun hızı
let selectedDifficulty = 'NORMAL'; 
let loopStarted = false;

// Zorluk Katsayı Değerleri (Normal mod için hızlanma formülü)
const DIFFICULTY_SETTINGS = {
    'EASY':   { startSpeed: 3.5, accel: 0.0003 },
    'NORMAL': { startSpeed: 4.5, accel: 0.0007 },
    'ZOR':    { startSpeed: 6.0, accel: 0.0012 }
};

// --- 4. GÜVENLİ VERİ KAYDETME VE SENKRONİZASYON ---
function saveGameData() {
    localStorage.setItem('nc_username', username);
    localStorage.setItem('nc_coins', totalCoins);
    localStorage.setItem('nc_highscore', highScore);
    localStorage.setItem('nc_currentlevel', currentLevel);
    localStorage.setItem('nc_unlocked', JSON.stringify(unlockedItems));
}

function syncPlayerSkin() {
    const active = CUBES_DATA.find(c => c.id === currentCube) || CUBES_DATA[0];
    playerColor = active.color;
    playerShape = active.type;
}

// --- 5. ORTAK FİZİKSEL OYUNCU (PLAYER) SINIFI ---
class GamePlayer {
    constructor() {
        this.size = 24;
        this.side = 'RIGHT'; // Küp oyuna SAĞ duvara yapışık başlar
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
    }
    init() {
        this.side = 'RIGHT';
        this.y = (canvas ? canvas.height : 800) - 180;
        this.x = WALL_RIGHT() - this.size / 2;
        this.targetX = this.x;
    }
    tap() {
        // Her ekrana basışta zıt duvara fırlatır
        if (this.side === 'RIGHT') {
            this.side = 'LEFT';
            this.targetX = WALL_LEFT + this.size / 2;
        } else {
            this.side = 'RIGHT';
            this.targetX = WALL_RIGHT() - this.size / 2;
        }
    }
    update() {
        // Duvardan duvara pürüzsüz jet hızıyla kayma fiziği
        this.x += (this.targetX - this.x) * 0.35;
    }
    draw() {
        if (!ctx) return;
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = playerColor;
        ctx.fillStyle = playerColor;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

const player = new GamePlayer();

// --- 6. ARKA PLAN DEKOR TEMALARI ÇİZİM MOTORU ---
let matrixY = 0;
function drawDecors() {
    if (!ctx || !canvas) return;
    ctx.save();
    
    if (currentDecor === 'default') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'; ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = (worldOffset % 40); y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    } 
    else if (currentDecor === 'rock') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, WALL_LEFT, canvas.height); ctx.fillRect(WALL_RIGHT(), 0, WALL_LEFT, canvas.height);
        ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = 2;
        for (let y = (worldOffset % 50); y < canvas.height + 50; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WALL_LEFT, y - 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(WALL_RIGHT(), y); ctx.lineTo(canvas.width, y - 8); ctx.stroke();
        }
    } 
    else if (currentDecor === 'cyber') {
        ctx.shadowBlur = 8; ctx.shadowColor = '#00f2ff';
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(WALL_LEFT, 0); ctx.lineTo(WALL_LEFT, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(WALL_RIGHT(), 0); ctx.lineTo(WALL_RIGHT(), canvas.height); ctx.stroke();
    } 
    else if (currentDecor === 'matrix') {
        ctx.fillStyle = 'rgba(57, 255, 20, 0.12)'; ctx.font = '11px monospace';
        matrixY = (matrixY + 1) % 40;
        for (let x = WALL_LEFT + 15; x < WALL_RIGHT() - 15; x += 35) {
            for (let y = matrixY; y < canvas.height; y += 60) {
                ctx.fillText(Math.random() > 0.5 ? "1" : "0", x, y);
            }
        }
    }
    
    // Sabit Ana Duvar Hatları
    ctx.shadowBlur = 0; ctx.strokeStyle = '#27272a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(WALL_LEFT, 0); ctx.lineTo(WALL_LEFT, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(WALL_RIGHT(), 0); ctx.lineTo(WALL_RIGHT(), canvas.height); ctx.stroke();
    ctx.restore();
}

// --- 7. ARDIL MAĞAZA OLUŞTURMA MOTORU ---
function buildShopGrids() {
    const cubesGrid = document.getElementById('cubesGrid');
    const decorsGrid = document.getElementById('decorsGrid');
    if (!cubesGrid || !decorsGrid) return;
    cubesGrid.innerHTML = ''; decorsGrid.innerHTML = '';

    CUBES_DATA.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('shop-item');
        if (currentCube === item.id) div.classList.add('equipped');
        let unlocked = unlockedItems.includes(item.id);
        div.innerHTML = `<div style="color:${item.color}; font-size:24px; margin-bottom:5px;">■</div>
                         <div style="color:#fff; font-size:12px; font-weight:bold;">${item.label}</div>
                         <div style="color:#ffd700; font-size:11px; margin-top:5px;">${unlocked ? (currentCube === item.id ? 'KUŞANILDI' : 'SEÇ') : '🪙 ' + item.price}</div>`;
        div.addEventListener('click', () => handleShopPurchase(item, 'CUBE'));
        cubesGrid.appendChild(div);
    });

    DECORS_DATA.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('shop-item');
        if (currentDecor === item.key) div.classList.add('equipped');
        let unlocked = unlockedItems.includes(item.id);
        div.innerHTML = `<div style="color:#888; font-size:12px; font-weight:bold; margin-bottom:8px;">${item.label}</div>
                         <div style="color:#ffd700; font-size:11px;">${unlocked ? (currentDecor === item.key ? 'KUŞANILDI' : 'SEÇ') : '🪙 ' + item.price}</div>`;
        div.addEventListener('click', () => handleShopPurchase(item, 'DECOR'));
        decorsGrid.appendChild(div);
    });
}

function handleShopPurchase(item, type) {
    let isUnlocked = unlockedItems.includes(item.id);
    if (isUnlocked) {
        if (type === 'CUBE') { currentCube = item.id; localStorage.setItem('nc_currentcube', currentCube); syncPlayerSkin(); }
        else { currentDecor = item.key; localStorage.setItem('nc_currentdecor', currentDecor); }
    } else {
        if (totalCoins >= item.price) {
            totalCoins -= item.price;
            unlockedItems.push(item.id);
            if (type === 'CUBE') { currentCube = item.id; localStorage.setItem('nc_currentcube', currentCube); syncPlayerSkin(); }
            else { currentDecor = item.key; localStorage.setItem('nc_currentdecor', currentDecor); }
            saveGameData();
        } else {
            alert("Yetersiz Bakiye! Reis biraz normal modda kasıl.");
            return;
        }
    }
    updateMenuUI(); buildShopGrids();
}

function updateMenuUI() {
    document.getElementById('menuUser').innerText = username;
    document.getElementById('usernameInput').value = username;
    document.getElementById('menuCoins').innerText = '🪙 ' + totalCoins;
    document.getElementById('shopBalance').innerText = 'Bakiye: 🪙 ' + totalCoins;
    document.getElementById('menuBest').innerText = 'EN YÜKSEK SKOR: ' + highScore;
}

// Başlangıç Yüklemesi
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = 480; canvas.height = 800;
    }
    syncPlayerSkin(); updateMenuUI();
});
