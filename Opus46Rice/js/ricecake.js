// ===== RICE CAKE CLASS =====
class RiceCake {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.stage = 0; // 0=raw, 1=shaped, 2=decorated, 3=packaged, 4=done
        this.processing = false;
        this.processTimer = 0;
        this.bouncePhase = Math.random() * Math.PI * 2;
        this.scale = 0;
        this.targetScale = 1;
        this.opacity = 1;
        this.completed = false;
    }

    update(dt) {
        // Smooth movement towards target
        this.x += (this.targetX - this.x) * 0.05;
        // Scale animation
        this.scale += (this.targetScale - this.scale) * 0.1;
        // Gentle bounce
        this.bouncePhase += dt * 2;
    }

    draw(ctx) {
        ctx.save();
        const bounce = Math.sin(this.bouncePhase) * 2;
        ctx.translate(this.x, this.y + bounce);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.opacity;

        const typeData = CONFIG.RICECAKE_TYPES.find(t => t.id === this.type);
        if (!typeData) { ctx.restore(); return; }

        switch (this.stage) {
            case 0: this.drawDough(ctx, typeData); break;
            case 1: this.drawShaped(ctx, typeData); break;
            case 2: this.drawDecorated(ctx, typeData); break;
            case 3: case 4: this.drawPackaged(ctx, typeData); break;
        }
        ctx.restore();
    }

    drawDough(ctx, type) {
        // Lumpy dough ball
        ctx.beginPath();
        const r = 16;
        for (let a = 0; a < Math.PI * 2; a += 0.3) {
            const wobble = r + Math.sin(a * 3 + this.bouncePhase) * 3;
            const px = Math.cos(a) * wobble;
            const py = Math.sin(a) * wobble * 0.7;
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#f5f0e8';
        ctx.fill();
        ctx.strokeStyle = '#e0d8c8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Shiny spot
        ctx.beginPath();
        ctx.arc(-4, -5, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
    }

    drawShaped(ctx, type) {
        if (type.id === 'songpyeon') {
            // Half-moon shape
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI, true);
            ctx.quadraticCurveTo(0, 8, -16, 0);
            ctx.fillStyle = type.color;
            ctx.fill();
            ctx.strokeStyle = '#d0c8b8';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (type.id === 'injeolmi') {
            // Cube-ish shape
            ctx.fillStyle = type.color;
            this.roundRect(ctx, -14, -10, 28, 20, 4);
            ctx.fill();
            ctx.strokeStyle = '#d0c0a0';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (type.id === 'gyeongdan') {
            // Round ball
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fillStyle = type.color;
            ctx.fill();
            ctx.strokeStyle = '#d0b8c0';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (type.id === 'yakgwa') {
            // Flower shape
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * 7, Math.sin(angle) * 7, 7, 0, Math.PI * 2);
                ctx.fillStyle = type.color;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = type.color;
            ctx.fill();
            ctx.strokeStyle = '#c0a030';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // jeolpyeon - flat rectangle with pattern
            ctx.fillStyle = type.color;
            this.roundRect(ctx, -18, -8, 36, 16, 3);
            ctx.fill();
            ctx.strokeStyle = '#d8d0d0';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        // Shine
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();
    }

    drawDecorated(ctx, type) {
        this.drawShaped(ctx, type);
        // Add decorations
        if (type.id === 'songpyeon') {
            // Pine needle pattern line
            ctx.strokeStyle = '#60a040';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-8, -4); ctx.lineTo(0, -7); ctx.lineTo(8, -4);
            ctx.stroke();
        } else if (type.id === 'injeolmi') {
            // Soybean powder dots (deterministic)
            for (let i = 0; i < 15; i++) {
                const px = Math.sin(i * 2.7 + 0.5) * 12;
                const py = Math.cos(i * 3.1 + 1.2) * 8;
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#c8a860';
                ctx.fill();
            }
        } else if (type.id === 'gyeongdan') {
            // Colorful coating (deterministic)
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2 + i * 0.3;
                const r = 10 + Math.sin(i * 1.7) * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = ['#e06070', '#60a0e0', '#60c060', '#e0c040'][i % 4];
                ctx.fill();
            }
        } else if (type.id === 'yakgwa') {
            // Honey glaze
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 150, 50, 0.3)';
            ctx.fill();
        } else {
            // jeolpyeon flower stamp
            ctx.fillStyle = '#e890a0';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 3, 0, Math.PI * 2);
            }
            ctx.fill();
        }
    }

    drawPackaged(ctx, type) {
        // Box
        ctx.fillStyle = '#fff8f0';
        this.roundRect(ctx, -20, -14, 40, 28, 5);
        ctx.fill();
        ctx.strokeStyle = '#e0d0c0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Ribbon
        ctx.strokeStyle = '#e07080';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
        ctx.moveTo(0, -14); ctx.lineTo(0, 14);
        ctx.stroke();
        // Bow
        ctx.fillStyle = '#e07080';
        ctx.beginPath();
        ctx.ellipse(-5, -2, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -2, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        // Label
        ctx.font = '10px Jua';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#a08070';
        ctx.fillText(type.name, 0, 10);

        if (this.stage === 4) {
            ctx.globalAlpha = 0.7;
            ctx.font = '14px sans-serif';
            ctx.fillText('✓', 14, -6);
        }
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
