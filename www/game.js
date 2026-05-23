const config = {
    type: Phaser.AUTO,
    width: window.innerWidth > 480 ? 480 : window.innerWidth, 
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

// Oyun Durum Değişkenleri
let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
let player;
let walls;
let towerLines; // Kule içi hareketli çizgiler
let obstacles;
let explosionParticles;
let trailEmitter;

// Skor ve Mekanik Verileri
let score = 0;
let highScore = localStorage.getItem('cyberClimb_v2_highScore') || 0;
let currentWall = 'left';
let isJumping = false;
let gameSpeed = 5;
let patternTimer;

// UI Elemanları
let menuContainer;
let gameOverContainer;
let scoreText;
let liveHighScoreText;

function preload() {}

function create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // ---------------------------------------------------------
    // 1. DOKU ÜRETİMİ (KODLA KALİTELİ VE PARLAK GRAFİKLER)
    // ---------------------------------------------------------
    
    // Karakter: Köşeleri yuvarlatılmış parlayan siber çekirdek
    let pGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    pGraphics.fillStyle(0x00f5ff, 1);
    pGraphics.fillRoundedRect(0, 0, 32, 32, 8);
    pGraphics.lineStyle(2, 0xffffff, 0.8);
    pGraphics.strokeRoundedRect(0, 0, 32, 32, 8);
    pGraphics.generateTexture('playerTex', 32, 32);

    // Engel: Plazma Kırmızı Lazer Dikeni
    let oGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    oGraphics.fillStyle(0xff0055, 1);
    oGraphics.fillTriangle(0, 24, 32, 12, 0, 0); // Duvara yapışık sivri üçgen
    oGraphics.lineStyle(2, 0xff99bb, 0.5);
    oGraphics.strokeTriangle(0, 24, 32, 12, 0, 0);
    oGraphics.generateTexture('obstacleTex', 32, 24);

    // Efekt Parçacığı
    let partGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    partGraphics.fillStyle(0x00f5ff, 0.8);
    partGraphics.fillRect(0, 0, 6, 6);
    partGraphics.generateTexture('partTex', 6, 6);

    // ---------------------------------------------------------
    // 2. ÇEVRE VE SİBER KULE TASARIMI
    // ---------------------------------------------------------
    this.cameras.main.setBackgroundColor('#080511');

    // Kule İçi Enerji Çizgileri (Yukarı tırmanma hissi veren desenler)
    towerLines = this.add.group();
    for (let i = 0; i < 15; i++) {
        let lineY = (height / 15) * i;
        let line = this.add.rectangle(width / 2, lineY, width - 60, 2, 0x1f1a3a).setAlpha(0.3);
        towerLines.add(line);
    }
    
    // Kule Duvarları
    walls = this.physics.add.staticGroup();
    let leftWall = this.add.rectangle(15, height / 2, 30, height, 0x110c24).setStrokeStyle(2, 0x00f5ff);
    let rightWall = this.add.rectangle(width - 15, height / 2, 30, height, 0x110c24).setStrokeStyle(2, 0x00f5ff);
    walls.add(leftWall);
    walls.add(rightWall);

    // ---------------------------------------------------------
    // 3. EFEKT SİSTEMLERİ
    // ---------------------------------------------------------
    explosionParticles = this.add.particles(0, 0, 'partTex', {
        speed: { min: -150, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 500,
        gravityY: 100
    });
    explosionParticles.stop();

    trailEmitter = this.add.particles(0, 0, 'partTex', {
        speed: 0,
        scale: { start: 0.8, end: 0 },
        lifespan: 250,
        frequency: 15,
        blendMode: 'ADD'
    });
    trailEmitter.stop();

    // ---------------------------------------------------------
    // 4. OYUNCU VE FİZİK TANIMLAMALARI
    // ---------------------------------------------------------
    player = this.physics.add.sprite(45, height - 150, 'playerTex');
    player.setCollideWorldBounds(true);
    player.setVisible(false);
    player.body.setAllowGravity(false);
    trailEmitter.startFollow(player);

    obstacles = this.physics.add.group();

    // Çarpışma Kuralları
    this.physics.add.collider(player, walls, () => {
        if (gameState === 'PLAYING') {
            isJumping = false;
            player.setVelocityX(0);
            player.setVelocityY(0);
        }
    });

    this.physics.add.overlap(player, obstacles, () => {
        if (gameState === 'PLAYING') triggerGameOver(this);
    }, null, this);

    // Dokunma Giriş Yönetimi
    this.input.on('pointerdown', (pointer) => {
        handleTap(this, pointer);
    });

    // ---------------------------------------------------------
    // 5. KULLANICI ARAYÜZÜ (UI) VE MENÜLER
    // ---------------------------------------------------------
    
    // Oyun İçi Canlı Skor
    scoreText = this.add.text(width / 2, 60, '0', { fontFamily: 'Orbitron', fontSize: '54px', fontWeight: '900', fill: '#00f5ff' }).setOrigin(0.5).setAlpha(0);
    liveHighScoreText = this.add.text(width / 2, 120, 'BEST: ' + highScore, { fontFamily: 'Orbitron', fontSize: '14px', fill: '#ff0055' }).setOrigin(0.5).setAlpha(0);

    createMainMenu(this, width, height);
    createGameOverMenu(this, width, height);
}

function update() {
    // 1. Kule Çizgilerini Aşağı Kaydır (Tırmanma İllüzyonu)
    if (gameState === 'PLAYING' || gameState === 'MENU') {
        towerLines.getChildren().forEach((line) => {
            line.y += gameState === 'PLAYING' ? gameSpeed : 0.5; // Menüde yavaşça akar
            if (line.y > this.scale.height) {
                line.y = 0;
            }
        });
    }

    // 2. Engellerin Hareketi ve Temizliği
    if (gameState === 'PLAYING') {
        obstacles.getChildren().forEach((obstacle) => {
            obstacle.y += gameSpeed;
            if (obstacle.y > this.scale.height + 50) {
                obstacle.destroy();
                score++;
                scoreText.setText(score);
                if (score % 8 === 0) gameSpeed += 0.4; // Bağımlılık yaratan kademeli hızlanma
            }
        });
    }
}

// ---------------------------------------------------------
// OYUN KONTROL VE AKIŞ FONKSİYONLARI
// ---------------------------------------------------------

function handleTap(scene, pointer) {
    const width = scene.scale.width;

    if (gameState === 'MENU') {
        // Menüdeyken buton alanına tıklandı mı kontrolü yerine basitleştirilmiş UI tetikleyici kullanıyoruz
        return; 
    }

    if (gameState === 'PLAYING' && !isJumping) {
        isJumping = true;
        trailEmitter.start();
        
        if (currentWall === 'left') {
            player.setVelocityX(360);
            player.setVelocityY(-280); // Dengeleyici dikey fırlatma
            player.setFlipX(true); // Engellerin yönüne göre karakter açısı
            currentWall = 'right';
        } else {
            player.setVelocityX(-360);
            player.setVelocityY(-280);
            player.setFlipX(false);
            currentWall = 'left';
        }

        // Akıcı takla animasyonu
        scene.tweens.add({
            targets: player,
            angle: currentWall === 'right' ? 180 : 0,
            duration: 200
        });
    }
}

function startActualGame(scene) {
    gameState = 'PLAYING';
    score = 0;
    gameSpeed = 5;
    currentWall = 'left';
    isJumping = false;
    
    scoreText.setText('0').setAlpha(1);
    liveHighScoreText.setText('BEST: ' + highScore).setAlpha(0.6);
    
    menuContainer.setAlpha(0);
    gameOverContainer.setAlpha(0);
    
    player.setPosition(45, scene.scale.height - 150).setVisible(true).setAngle(0).setFlipX(false);
    player.body.setAllowGravity(false);

    // Belli aralıklarla akıllı engel düzenlerini (Pattern) çağırır
    if (patternTimer) patternTimer.destroy();
    patternTimer = scene.time.addEvent({
        delay: 1600,
        callback: deployObstaclePattern,
        callbackScope: scene,
        loop: true
    });
}

// AKILLI ENGEL DÜZENLERİ (PATTERN SİSTEMİ)
function deployObstaclePattern() {
    const width = this.scale.width;
    const patternType = Phaser.Math.Between(1, 3);

    if (patternType === 1) {
        // Düzen 1: Zikzak Merdiven (Önce sol, biraz yukarısına sağ)
        spawnSingleObstacle(45, -40, false);
        this.time.delayedCall(400, () => { if(gameState === 'PLAYING') spawnSingleObstacle(width - 45, -40, true); });
    } 
    else if (patternType === 2) {
        // Düzen 2: Dar Boğaz (Karşılıklı çift engel, tam ortadan geçiş)
        spawnSingleObstacle(45, -40, false);
        spawnSingleObstacle(width - 45, -40, true);
    } 
    else if (patternType === 3) {
        // Düzen 3: Seri Tuzak (Aynı duvarda alt alta iki adet)
        spawnSingleObstacle(45, -40, false);
        this.time.delayedCall(500, () => { if(gameState === 'PLAYING') spawnSingleObstacle(45, -40, false); });
    }
}

function spawnSingleObstacle(x, y, flip) {
    let obs = obstacles.create(x, y, 'obstacleTex');
    obs.setFlipX(flip);
    obs.body.setAllowGravity(false);
    obs.body.setImmovable(true);
}

function triggerGameOver(scene) {
    gameState = 'GAMEOVER';
    if (patternTimer) patternTimer.destroy();
    
    scene.cameras.main.shake(250, 0.02); // Kaliteli vuruş sarsıntısı
    explosionParticles.emitParticleAt(player.x, player.y, 25); // Parçacık patlaması
    
    player.setVisible(false);
    trailEmitter.stop();
    obstacles.clear(true, true);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cyberClimb_v2_highScore', highScore);
    }

    // Skor arayüzünü gizle, Game Over menüsünü doldur ve getir
    scoreText.setAlpha(0);
    liveHighScoreText.setAlpha(0);
    
    document.getElementById('goScore').innerText = "SKOR: " + score;
    document.getElementById('goBest').innerText = "EN YÜKSEK: " + highScore;
    
    scene.tweens.add({
        targets: gameOverContainer,
        alpha: 1,
        duration: 300
    });
}

// ---------------------------------------------------------
// UI MENÜ OLUŞTURUCULARI (DOM KATMANI DESTEKLİ ŞIK YAPILAR)
// ---------------------------------------------------------

function createMainMenu(scene, width, height) {
    menuContainer = scene.add.container(0, 0);

    let titleText = scene.add.text(width / 2, height * 0.3, 'CYBER\nCLIMB', {
        fontFamily: 'Orbitron', fontSize: '42px', fontWeight: '900', fill: '#00f5ff', align: 'center', lineSpacing: 10
    }).setOrigin(0.5);

    let infoText = scene.add.text(width / 2, height * 0.45, 'Siber Kuleye Tırman', {
        fontFamily: 'Orbitron', fontSize: '14px', fill: '#6c5ce7'
    }).setOrigin(0.5);

    // Parlayan HTML Oyna Butonu
    let startBtn = scene.add.text(width / 2, height * 0.65, 'BAŞLA', {
        fontFamily: 'Orbitron', fontSize: '24px', fontWeight: '700', fill: '#080511',
        backgroundColor: '#00f5ff', padding: { x: 40, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => startActualGame(scene));

    menuContainer.add([titleText, infoText, startBtn]);
}

function createGameOverMenu(scene, width, height) {
    gameOverContainer = scene.add.container(0, 0).setAlpha(0);

    let goTitle = scene.add.text(width / 2, height * 0.25, 'BAĞLANTI\nKESİLDİ', {
        fontFamily: 'Orbitron', fontSize: '36px', fontWeight: '900', fill: '#ff0055', align: 'center'
    }).setOrigin(0.5);

    // Skor Göstergeleri (Dinamik güncelleme için ID bazlı metin nesneleri oluşturuyoruz)
    let scoreDisplay = scene.add.text(width / 2, height * 0.42, 'SKOR: 0', {
        fontFamily: 'Orbitron', fontSize: '22px', fill: '#ffffff'
    }).setOrigin(0.5);
    
    let bestDisplay = scene.add.text(width / 2, height * 0.48, 'EN YÜKSEK: 0', {
        fontFamily: 'Orbitron', fontSize: '16px', fill: '#00f5ff'
    }).setOrigin(0.5);

    // Kodu yönetilebilir kılmak için global nesneye bağlıyoruz
    document.getElementById = (id) => {
        return {
            set jsn(val) {},
            set innerText(text) {
                if (id === 'goScore') scoreDisplay.setText(text);
                if (id === 'goBest') bestDisplay.setText(text);
            }
        };
    };

    let retryBtn = scene.add.text(width / 2, height * 0.65, 'TEKRAR OYNA', {
        fontFamily: 'Orbitron', fontSize: '20px', fontWeight: '700', fill: '#ffffff',
        backgroundColor: '#ff0055', padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => startActualGame(scene));

    gameOverContainer.add([goTitle, scoreDisplay, bestDisplay, retryBtn]);
}
