// ========== CANVAS AYARLARI ==========
const canvas = document.getElementById('savasAlani');
const ctx = canvas.getContext('2d');
let canvasWidth, canvasHeight;

function canvasBoyutlandir() {
    canvasWidth = canvas.clientWidth;
    canvasHeight = canvas.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}
canvasBoyutlandir();
window.addEventListener('resize', canvasBoyutlandir);

// ========== OYUN DEĞİŞKENLERİ ==========
let oyun = {
    aktif: true,
    baslangicZamani: Date.now(),
    sure: 0,
    isabetSayisi: 0,
    atesSayisi: 0,
    vurusSayisi: 0,
    savunmaSayisi: 0
};

// ========== PLAYER TANKI (SEN!) ==========
let player = {
    x: 150,
    y: 300,
    genislik: 50,
    yukseklik: 40,
    can: 100,
    maxCan: 100,
    enerji: 100,
    maxEnerji: 100,
    hiz: 6,
    mermiHizi: 10,
    mermiHasar: 15,
    atesHizi: 10,
    atesGecikme: 0,
    siperAktif: false,
    siperSuresi: 0,
    ozelHazir: true,
    ozelBekleme: 0,
    yon: 'sag'
};

// ========== BOT TANKI (X-9000 - GERÇEK BOT!) ==========
let bot = {
    x: 1200,
    y: 300,
    genislik: 50,
    yukseklik: 40,
    can: 100,
    maxCan: 100,
    hiz: 3.5,
    mermiHizi: 8,
    mermiHasar: 12,
    atesHizi: 15,
    atesGecikme: 0,
    zekaSeviyesi: 'PRO',
    saldirganlik: 0.8,
    savunmaModu: false,
    hedefX: 150,
    hedefY: 300,
    yon: 'sol'
};

// ========== MERMİLER ==========
let mermiler = [];
let botMermileri = [];

// ========== EFEKTLER ==========
let patlamalar = [];
let savunmaAlanlari = [];

// ========== KONTROLLER ==========
let tuslar = {
    w: false, a: false, s: false, d: false,
    space: false, q: false, e: false
};

// ========== OYUNU BAŞLAT ==========
function oyunuBaslat() {
    player = {
        ...player,
        x: 150,
        y: canvasHeight / 2,
        can: 100,
        enerji: 100,
        siperAktif: false,
        ozelHazir: true
    };
    
    bot = {
        ...bot,
        x: canvasWidth - 200,
        y: canvasHeight / 2,
        can: 100,
        savunmaModu: false
    };
    
    mermiler = [];
    botMermileri = [];
    patlamalar = [];
    savunmaAlanlari = [];
    
    oyun = {
        aktif: true,
        baslangicZamani: Date.now(),
        sure: 0,
        isabetSayisi: 0,
        atesSayisi: 0,
        vurusSayisi: 0,
        savunmaSayisi: 0
    };
    
    document.getElementById('playerCan').textContent = player.can;
    document.getElementById('botCan').textContent = bot.can;
    document.getElementById('playerEnerji').textContent = player.enerji;
    document.getElementById('oyunSonu').style.display = 'none';
    
    bildirimGoster('⚔️ SAVAŞ BAŞLADI! ⚔️', 2000);
}

// ========== BİLDİRİM ==========
function bildirimGoster(mesaj, sure = 1500) {
    const bildirim = document.getElementById('savasBildirim');
    bildirim.textContent = mesaj;
    bildirim.style.opacity = '1';
    
    setTimeout(() => {
        bildirim.style.opacity = '0';
    }, sure);
}

// ========== BOT YAPAY ZEKASI (GERÇEK BOT!) ==========
function botAI() {
    if (!oyun.aktif || bot.can <= 0) return;
    
    // HEDEF TAKİBİ - Bot seni takip eder!
    bot.hedefX = player.x;
    bot.hedefY = player.y;
    
    // MESAFE HESAPLA
    const mesafeX = bot.x - player.x;
    const mesafeY = bot.y - player.y;
    const mesafe = Math.sqrt(mesafeX * mesafeX + mesafeY * mesafeY);
    
    // SAVUNMA MODU - Canı azalınca kaçar!
    if (bot.can < 30) {
        bot.savunmaModu = true;
        // Geri çekil!
        if (bot.x < canvasWidth - 100) bot.x += bot.hiz * 1.5;
        if (bot.y > player.y + 50) bot.y -= bot.hiz;
        if (bot.y < player.y - 50) bot.y += bot.hiz;
    } else {
        bot.savunmaModu = false;
        // SALDIRI MODU - Yaklaş ve yok et!
        if (mesafe > 300) {
            // Yaklaş
            if (bot.x > player.x + 50) bot.x -= bot.hiz;
            if (bot.y > player.y + 30) bot.y -= bot.hiz;
            if (bot.y < player.y - 30) bot.y += bot.hiz;
        } else if (mesafe < 200) {
            // Uzaklaş biraz
            if (bot.x < canvasWidth - 100) bot.x += bot.hiz;
        }
    }
    
    // SINIRLAR
    bot.x = Math.max(canvasWidth - 400, Math.min(canvasWidth - 100, bot.x));
    bot.y = Math.max(50, Math.min(canvasHeight - 80, bot.y));
    
    // BOT YÖNÜNÜ BELİRLE
    if (bot.x > player.x) bot.yon = 'sol';
    else bot.yon = 'sag';
    
    // AKILLI ATEŞ!
    bot.atesGecikme--;
    if (bot.atesGecikme <= 0 && oyun.aktif) {
        let atesEt = false;
        
        // Hedef görüş hattında mı?
        if (Math.abs(bot.y - player.y) < 50) {
            // Yatay hizada, direkt ateş!
            atesEt = true;
            bot.atesGecikme = bot.atesHizi;
        } else if (mesafe < 400) {
            // Yakın mesafe, ateş et!
            atesEt = Math.random() < 0.7;
            bot.atesGecikme = bot.atesHizi - 5;
        }
        
        // Canı azaldıkça daha agresif!
        if (bot.can < 50) {
            atesEt = atesEt || Math.random() < 0.9;
            bot.atesGecikme = bot.atesHizi - 8;
        }
        
        if (atesEt) {
            // Biraz sapma ekle (gerçekçilik)
            const sapma = (Math.random() - 0.5) * 20;
            
            botMermileri.push({
                x: bot.x - 10,
                y: bot.y + bot.yukseklik/2 - 3 + sapma,
                genislik: 15,
                yukseklik: 6,
                hiz: -bot.mermiHizi,
                hasar: bot.savunmaModu ? bot.mermiHasar * 0.7 : bot.mermiHasar
            });
        }
    }
}

// ========== PLAYER ATEŞ ==========
function playerAtes() {
    if (!oyun.aktif || player.atesGecikme > 0) return;
    
    player.atesGecikme = player.atesHizi;
    oyun.atesSayisi++;
    
    // Özel yetenek aktif mi?
    if (player.ozelHazir && tuslar.e) {
        // 3'lü ateş!
        mermiler.push({
            x: player.x + player.genislik,
            y: player.y + player.yukseklik/2 - 15,
            genislik: 20,
            yukseklik: 6,
            hiz: player.mermiHizi + 2,
            hasar: player.mermiHasar * 1.5
        });
        mermiler.push({
            x: player.x + player.genislik,
            y: player.y + player.yukseklik/2,
            genislik: 20,
            yukseklik: 6,
            hiz: player.mermiHizi + 2,
            hasar: player.mermiHasar * 1.5
        });
        mermiler.push({
            x: player.x + player.genislik,
            y: player.y + player.yukseklik/2 + 15,
            genislik: 20,
            yukseklik: 6,
            hiz: player.mermiHizi + 2,
            hasar: player.mermiHasar * 1.5
        });
        
        player.ozelHazir = false;
        player.ozelBekleme = 300;
        bildirimGoster('💥 ÖZEL ATEŞ! 💥', 1000);
    } else {
        // Normal ateş
        mermiler.push({
            x: player.x + player.genislik,
            y: player.y + player.yukseklik/2 - 3,
            genislik: 18,
            yukseklik: 6,
            hiz: player.mermiHizi,
            hasar: player.siperAktif ? player.mermiHasar * 1.2 : player.mermiHasar
        });
    }
}

// ========== SİPER KULLAN ==========
function siperKullan() {
    if (!oyun.aktif || player.enerji < 30) return;
    
    player.siperAktif = true;
    player.siperSuresi = 100;
    player.enerji -= 30;
    oyun.savunmaSayisi++;
    
    savunmaAlanlari.push({
        x: player.x,
        y: player.y,
        sure: 50
    });
    
    document.getElementById('playerEnerji').textContent = player.enerji;
    bildirimGoster('🛡️ SİPER AKTİF! 🛡️', 800);
}

// ========== ÇARPIŞMA KONTROL ==========
function carpismaKontrol(rect1, rect2) {
    return rect1.x < rect2.x + rect2.genislik &&
           rect1.x + rect1.genislik > rect2.x &&
           rect1.y < rect2.y + rect2.yukseklik &&
           rect1.y + rect1.yukseklik > rect2.y;
}

// ========== PATLAMA EKLE ==========
function patlamaEkle(x, y, buyuk = false) {
    patlamalar.push({
        x: x,
        y: y,
        animasyon: 0,
        maxAnimasyon: 20,
        buyuk: buyuk
    });
}

// ========== OYUN GÜNCELLEME ==========
function guncelle() {
    if (!oyun.aktif) return;
    
    // ===== PLAYER HAREKET =====
    if (tuslar.w && player.y > 10) player.y -= player.hiz;
    if (tuslar.s && player.y < canvasHeight - player.yukseklik - 10) player.y += player.hiz;
    if (tuslar.a && player.x > 10) player.x -= player.hiz;
    if (tuslar.d && player.x < canvasWidth / 2) player.x += player.hiz;
    
    // Yön belirle
    if (tuslar.d) player.yon = 'sag';
    if (tuslar.a) player.yon = 'sol';
    if (tuslar.w) player.yon = 'yukari';
    if (tuslar.s) player.yon = 'asagi';
    
    // ===== ATEŞ =====
    player.atesGecikme--;
    if (tuslar.space) playerAtes();
    
    // ===== SİPER =====
    if (tuslar.q && player.enerji >= 30) siperKullan();
    
    // ===== ÖZEL YETEK BEKLEME =====
    if (!player.ozelHazir) {
        player.ozelBekleme--;
        if (player.ozelBekleme <= 0) {
            player.ozelHazir = true;
            bildirimGoster('✨ ÖZEL YETEK HAZIR! ✨', 1500);
        }
    }
    
    // ===== SİPER SÜRESİ =====
    if (player.siperAktif) {
        player.siperSuresi--;
        if (player.siperSuresi <= 0) {
            player.siperAktif = false;
        }
    }
    
    // ===== ENERJİ YENİLENME =====
    if (player.enerji < player.maxEnerji) {
        player.enerji += 0.2;
        document.getElementById('playerEnerji').textContent = Math.floor(player.enerji);
    }
    
    // ===== BOT AI =====
    botAI();
    
    // ===== MERMİ HAREKETİ =====
    mermiler = mermiler.filter(m => {
        m.x += m.hiz;
        return m.x < canvasWidth + 50;
    });
    
    botMermileri = botMermileri.filter(m => {
        m.x += m.hiz;
        return m.x > -50;
    });
    
    // ===== MERMİ-BOT ÇARPIŞMA =====
    mermiler.forEach(mermi => {
        if (carpismaKontrol(mermi, bot) && bot.can > 0) {
            bot.can -= mermi.hasar;
            oyun.vurusSayisi++;
            oyun.isabetSayisi++;
            patlamaEkle(bot.x + bot.genislik/2, bot.y + bot.yukseklik/2);
            
            document.getElementById('botCan').textContent = Math.max(0, Math.floor(bot.can));
            document.getElementById('botHealth').style.width = (bot.can / bot.maxCan * 100) + '%';
            document.getElementById('vurusSayac').textContent = oyun.vurusSayisi;
            document.getElementById('isabetSayac').textContent = oyun.isabetSayisi;
            
            // Mermiyi kaldır
            mermiler = mermiler.filter(m => m !== mermi);
            
            if (bot.can <= 0) {
                bot.can = 0;
                oyun.aktif = false;
                oyunBitir('kazandin');
            }
        }
    });
    
    // ===== BOT MERMİSİ-PLAYER ÇARPIŞMA =====
    botMermileri.forEach(mermi => {
        let hasarAl = true;
        
        // Siper kontrolü
        if (player.siperAktif) {
            hasarAl = Math.random() < 0.5;
        }
        
        if (carpismaKontrol(mermi, player) && hasarAl) {
            player.can -= mermi.hasar;
            patlamaEkle(player.x + player.genislik/2, player.y + player.yukseklik/2, false);
            
            document.getElementById('playerCan').textContent = Math.max(0, Math.floor(player.can));
            document.getElementById('playerHealth').style.width = (player.can / player.maxCan * 100) + '%';
            
            botMermileri = botMermileri.filter(m => m !== mermi);
            
            if (player.can <= 0) {
                player.can = 0;
                oyun.aktif = false;
                oyunBitir('kaybettin');
            }
        }
    });
    
    // ===== PATLAMA ANİMASYON =====
    patlamalar = patlamalar.filter(p => {
        p.animasyon++;
        return p.animasyon < p.maxAnimasyon;
    });
    
    // ===== SAVUNMA ALANI =====
    savunmaAlanlari = savunmaAlanlari.filter(s => {
        s.sure--;
        return s.sure > 0;
    });
    
    // ===== OYUN SÜRESİ =====
    oyun.sure = Math.floor((Date.now() - oyun.baslangicZamani) / 1000);
}

// ========== ÇİZİM ==========
function ciz() {
    // Temizle
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // ===== ARKAPLAN =====
    // Zemin
    ctx.fillStyle = '#1e3a2a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Grid
    ctx.strokeStyle = '#2a5a3a';
    ctx.lineWidth = 0.5;
    for(let i = 0; i < canvasWidth; i += 70) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvasHeight);
        ctx.stroke();
    }
    for(let i = 0; i < canvasHeight; i += 70) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvasWidth, i);
        ctx.stroke();
    }
    
    // ===== ORTA ÇİZGİ =====
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvasWidth/2, 0);
    ctx.lineTo(canvasWidth/2, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // ===== SAVUNMA ALANI =====
    savunmaAlanlari.forEach(s => {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(s.x + player.genislik/2, s.y + player.yukseklik/2, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x + player.genislik/2, s.y + player.yukseklik/2, 60, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // ===== PLAYER TANKI =====
    // Ana gövde
    ctx.fillStyle = '#4a9a7a';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#2a6a4a';
    ctx.fillRect(player.x, player.y, player.genislik, player.yukseklik);
    
    // Taret
    ctx.fillStyle = '#2a6a4a';
    ctx.fillRect(player.x + 30, player.y - 5, 15, player.yukseklik + 10);
    
    // Top
    ctx.fillStyle = '#c44a4a';
    if (player.yon === 'sag') {
        ctx.fillRect(player.x + 45, player.y + player.yukseklik/2 - 5, 20, 10);
    } else if (player.yon === 'sol') {
        ctx.fillRect(player.x - 20, player.y + player.yukseklik/2 - 5, 20, 10);
    } else if (player.yon === 'yukari') {
        ctx.fillRect(player.x + player.genislik/2 - 5, player.y - 20, 10, 20);
    } else if (player.yon === 'asagi') {
        ctx.fillRect(player.x + player.genislik/2 - 5, player.y + player.yukseklik, 10, 20);
    }
    
    // Kule
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(player.x + 38, player.y + player.yukseklik/2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Siper aktif işareti
    if (player.siperAktif) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(player.x + player.genislik/2, player.y + player.yukseklik/2, 40, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // ===== BOT TANKI =====
    ctx.shadowColor = '#8a2a2a';
    ctx.fillStyle = '#c44a4a';
    ctx.fillRect(bot.x, bot.y, bot.genislik, bot.yukseklik);
    
    ctx.fillStyle = '#8a2a2a';
    ctx.fillRect(bot.x - 15, bot.y + bot.yukseklik/2 - 7, 20, 14);
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bot.x - 20, bot.y + bot.yukseklik/2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(bot.x - 20, bot.y + bot.yukseklik/2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Bot savunma modu
    if (bot.savunmaModu) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(bot.x - bot.genislik/2, bot.y + bot.yukseklik/2, 50, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
    
    // ===== MERMİLER =====
    mermiler.forEach(m => {
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffaa00';
        ctx.fillRect(m.x, m.y, m.genislik, m.yukseklik);
    });
    
    botMermileri.forEach(m => {
        ctx.fillStyle = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        ctx.fillRect(m.x, m.y, m.genislik, m.yukseklik);
    });
    
    // ===== PATLAMALAR =====
    patlamalar.forEach(p => {
        const opacity = 1 - (p.animasyon / p.maxAnimasyon);
        const radius = p.buyuk ? 30 : 20;
        
        ctx.fillStyle = `rgba(255, 100, 0, ${opacity})`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff5500';
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * (1 - p.animasyon / p.maxAnimasyon), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 200, 0, ${opacity})`;
        ctx.beginPath();
        ctx.arc(p.x - 5, p.y - 5, radius/2 * (1 - p.animasyon / p.maxAnimasyon), 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.shadowBlur = 0;
}

// ========== OYUN BİTİR ==========
function oyunBitir(sonuc) {
    oyun.aktif = false;
    
    const sonucMesaji = document.getElementById('sonucMesaji');
    const isabetOrani = document.getElementById('isabetOrani');
    const toplamVurus = document.getElementById('toplamVurus');
    const savasSuresi = document.getElementById('savasSuresi');
    
    toplamVurus.textContent = oyun.vurusSayisi;
    savasSuresi.textContent = oyun.sure;
    
    const isabetYuzde = oyun.atesSayisi > 0 
        ? Math.floor((oyun.isabetSayisi / oyun.atesSayisi) * 100) 
        : 0;
    isabetOrani.textContent = isabetYuzde;
    
    if (sonuc === 'kazandin') {
        sonucMesaji.textContent = '🏆 ZAFER! 🏆';
        sonucMesaji.style.color = 'gold';
        bildirimGoster('🎉 BOTU YENDİN! 🎉', 3000);
    } else {
        sonucMesaji.textContent = '💀 YENİLDİN 💀';
        sonucMesaji.style.color = '#ff4444';
        bildirimGoster('🤖 BOT KAZANDI! 🤖', 3000);
    }
    
    document.getElementById('oyunSonu').style.display = 'flex';
}

// ========== EVENT LİSTENER'LAR ==========
window.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.key === ' ') tuslar.space = true;
    if (e.key === 'w' || e.key === 'W') tuslar.w = true;
    if (e.key === 'a' || e.key === 'A') tuslar.a = true;
    if (e.key === 's' || e.key === 'S') tuslar.s = true;
    if (e.key === 'd' || e.key === 'D') tuslar.d = true;
    if (e.key === 'q' || e.key === 'Q') tuslar.q = true;
    if (e.key === 'e' || e.key === 'E') tuslar.e = true;
});

window.addEventListener('keyup', (e) => {
    e.preventDefault();
    if (e.key === ' ') tuslar.space = false;
    if (e.key === 'w' || e.key === 'W') tuslar.w = false;
    if (e.key === 'a' || e.key === 'A') tuslar.a = false;
    if (e.key === 's' || e.key === 'S') tuslar.s = false;
    if (e.key === 'd' || e.key === 'D') tuslar.d = false;
    if (e.key === 'q' || e.key === 'Q') tuslar.q = false;
    if (e.key === 'e' || e.key === 'E') tuslar.e = false;
});

// ========== MOBİL KONTROLLER ==========
function mobilKontrolEkle() {
    const yukari = document.getElementById('mobYukari');
    const asagi = document.getElementById('mobAsagi');
    const sol = document.getElementById('mobSol');
    const sag = document.getElementById('mobSag');
    const ates = document.getElementById('mobAtes');
    const siper = document.getElementById('mobSiper');
    const ozel = document.getElementById('mobOzel');
    
    if (yukari) {
        yukari.addEventListener('touchstart', (e) => { e.preventDefault(); tuslar.w = true; });
        yukari.addEventListener('touchend', (e) => { e.preventDefault(); tuslar.w = false; });
        yukari.addEventListener('mousedown', (e) => { e.preventDefault(); tuslar.w = true; });
        yukari.addEventListener('mouseup', (e) => { e.preventDefault(); tuslar.w = false; });
    }
    
    if (asagi) {
        asagi.addEventListener('touchstart', (e) => { e.preventDefault(); tuslar.s = true; });
        asagi.addEventListener('touchend', (e) => { e.preventDefault(); tuslar.s = false; });
        asagi.addEventListener('mousedown', (e) => { e.preventDefault(); tuslar.s = true; });
        asagi.addEventListener('mouseup', (e) => { e.preventDefault(); tuslar.s = false; });
    }
    
    if (sol) {
        sol.addEventListener('touchstart', (e) => { e.preventDefault(); tuslar.a = true; });
        sol.addEventListener('touchend', (e) => { e.preventDefault(); tuslar.a = false; });
        sol.addEventListener('mousedown', (e) => { e.preventDefault(); tuslar.a = true; });
        sol.addEventListener('mouseup', (e) => { e.preventDefault(); tuslar.a = false; });
    }
    
    if (sag) {
        sag.addEventListener('touchstart', (e) => { e.preventDefault(); tuslar.d = true; });
        sag.addEventListener('touchend', (e) => { e.preventDefault(); tuslar.d = false; });
        sag.addEventListener('mousedown', (e) => { e.preventDefault(); tuslar.d = true; });
        sag.addEventListener('mouseup', (e) => { e.preventDefault(); tuslar.d = false; });
    }
    
    if (ates) {
        ates.addEventListener('touchstart', (e) => { e.preventDefault(); playerAtes(); });
        ates.addEventListener('mousedown', (e) => { e.preventDefault(); playerAtes(); });
    }
    
    if (siper) {
        siper.addEventListener('touchstart', (e) => { e.preventDefault(); siperKullan(); });
        siper.addEventListener('mousedown', (e) => { e.preventDefault(); siperKullan(); });
    }
    
    if (ozel) {
        ozel.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            tuslar.e = true;
            playerAtes();
            setTimeout(() => tuslar.e = false, 100);
        });
        ozel.addEventListener('mousedown', (e) => { 
            e.preventDefault(); 
            tuslar.e = true;
            playerAtes();
            setTimeout(() => tuslar.e = false, 100);
        });
    }
}

// ========== BUTON EVENTLERİ ==========
document.getElementById('tekrarSavas').addEventListener('click', oyunuBaslat);
document.getElementById('anaMenu').addEventListener('click', oyunuBaslat);

// ========== OYUNU BAŞLAT ==========
window.addEventListener('load', () => {
    canvasBoyutlandir();
    mobilKontrolEkle();
    oyunuBaslat();
    
    // Oyun döngüsü
    function oyunDongusu() {
        if (oyun.aktif) guncelle();
        ciz();
        requestAnimationFrame(oyunDongusu);
    }
    oyunDongusu();
});