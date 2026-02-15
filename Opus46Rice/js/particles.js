// ===== PARTICLE SYSTEM =====
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 3;
        this.vy = options.vy || -Math.random() * 4 - 1;
        this.life = options.life || 1;
        this.decay = options.decay || 0.015 + Math.random() * 0.01;
        this.size = options.size || 3 + Math.random() * 4;
        this.color = options.color || '#ffd700';
        this.type = options.type || 'circle';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
        this.gravity = options.gravity !== undefined ? options.gravity : 0.08;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.rotation += this.rotSpeed;
        this.size *= 0.995;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'star') {
            this.drawStar(ctx);
        } else if (this.type === 'coin') {
            this.drawCoin(ctx);
        } else if (this.type === 'dust') {
            this.drawDust(ctx);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.restore();
    }

    drawStar(ctx) {
        const s = this.size;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = i === 0 ? s : s;
            const method = i === 0 ? 'moveTo' : 'lineTo';
            ctx[method](Math.cos(angle) * s, Math.sin(angle) * s);
            const midAngle = angle + (2 * Math.PI) / 5;
            ctx.lineTo(Math.cos(midAngle) * s * 0.4, Math.sin(midAngle) * s * 0.4);
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawCoin(ctx) {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#cc9900';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#cc9900';
        ctx.font = `${this.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₩', 0, 0);
    }

    drawDust(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                ...options,
                vx: options.vx !== undefined ? options.vx + (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 3,
                vy: options.vy !== undefined ? options.vy + (Math.random() - 0.5) * 2 : -Math.random() * 4 - 1,
            }));
        }
    }

    emitStars(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                type: 'star',
                color: ['#ffd700', '#ffaa00', '#ffdd44', '#fff5cc'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 3,
                gravity: 0.03,
                decay: 0.02,
            }));
        }
    }

    emitCoins(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 5 - 2,
                type: 'coin',
                color: '#ffd700',
                size: 6 + Math.random() * 3,
                gravity: 0.12,
                decay: 0.012,
            }));
        }
    }

    emitDust(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 1.5 - 0.5,
                type: 'dust',
                color: `rgba(255, 250, 240, ${0.3 + Math.random() * 0.4})`,
                size: 4 + Math.random() * 6,
                gravity: -0.01,
                decay: 0.008,
            }));
        }
    }

    update() {
        this.particles = this.particles.filter(p => p.update());
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}
