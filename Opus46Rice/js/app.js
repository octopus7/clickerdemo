// ===== MAIN GAME CLASS =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game state
        this.money = 0;
        this.totalProduced = 0;
        this.selectedType = 'songpyeon';
        this.upgradeLevels = {};
        CONFIG.UPGRADES.forEach(u => this.upgradeLevels[u.id] = 0);

        // Systems - use CSS/logical dimensions, not canvas pixel dimensions
        this.conveyor = new ConveyorBelt(window.innerWidth, window.innerHeight);

        // Timing
        this.lastTime = performance.now();
        this.autoSpawnTimer = 0;
        this.spawnCooldown = 0;

        // UI
        this.setupUI();
        this.updateUI();

        // Click to spawn
        this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));

        // Start
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);

        // Auto-spawn first rice cake
        setTimeout(() => this.spawnRiceCake(), 500);

        // Show welcome toast
        this.showToast('🍡 떡공장에 오신 걸 환영합니다!');
        setTimeout(() => this.showToast('클릭하여 떡을 생산하세요!'), 2500);
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        if (this.conveyor) {
            this.conveyor.resize(window.innerWidth, window.innerHeight);
        }
    }

    // ===== GAME LOOP =====
    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.gameLoop);
    }

    update(dt) {
        const speedLevel = this.upgradeLevels['speed'] || 0;
        const effLevel = this.upgradeLevels['efficiency'] || 0;
        const autoLevel = this.upgradeLevels['auto'] || 0;
        const multiLevel = this.upgradeLevels['multi'] || 0;
        const valueLevel = this.upgradeLevels['value'] || 0;

        const speedMult = 1 + speedLevel * CONFIG.UPGRADES[0].effect;
        const workEff = Math.min(0.8, effLevel * CONFIG.UPGRADES[1].effect);

        // Update conveyor
        this.conveyor.update(dt, speedMult, workEff);

        // Check for completed rice cakes
        for (let i = this.conveyor.riceCakes.length - 1; i >= 0; i--) {
            const rc = this.conveyor.riceCakes[i];
            if (rc.completed && !rc.counted) {
                rc.counted = true;
                const typeData = CONFIG.RICECAKE_TYPES.find(t => t.id === rc.type);
                const valueMult = 1 + valueLevel * CONFIG.UPGRADES[2].effect;
                const earned = Math.floor((typeData ? typeData.price : 10) * valueMult);
                this.money += earned;
                this.totalProduced++;
                this.updateUI();

                // Milestone toasts
                if (this.totalProduced === 10) this.showToast('🎉 10개 생산 달성!');
                if (this.totalProduced === 50) this.showToast('🏆 50개 생산! 대단해요!');
                if (this.totalProduced === 100) this.showToast('👑 100개! 떡 마스터!');
                if (this.totalProduced === 500) this.showToast('🌟 500개! 전설의 떡장인!');
            }
        }

        // Auto spawner
        if (autoLevel > 0) {
            const autoInterval = CONFIG.AUTO_SPAWN_INTERVAL * (1 - autoLevel * CONFIG.UPGRADES[3].effect);
            this.autoSpawnTimer += dt * 1000;
            if (this.autoSpawnTimer >= autoInterval) {
                this.autoSpawnTimer = 0;
                if (this.conveyor.riceCakes.length < 12) {
                    this.spawnRiceCake();
                    if (multiLevel > 0 && Math.random() < multiLevel * CONFIG.UPGRADES[4].effect) {
                        setTimeout(() => this.spawnRiceCake(), 300);
                    }
                }
            }
        }

        // Spawn cooldown
        if (this.spawnCooldown > 0) this.spawnCooldown -= dt;
    }

    render() {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        ctx.clearRect(0, 0, w, h);

        // Draw conveyor (includes background, belt, workers, rice cakes)
        this.conveyor.draw(ctx);

        // Draw title
        ctx.save();
        ctx.font = `${Math.max(18, w * 0.02)}px Jua`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(100, 120, 140, 0.5)';
        ctx.fillText('🍡 떡공장', w * 0.5, h * 0.08);
        ctx.restore();
    }

    // ===== SPAWNING =====
    spawnRiceCake() {
        if (this.conveyor.riceCakes.length >= 15) return;
        if (this.spawnCooldown > 0) return;
        this.spawnCooldown = 0.3;
        this.conveyor.spawnRiceCake(this.selectedType);
    }

    onCanvasClick(e) {
        this.spawnRiceCake();
        const multiLevel = this.upgradeLevels['multi'] || 0;
        if (multiLevel > 0 && Math.random() < multiLevel * CONFIG.UPGRADES[4].effect) {
            setTimeout(() => this.spawnRiceCake(), 200);
        }
    }

    // ===== UI =====
    setupUI() {
        // Upgrade toggle
        document.getElementById('upgrade-toggle').addEventListener('click', () => {
            const panel = document.getElementById('upgrade-panel');
            panel.classList.toggle('hidden');
        });

        // Render upgrades
        this.renderUpgrades();

        // Render rice cake types
        this.renderRiceCakeTypes();
    }

    renderUpgrades() {
        const list = document.getElementById('upgrade-list');
        list.innerHTML = '';

        CONFIG.UPGRADES.forEach(upg => {
            const level = this.upgradeLevels[upg.id];
            const cost = Math.floor(upg.baseCost * Math.pow(upg.costMult, level));
            const maxed = level >= upg.maxLevel;
            const affordable = this.money >= cost && !maxed;

            const card = document.createElement('div');
            card.className = `upgrade-card ${affordable ? 'affordable' : ''} ${maxed ? 'max-level' : ''}`;
            card.innerHTML = `
                <div class="upgrade-header">
                    <span class="upgrade-icon">${upg.icon}</span>
                    <span class="upgrade-name">${upg.name}</span>
                    <span class="upgrade-level">Lv.${level}/${upg.maxLevel}</span>
                </div>
                <div class="upgrade-desc">${upg.desc}</div>
                <div class="upgrade-cost">${maxed ? '✅ MAX' : `💰 ${this.formatNumber(cost)}원`}</div>
            `;

            if (!maxed) {
                card.addEventListener('click', () => this.buyUpgrade(upg.id));
            }

            list.appendChild(card);
        });
    }

    renderRiceCakeTypes() {
        const container = document.getElementById('ricecake-types');
        container.innerHTML = '';

        CONFIG.RICECAKE_TYPES.forEach(type => {
            const btn = document.createElement('button');
            btn.className = `ricecake-type-btn ${this.selectedType === type.id ? 'active' : ''} ${!type.unlocked ? 'locked' : ''}`;
            btn.innerHTML = `
                <span>${type.emoji}</span>
                <span class="type-name">${type.name}</span>
            `;

            if (type.unlocked) {
                btn.addEventListener('click', () => {
                    this.selectedType = type.id;
                    this.renderRiceCakeTypes();
                });
            } else {
                btn.addEventListener('click', () => {
                    if (this.money >= type.unlockCost) {
                        this.money -= type.unlockCost;
                        type.unlocked = true;
                        this.selectedType = type.id;
                        this.showToast(`🎊 ${type.name} 해금!`);
                        this.renderRiceCakeTypes();
                        this.renderUpgrades();
                        this.updateUI();
                    } else {
                        this.showToast(`💰 ${this.formatNumber(type.unlockCost)}원 필요!`);
                    }
                });
                btn.title = `${this.formatNumber(type.unlockCost)}원으로 해금`;
            }

            container.appendChild(btn);
        });
    }

    buyUpgrade(id) {
        const upg = CONFIG.UPGRADES.find(u => u.id === id);
        const level = this.upgradeLevels[id];
        if (level >= upg.maxLevel) return;
        const cost = Math.floor(upg.baseCost * Math.pow(upg.costMult, level));
        if (this.money < cost) {
            this.showToast('💰 돈이 부족합니다!');
            return;
        }
        this.money -= cost;
        this.upgradeLevels[id]++;
        this.showToast(`⬆️ ${upg.name} Lv.${this.upgradeLevels[id]}!`);
        this.renderUpgrades();
        this.updateUI();
    }

    updateUI() {
        document.getElementById('money-display').textContent = this.formatNumber(this.money);
        document.getElementById('produced-display').textContent = this.formatNumber(this.totalProduced);
        const speedLevel = this.upgradeLevels['speed'] || 0;
        const speedMult = 1 + speedLevel * CONFIG.UPGRADES[0].effect;
        document.getElementById('speed-display').textContent = speedMult.toFixed(1);
        // Re-render upgrades to update affordability
        this.renderUpgrades();
        this.renderRiceCakeTypes();
    }

    formatNumber(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return Math.floor(n).toString();
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 2500);
    }
}

// ===== START =====
window.addEventListener('load', () => {
    new Game();
});
