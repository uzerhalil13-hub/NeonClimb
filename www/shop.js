// shop.js - Bağımsız Market Yönetim Modülü

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
    if (typeof initAudio === 'function') initAudio();
    
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
            if (typeof saveGameData === 'function') saveGameData();
            if (category === 'cube') {
                playerColor = product.color;
                playerShape = product.type;
            } else {
                currentDecor = product.key;
            }
        } else {
            alert('Yetersiz Bakiye! 🪙'); 
            return;
        }
    }
    if (typeof saveGameData === 'function') saveGameData(); 
    if (typeof updateMenuUI === 'function') updateMenuUI(); 
    buildShopUI();
}
