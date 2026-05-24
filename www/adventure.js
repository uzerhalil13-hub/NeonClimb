// adventure.js - Bağımsız Macera Modu Seviye ve İlerleme Motoru

let currentLevel = parseInt(localStorage.getItem('nc_currentlevel')) || 1;
let selectedLevel = 1;
let adventureTargetScore = 0;

function saveAdventureData() {
    localStorage.setItem('nc_currentlevel', currentLevel);
}

function buildAdventureUI() {
    const levelGrid = document.getElementById('levelGrid');
    levelGrid.innerHTML = '';

    for (let i = 1; i <= 50; i++) {
        let card = document.createElement('div');
        card.className = 'level-card';

        if (i < currentLevel) {
            card.classList.add('unlocked');
            card.innerText = i;
            card.addEventListener('click', () => startAdventureLevel(i));
        } else if (i === currentLevel) {
            card.classList.add('current');
            card.innerText = i;
            card.addEventListener('click', () => startAdventureLevel(i));
        } else {
            card.classList.add('locked');
            card.innerText = '🔒';
        }
        levelGrid.appendChild(card);
    }
}

function startAdventureLevel(levelNum) {
    selectedLevel = levelNum;
    
    // Bölüm mesafesi (hedef skor) formülü aynen korundu
    adventureTargetScore = 25 + (selectedLevel - 1) * 15;
    
    if (typeof startGame === 'function') {
        // game.js motoruna gidip oyunu başlatır.
        // Hız sıfırlama, ivmelenme ve coin dizilimleri tamamen game.js içinden yönetilir.
        startGame('NORMAL', 'ADVENTURE');
    }
}
