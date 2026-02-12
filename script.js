// ========== CANVAS AYARLARI ==========
const canvas = document.getElementById('oyunAlani');
const ctx = canvas.getContext('2d');
const skorElement = document.getElementById('skor');
const canElement = document.getElementById('can');
const oldurmeElement = document.getElementById('oldurme');
const bildirim = document.getElementById('bildirim');

// ========== OYUN DEĞİŞKENLERİ ==========
let oyun = {
    aktif: true,
    duraklatildi: false,
    skor: 0,
    can: 5,
    oldurme: 0,
    zaman: 0,
    ses: true
};

let tank = {
    x: 100,
    y: 0,
    genislik: 45,
    yukseklik: 35,
    hiz: 5,
    ozelYetekHazir: true,
    ozelYetekBekleme: 0,
    yon: 'sag'
};

let dusmanlar = [];
let mermiler = [];
let dusmanMermileri = [];
let patlamalar = [];
let powerUps = []; // İsim düzeltildi: powerUp'lar -> powerUps

// Canvas boyutlarını tam ekran yap
function canvasBoyutlandir() {
    const container = document.querySelector('.oyun-alani-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    
    if (tank) {
        tank.y = canvas.height / 2;
    }
}

window.addEventListener('resize', canvasBoyutlandir);
canvasBoyutlandir();

// ========== KONTROLLER ==========
let tuslar = {
    w: false, a: false, s: false, d: false,
    space: false, p: false
};

// ========== OYUN BAŞLANGICI ==========
function oyunuBaslat() {
    oyun = {
        aktif: true,
        duraklatildi: false,
        skor: 0,
        can: 5,
        oldurme: 0,
        zaman: 0,
        ses: true
    };
    
    tank.x = 100;
    tank.y = canvas.height / 2;
    tank.ozelYetekHazir = true;
    tank.ozelYetekBekleme = 0;
    tank.yon = 'sag';
    
    dusmanlar = [];
    mermiler = [];
    dusmanMermileri = [];
    patlamalar = [];
    powerUps = [];
    
    if (skorElement) skorElement.textContent = oyun.skor;
    if (canElement) canElement.textContent = oyun.can;
    if (oldurmeElement) oldurmeElement.textContent = oyun.oldurme;
    
    document.getElementById('oyunSonuMenu').style.display = 'none';
    document.getElementById('duraklatMenu').style.display = 'none';
    
    bildirimGoster('⚡ SAVAŞ BAŞLADI! ⚡', 2000);
}

function bildirimGoster(mesaj, sure = 1500) {
    if (!bildirim) return;
    bildirim.textContent = mesaj;
    bildirim.style.opacity = '1';
    bildirim.style.animation = 'bildirimGir 0.3s';
    
    setTimeout(() => {
        bildirim.style.opacity = '0';
    }, sure);
}

// ========== DÜŞMAN VE MERMİ SİSTEMLERİ ==========
function dusmanOlustur() {
    if (!oyun.aktif || oyun.duraklatildi) return;
    
    const dusmanTipi = Math.floor(Math.random() * 3);
    let dusman;
    
    const baslangicX = canvas.width + 50;
    const baslangicY = Math.random() * (canvas.height - 60) + 30;

    switch(dusmanTipi) {
        case 0:
            dusman = { x: baslangicX, y: baslangicY, genislik: 40, yukseklik: 35, hiz: 1.5 + Math.random() * 1.5, can: 1, tip: 'normal', atesHizi: 0.01, puan: 10 };
            break;
        case 1:
            dusman = { x: baslangicX, y: baslangicY, genislik: 35, yukseklik: 30, hiz: 2.5 + Math.random() * 2, can: 1, tip: 'hizli', atesHizi: 0.02, puan: 15 };
            break;
        case 2:
            dusman = { x: baslangicX, y: baslangicY, genislik: 50, yukseklik: 45, hiz: 0.8 + Math.random(), can: 3, tip: 'tank', atesHizi: 0.03, puan: 30 };
            break;
    }
    dusmanlar.push(dusman);
}

function mermiEkle() {
    if (!oyun.aktif || oyun.duraklatildi) return;
    mermiler.push({
        x: tank.x + tank.genislik,
        y: tank.y + tank.yukseklik / 2 - 2,
        genislik: 18,
        yukseklik: 5,
        hiz: 9,
        hasar: 1
    });
}

function ozelYetekKullan() {
    if (!oyun.aktif || oyun.duraklatildi || !tank.ozelYetekHazir) return;
    
    for(let i = -1; i <= 1; i++) {
        mermiler.push({
            x: tank.x + tank.genislik,
            y: (tank.y + tank.yukseklik / 2) + (i * 10),
            genislik: 20,
            yukseklik: 6,
            hiz: 10,
            hasar: 2
        });
    }
    
    tank.ozelYetekHazir = false;
    tank.ozelYetekBekleme = 300;
    bildirimGoster('💥 ÖZEL YETEK KULLANILDI! 💥', 1000);
}

function dusmanMermiEkle(dusman) {
    dusmanMermileri.push({
        x: dusman.x - 5,
        y: dusman.y + dusman.yukseklik / 2 - 2,
        genislik: 12,
        yukseklik: 4,
        hiz: -5,
        hasar: 1
    });
}

function patlamaEkle(x, y, buyukluk = 'normal') {
    patlamalar.push({ x, y, buyukluk, animasyon: 0, maxAnimasyon: 20 });
}

function powerUpEkle(x, y) {
    if (Math.random() < 0.3) {
        powerUps.push({
            x: x,
            y: y,
            tip: Math.random() < 0.5 ? 'can' : 'ozel',
            genislik: 25,
            yukseklik: 25,
            animasyon: 0
        });
    }
}

function carpismaKontrol(rect1, rect2) {
    return rect1.x < rect2.x + (rect2.genislik || 0) &&
           rect1.x + (rect1.genislik || 0) > rect2.x &&
           rect1.y < rect2.y + (rect2.yukseklik || 0) &&
           rect1.y + (rect1.yukseklik || 0) > rect2.y;
}

function oyunBitir(durum) {
    oyun.aktif = false;
    const sonucBaslik = document.getElementById('sonucBaslik');
    document.getElementById('sonSkor').textContent = oyun.skor;
    document.getElementById('sonOldurme').textContent = oyun.oldurme;
    document.getElementById('sonSure').textContent = Math.floor(oyun.zaman / 60);
    
    sonucBaslik.textContent = durum === 'zafer' ? '🎉 ZAFER! 🎉' : '💀 YENİLDİN 💀';
    document.getElementById('oyunSonuMenu').style.display = 'flex';
}

// ========== GÜNCELLEME VE ÇİZİM ==========
function guncelle() {
    if (!oyun.aktif || oyun.duraklatildi) return;
    oyun.zaman++;

    // Tank Hareket
    if (tuslar.w && tank.y > 5) tank.y -= tank.hiz;
    if (tuslar.s && tank.y < canvas.height - tank.yukseklik - 5) tank.y += tank.hiz;
    if (tuslar.a && tank.x > 5) tank.x -= tank.hiz;
    if (tuslar.d && tank.x < canvas.width / 1.5) tank.x += tank.hiz;

    if (!tank.ozelYetekHazir) {
        tank.ozelYetekBekleme--;
        if (tank.ozelYetekBekleme <= 0) {
            tank.ozelYetekHazir = true;
            bildirimGoster('✨ ÖZEL YETEK HAZIR! ✨', 1500);
        }
    }

    mermiler = mermiler.filter(m => {
        m.x += m.hiz;
        return m.x < canvas.width + 50;
    });

    dusmanMermileri = dusmanMermileri.filter(m => {
        m.x += m.hiz;
        return m.x > -50;
    });

    dusmanlar = dusmanlar.filter(dusman => {
        dusman.x -= dusman.hiz;
        if (Math.random() < dusman.atesHizi) dusmanMermiEkle(dusman);
        
        // Mermi-Düşman Çarpışması
        let yasiyor = true;
        mermiler.forEach((mermi, mIndex) => {
            if (carpismaKontrol(mermi, dusman)) {
                dusman.can -= mermi.hasar;
                mermiler.splice(mIndex, 1);
                if (dusman.can <= 0) {
                    oyun.skor += dusman.puan;
                    oyun.oldurme++;
                    skorElement.textContent = oyun.skor;
                    oldurmeElement.textContent = oyun.oldurme;
                    patlamaEkle(dusman.x, dusman.y, 'buyuk');
                    powerUpEkle(dusman.x, dusman.y);
                    yasiyor = false;
                }
            }
        });
        return yasiyor && dusman.x > -100;
    });

    // Çarpışmalar (Tank)
    dusmanMermileri.forEach((mermi, index) => {
        if (carpismaKontrol(mermi, tank)) {
            oyun.can--;
            canElement.textContent = oyun.can;
            dusmanMermileri.splice(index, 1);
            patlamaEkle(tank.x, tank.y, 'kucuk');
            if (oyun.can <= 0) oyunBitir('yenilgi');
        }
    });

    powerUps = powerUps.filter(power => {
        if (carpismaKontrol(power, tank)) {
            if (power.tip === 'can') {
                oyun.can = Math.min(oyun.can + 1, 5);
                canElement.textContent = oyun.can;
            } else {
                tank.ozelYetekHazir = true;
                tank.ozelYetekBekleme = 0;
            }
            return false;
        }
        return true;
    });

    patlamalar = patlamalar.filter(p => {
        p.animasyon++;
        return p.animasyon < p.maxAnimasyon;
    });
}

function ciz() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e3a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tank Çizimi
    ctx.fillStyle = '#4a9a7a';
    ctx.fillRect(tank.x, tank.y, tank.genislik, tank.yukseklik);
    ctx.fillStyle = '#2a6a4a';
    ctx.fillRect(tank.x + 30, tank.y - 5, 15, tank.yukseklik + 10);
    ctx.fillStyle = '#c44a4a';
    ctx.fillRect(tank.x + 45, tank.y + tank.yukseklik/2 - 4, 15, 8);

    // Düşmanlar
    dusmanlar.forEach(dusman => {
        ctx.fillStyle = dusman.tip === 'hizli' ? '#ff8844' : (dusman.tip === 'tank' ? '#aa4444' : '#c44a4a');
        ctx.fillRect(dusman.x, dusman.y, dusman.genislik, dusman.yukseklik);
    });

    // Mermiler
    ctx.fillStyle = '#ffd700';
    mermiler.forEach(m => ctx.fillRect(m.x, m.y, m.genislik, m.yukseklik));

    // Düşman Mermileri
    ctx.fillStyle = '#ff4444';
    dusmanMermileri.forEach(m => ctx.fillRect(m.x, m.y, m.genislik, m.yukseklik));

    // Power-ups
    powerUps.forEach(p => {
        ctx.font = '20px Arial';
        ctx.fillText(p.tip === 'can' ? '❤️' : '✨', p.x, p.y);
    });

    // Patlamalar
    patlamalar.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 100, 0, ${1 - p.animasyon/p.maxAnimasyon})`;
        ctx.arc(p.x, p.y, p.animasyon * 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function oyunDongusu() {
    guncelle();
    ciz();
    requestAnimationFrame(oyunDongusu);
}

// ========== OLAY DİNLEYİCİLERİ ==========
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') tuslar.w = true;
    if (key === 's') tuslar.s = true;
    if (key === 'a') tuslar.a = true;
    if (key === 'd') tuslar.d = true;
    if (key === ' ') { e.preventDefault(); mermiEkle(); }
    if (key === 'q') ozelYetekKullan(); // Özel yetenek için Q eklendi
    if (key === 'p') {
        oyun.duraklatildi = !oyun.duraklatildi;
        document.getElementById('duraklatMenu').style.display = oyun.duraklatildi ? 'flex' : 'none';
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') tuslar.w = false;
    if (key === 's') tuslar.s = false;
    if (key === 'a') tuslar.a = false;
    if (key === 'd') tuslar.d = false;
});

// Butonlar
document.getElementById('tekrarOyna')?.addEventListener('click', oyunuBaslat);
document.getElementById('devamEt')?.addEventListener('click', () => {
    oyun.duraklatildi = false;
    document.getElementById('duraklatMenu').style.display = 'none';
});

// Başlat
oyunuBaslat();
setInterval(dusmanOlustur, 1500);
oyunDongusu();