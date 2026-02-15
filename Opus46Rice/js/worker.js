// ===== RABBIT WORKER CLASS =====
class Worker {
    constructor(x, y, stationIndex, colorData) {
        this.x = x;
        this.y = y;
        this.stationIndex = stationIndex;
        this.color = colorData;
        this.state = 'idle'; // idle, working, celebrate
        this.animPhase = Math.random() * Math.PI * 2;
        this.workProgress = 0;
        this.armAngle = 0;
        this.earWiggle = 0;
        this.eyeBlink = 0;
        this.blinkTimer = 3 + Math.random() * 4;
        this.celebrateTimer = 0;
        this.bodyBounce = 0;
    }

    update(dt) {
        this.animPhase += dt * 2;
        // Blink
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.eyeBlink = 1;
            this.blinkTimer = 3 + Math.random() * 5;
        }
        if (this.eyeBlink > 0) this.eyeBlink -= dt * 8;

        if (this.state === 'working') {
            this.workProgress += dt;
            // Station-specific arm animation
            switch (this.stationIndex) {
                case 0: // Kneading - up/down
                    this.armAngle = Math.sin(this.animPhase * 4) * 0.5;
                    this.bodyBounce = Math.abs(Math.sin(this.animPhase * 4)) * 3;
                    break;
                case 1: // Shaping - side to side
                    this.armAngle = Math.sin(this.animPhase * 3) * 0.4;
                    this.bodyBounce = Math.sin(this.animPhase * 3) * 2;
                    break;
                case 2: // Decorating - precise small moves
                    this.armAngle = Math.sin(this.animPhase * 5) * 0.2;
                    this.bodyBounce = Math.sin(this.animPhase * 2) * 1.5;
                    break;
                case 3: // Packaging - wrapping motion
                    this.armAngle = Math.sin(this.animPhase * 2.5) * 0.6;
                    this.bodyBounce = Math.abs(Math.sin(this.animPhase * 2.5)) * 2;
                    break;
            }
            this.earWiggle = Math.sin(this.animPhase * 3) * 0.1;
        } else if (this.state === 'celebrate') {
            this.celebrateTimer -= dt;
            this.bodyBounce = Math.abs(Math.sin(this.animPhase * 6)) * 5;
            this.earWiggle = Math.sin(this.animPhase * 5) * 0.2;
            if (this.celebrateTimer <= 0) this.state = 'idle';
        } else {
            // Idle - gentle sway
            this.bodyBounce = Math.sin(this.animPhase) * 1;
            this.earWiggle = Math.sin(this.animPhase * 0.5) * 0.05;
            this.armAngle = Math.sin(this.animPhase * 0.8) * 0.1;
        }
    }

    startWork() { this.state = 'working'; this.workProgress = 0; }

    celebrate() {
        this.state = 'celebrate';
        this.celebrateTimer = 0.5;
    }

    stopWork() { if (this.state === 'working') this.state = 'idle'; }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - this.bodyBounce);

        // Shadow
        ctx.save();
        ctx.translate(0, this.bodyBounce + 25);
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.COLORS.SHADOW;
        ctx.fill();
        ctx.restore();

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 10, 18, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color.body;
        ctx.fill();
        ctx.strokeStyle = this.darken(this.color.body, 20);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Apron
        ctx.beginPath();
        ctx.ellipse(0, 14, 14, 12, 0, -0.2, Math.PI + 0.2);
        ctx.fillStyle = '#e8f4f8';
        ctx.fill();
        ctx.strokeStyle = '#c8d8e8';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Apron string
        ctx.beginPath();
        ctx.moveTo(-14, 8); ctx.quadraticCurveTo(-8, 4, 0, 6);
        ctx.quadraticCurveTo(8, 4, 14, 8);
        ctx.strokeStyle = '#c8d8e8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Arms
        ctx.save();
        // Left arm
        ctx.save();
        ctx.translate(-16, 8);
        ctx.rotate(-0.3 + this.armAngle);
        ctx.beginPath();
        ctx.ellipse(0, 8, 5, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color.body;
        ctx.fill();
        ctx.strokeStyle = this.darken(this.color.body, 20);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        // Right arm
        ctx.save();
        ctx.translate(16, 8);
        ctx.rotate(0.3 - this.armAngle);
        ctx.beginPath();
        ctx.ellipse(0, 8, 5, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color.body;
        ctx.fill();
        ctx.strokeStyle = this.darken(this.color.body, 20);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        ctx.restore();

        // Head
        ctx.beginPath();
        ctx.arc(0, -10, 16, 0, Math.PI * 2);
        ctx.fillStyle = this.color.body;
        ctx.fill();
        ctx.strokeStyle = this.darken(this.color.body, 20);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ears
        ctx.save();
        ctx.translate(-7, -24);
        ctx.rotate(-0.15 + this.earWiggle);
        ctx.beginPath();
        ctx.ellipse(0, -14, 5, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color.body;
        ctx.fill();
        ctx.strokeStyle = this.darken(this.color.body, 20);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -14, 3, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color.ear;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(7, -24);
        ctx.rotate(0.15 - this.earWiggle);
        ctx.beginPath();
        ctx.ellipse(0, -14, 5, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color.body;
        ctx.fill();
        ctx.strokeStyle = this.darken(this.color.body, 20);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -14, 3, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color.ear;
        ctx.fill();
        ctx.restore();

        // Eyes (with blink)
        const eyeH = this.eyeBlink > 0.5 ? 0.5 : 3;
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(-6, -12, 3, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -12, 3, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye shine
        if (this.eyeBlink <= 0.5) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-5, -13, 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(7, -13, 1.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nose
        ctx.fillStyle = '#e8a0a0';
        ctx.beginPath();
        ctx.ellipse(0, -8, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#c08080';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (this.state === 'celebrate') {
            ctx.arc(0, -6, 4, 0.2, Math.PI - 0.2);
        } else if (this.state === 'working') {
            ctx.arc(0, -5, 2, 0, Math.PI);
        } else {
            ctx.arc(0, -6, 3, 0.3, Math.PI - 0.3);
        }
        ctx.stroke();

        // Cheek blush
        ctx.fillStyle = 'rgba(240, 160, 160, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-11, -7, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(11, -7, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hat/headband based on station
        this.drawAccessory(ctx);

        ctx.restore();
    }

    drawAccessory(ctx) {
        switch (this.stationIndex) {
            case 0: // Chef hat
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(0, -28, 14, 8, 0, Math.PI, 0, true);
                ctx.lineTo(14, -28);
                ctx.quadraticCurveTo(14, -40, 8, -42);
                ctx.quadraticCurveTo(0, -46, -8, -42);
                ctx.quadraticCurveTo(-14, -40, -14, -28);
                ctx.fill();
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
            case 1: // Bandana
                ctx.fillStyle = '#e07070';
                ctx.beginPath();
                ctx.arc(0, -18, 16, -Math.PI, -0.1);
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#e07070';
                ctx.stroke();
                ctx.fillStyle = '#c05050';
                ctx.beginPath();
                ctx.moveTo(12, -22);
                ctx.lineTo(20, -28);
                ctx.lineTo(18, -18);
                ctx.closePath();
                ctx.fill();
                break;
            case 2: // Beret
                ctx.fillStyle = '#8070c0';
                ctx.beginPath();
                ctx.ellipse(2, -26, 16, 6, 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(4, -28, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3: // Cap
                ctx.fillStyle = '#60a0d0';
                ctx.beginPath();
                ctx.ellipse(0, -24, 16, 5, 0, Math.PI, 0, true);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(2, -24, 20, 4, 0.1, -0.5, Math.PI * 0.7);
                ctx.fillStyle = '#5090c0';
                ctx.fill();
                break;
        }
    }

    darken(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
        const b = Math.max(0, (num & 0xFF) - amount);
        return `rgb(${r},${g},${b})`;
    }
}
