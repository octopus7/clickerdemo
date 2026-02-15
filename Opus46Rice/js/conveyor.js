// ===== CONVEYOR BELT SYSTEM =====
class ConveyorBelt {
    constructor(canvasWidth, canvasHeight) {
        this.resize(canvasWidth, canvasHeight);
        this.scrollOffset = 0;
        this.stations = [];
        this.workers = [];
        this.riceCakes = [];
        this.particles = new ParticleSystem();
        this.setupStations();
    }

    resize(w, h) {
        this.canvasW = w;
        this.canvasH = h;
        this.beltY = h * CONFIG.BELT_Y_START;
        this.beltH = CONFIG.BELT_HEIGHT;
        const margin = w * 0.08;
        this.beltStartX = margin;
        this.beltEndX = w - margin;
        this.beltLen = this.beltEndX - this.beltStartX;
        if (this.stations && this.stations.length) this.setupStations();
    }

    setupStations() {
        this.stations = [];
        this.workers = [];
        const segLen = this.beltLen / 5;
        for (let i = 0; i < 4; i++) {
            const x = this.beltStartX + segLen * (i + 1);
            const stY = this.beltY;
            this.stations.push({
                x, y: stY,
                label: CONFIG.STAGES[i],
                emoji: CONFIG.STAGE_EMOJIS[i],
                busy: false,
                processingCake: null,
                processTimer: 0,
            });
            const workerY = stY - this.beltH - 45;
            this.workers.push(new Worker(x, workerY, i, CONFIG.RABBIT_COLORS[i]));
        }
    }

    spawnRiceCake(typeId) {
        const rc = new RiceCake(typeId, this.beltStartX - 30, this.beltY - this.beltH / 2 - 16);
        rc.targetX = this.beltStartX + 10;
        this.riceCakes.push(rc);
        this.particles.emitDust(this.beltStartX, this.beltY - this.beltH, 4);
        return rc;
    }

    update(dt, speedMult, workEfficiency) {
        this.scrollOffset += dt * 60 * speedMult;
        if (this.scrollOffset > 20) this.scrollOffset -= 20;

        // Update workers
        this.workers.forEach(w => w.update(dt));
        this.particles.update();

        // Update rice cakes
        for (let i = this.riceCakes.length - 1; i >= 0; i--) {
            const rc = this.riceCakes[i];
            rc.update(dt);

            if (rc.processing) continue;
            if (rc.completed) {
                rc.targetX += speedMult * 2;
                if (!rc.counted) {
                    rc.opacity -= dt * 0.8;
                }
                if (rc.counted && rc.opacity <= 0) {
                    this.riceCakes.splice(i, 1);
                }
                continue;
            }

            // Find next station for this rice cake
            if (rc.stage < 4) {
                const station = this.stations[rc.stage];
                if (!station.busy && Math.abs(rc.x - station.x) < 5) {
                    // Start processing
                    station.busy = true;
                    station.processingCake = rc;
                    station.processTimer = 0;
                    rc.processing = true;
                    this.workers[rc.stage].startWork();
                } else if (!station.busy) {
                    rc.targetX = station.x;
                } else {
                    rc.targetX = station.x - 40;
                }
            }
        }

        // Process stations
        const workTime = CONFIG.BASE_WORK_TIME * (1 - workEfficiency);
        this.stations.forEach((st, idx) => {
            if (!st.busy || !st.processingCake) return;
            st.processTimer += dt * 1000;
            if (st.processTimer >= workTime) {
                const rc = st.processingCake;
                rc.stage++;
                rc.processing = false;
                this.workers[idx].celebrate();
                this.particles.emitStars(st.x, st.y - this.beltH - 30, 5);

                if (rc.stage >= 4) {
                    rc.completed = true;
                    rc.targetX = this.beltEndX + 50;
                    this.particles.emitCoins(st.x, st.y - this.beltH - 50, 3);
                } else {
                    rc.targetX = this.stations[rc.stage].x;
                }
                st.busy = false;
                st.processingCake = null;
            }
        });

        // Return completed cake count
        return this.riceCakes.filter(rc => rc.completed && rc.opacity <= 0).length;
    }

    draw(ctx) {
        this.drawBackground(ctx);
        this.drawBelt(ctx);
        this.drawStationLabels(ctx);
        // Draw rice cakes (behind workers)
        this.riceCakes.forEach(rc => rc.draw(ctx));
        // Draw workers
        this.workers.forEach(w => w.draw(ctx));
        // Draw station progress bars
        this.drawStationProgress(ctx);
        // Particles on top
        this.particles.draw(ctx);
        // Draw spawn area
        this.drawSpawnArea(ctx);
        // Draw output area
        this.drawOutputArea(ctx);
    }

    drawBackground(ctx) {
        const w = this.canvasW, h = this.canvasH;

        // Gradient sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
        skyGrad.addColorStop(0, '#c0d8f0');
        skyGrad.addColorStop(1, '#dce8f4');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.5);

        // Back wall
        ctx.fillStyle = '#e4ecf4';
        ctx.fillRect(0, h * 0.12, w, h * 0.38);
        // Wall bottom edge
        ctx.fillStyle = '#d0d8e4';
        ctx.fillRect(0, h * 0.48, w, 4);

        // Floor
        const floorGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
        floorGrad.addColorStop(0, '#d8e0e8');
        floorGrad.addColorStop(1, '#c8d0d8');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, h * 0.5, w, h * 0.5);

        // Floor grid lines
        ctx.strokeStyle = 'rgba(180, 190, 200, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const x = (i / 20) * w;
            ctx.beginPath();
            ctx.moveTo(x, h * 0.5);
            ctx.lineTo(x + w * 0.1, h);
            ctx.stroke();
        }

        // Wall decorations
        this.drawWallDecorations(ctx, w, h);
    }

    drawWallDecorations(ctx, w, h) {
        // Poster 1 - production chart
        ctx.fillStyle = '#fff';
        ctx.fillRect(w * 0.06, h * 0.15, w * 0.08, h * 0.12);
        ctx.strokeStyle = '#c0c8d0';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.06, h * 0.15, w * 0.08, h * 0.12);
        ctx.fillStyle = '#a0a8b0';
        ctx.font = `${Math.max(10, w * 0.01)}px Jua`;
        ctx.textAlign = 'center';
        ctx.fillText('📊 생산표', w * 0.1, h * 0.20);
        // Mini bar chart
        const colors = ['#e08080', '#80c0e0', '#80e080', '#e0c060'];
        const barHeights = [12, 18, 8, 15];
        for (let i = 0; i < 4; i++) {
            const bh = barHeights[i];
            ctx.fillStyle = colors[i];
            ctx.fillRect(w * 0.07 + i * w * 0.015, h * 0.26 - bh, w * 0.01, bh);
        }

        // Poster 2 - rice cake types
        ctx.fillStyle = '#fff8f0';
        ctx.fillRect(w * 0.86, h * 0.14, w * 0.08, h * 0.14);
        ctx.strokeStyle = '#d0c0b0';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.86, h * 0.14, w * 0.08, h * 0.14);
        ctx.font = `${Math.max(12, w * 0.012)}px Jua`;
        ctx.fillStyle = '#a09080';
        ctx.fillText('🍡 떡 종류', w * 0.9, h * 0.19);

        // Clock
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.18, w * 0.025, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#b0b8c0';
        ctx.lineWidth = 2;
        ctx.stroke();
        const now = Date.now() / 1000;
        const hourAngle = (now / 3600) * Math.PI * 2 - Math.PI / 2;
        const minAngle = (now / 60) * Math.PI * 2 - Math.PI / 2;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.18);
        ctx.lineTo(w * 0.5 + Math.cos(hourAngle) * w * 0.012, h * 0.18 + Math.sin(hourAngle) * w * 0.012);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.18);
        ctx.lineTo(w * 0.5 + Math.cos(minAngle) * w * 0.018, h * 0.18 + Math.sin(minAngle) * w * 0.018);
        ctx.stroke();

        // Bunting / flags
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#c0c8d0';
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h * 0.13);
        ctx.quadraticCurveTo(w * 0.3, h * 0.16, w * 0.42, h * 0.13);
        ctx.stroke();
        const flagColors = ['#e08080', '#80c0e0', '#f0d060', '#80d0a0', '#d080d0'];
        for (let i = 0; i < 5; i++) {
            const t = i / 4;
            const fx = w * 0.15 + t * w * 0.27;
            const fy = h * 0.13 + Math.sin(t * Math.PI) * h * 0.03;
            ctx.fillStyle = flagColors[i];
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx - 5, fy + 12);
            ctx.lineTo(fx + 5, fy + 12);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawBelt(ctx) {
        const y = this.beltY;
        const h = this.beltH;
        const startX = this.beltStartX;
        const endX = this.beltEndX;

        // Belt shadow
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(startX - 5, y + 5, endX - startX + 10, h + 8);

        // Belt side (3D effect)
        ctx.fillStyle = CONFIG.COLORS.BELT_SIDE;
        ctx.fillRect(startX, y + h, endX - startX, 12);
        ctx.strokeStyle = '#556070';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, y + h, endX - startX, 12);

        // Belt surface
        ctx.fillStyle = CONFIG.COLORS.BELT_SURFACE;
        ctx.fillRect(startX, y, endX - startX, h);

        // Belt surface lines (animated scroll)
        ctx.strokeStyle = CONFIG.COLORS.BELT_LINE;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -this.scrollOffset;
        const lineCount = 3;
        for (let i = 0; i < lineCount; i++) {
            const ly = y + (h / (lineCount + 1)) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(startX, ly);
            ctx.lineTo(endX, ly);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Belt edges
        ctx.strokeStyle = '#667788';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.moveTo(startX, y + h);
        ctx.lineTo(endX, y + h);
        ctx.stroke();

        // Rollers at ends
        this.drawRoller(ctx, startX, y, h);
        this.drawRoller(ctx, endX, y, h);

        // Belt legs
        ctx.fillStyle = '#778899';
        for (let i = 0; i < 5; i++) {
            const lx = startX + (this.beltLen / 4) * i;
            ctx.fillRect(lx - 3, y + h + 12, 6, this.canvasH * 0.2);
            ctx.fillRect(lx - 6, y + h + 12 + this.canvasH * 0.2 - 4, 12, 4);
        }
    }

    drawRoller(ctx, x, y, h) {
        ctx.beginPath();
        ctx.ellipse(x, y + h / 2, 8, h / 2 + 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.COLORS.BELT_ROLLER;
        ctx.fill();
        ctx.strokeStyle = '#445566';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Roller shine
        ctx.beginPath();
        ctx.ellipse(x - 2, y + h / 2 - 3, 3, h / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();
    }

    drawStationLabels(ctx) {
        this.stations.forEach((st, i) => {
            // Station table below belt
            const tableY = this.beltY + this.beltH + 12;
            ctx.fillStyle = CONFIG.COLORS.STATION_TOP;
            ctx.fillRect(st.x - 30, tableY, 60, 8);
            ctx.fillStyle = CONFIG.COLORS.STATION_FRONT;
            ctx.fillRect(st.x - 30, tableY + 8, 60, 20);
            ctx.strokeStyle = '#90a0b0';
            ctx.lineWidth = 1;
            ctx.strokeRect(st.x - 30, tableY, 60, 28);

            // Label
            ctx.font = `${Math.max(11, this.canvasW * 0.011)}px Jua`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#556677';
            ctx.fillText(`${st.emoji} ${st.label}`, st.x, tableY + 22);

            // Station number badge
            ctx.beginPath();
            ctx.arc(st.x, this.beltY - this.beltH - 80, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();
            ctx.strokeStyle = '#b0b8c8';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#667788';
            ctx.font = `${Math.max(10, this.canvasW * 0.01)}px Jua`;
            ctx.fillText(`${i + 1}`, st.x, this.beltY - this.beltH - 76);
        });
    }

    drawStationProgress(ctx) {
        const workTime = CONFIG.BASE_WORK_TIME;
        this.stations.forEach((st, i) => {
            if (!st.busy) return;
            const progress = Math.min(1, st.processTimer / workTime);
            const barW = 40;
            const barH = 5;
            const bx = st.x - barW / 2;
            const by = this.beltY - this.beltH - 90;

            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(bx, by, barW, barH);
            const grad = ctx.createLinearGradient(bx, by, bx + barW * progress, by);
            grad.addColorStop(0, '#4ecdc4');
            grad.addColorStop(1, '#44b09e');
            ctx.fillStyle = grad;
            ctx.fillRect(bx, by, barW * progress, barH);
        });
    }

    drawSpawnArea(ctx) {
        const x = this.beltStartX - 20;
        const y = this.beltY - this.beltH / 2;
        // Machine
        ctx.fillStyle = '#a0b0c0';
        ctx.fillRect(x - 35, y - 50, 50, 70);
        ctx.fillStyle = '#90a0b0';
        ctx.fillRect(x - 35, y + 20, 50, 10);
        ctx.strokeStyle = '#808890';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 35, y - 50, 50, 80);
        // Machine face
        ctx.fillStyle = '#c0d0e0';
        ctx.fillRect(x - 28, y - 40, 36, 25);
        ctx.strokeStyle = '#90a0b0';
        ctx.strokeRect(x - 28, y - 40, 36, 25);
        // Arrow
        ctx.fillStyle = '#70c070';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('→', x - 10, y - 22);
        // Label
        ctx.fillStyle = '#708090';
        ctx.font = `${Math.max(10, this.canvasW * 0.009)}px Jua`;
        ctx.fillText('재료 투입', x - 10, y - 7);
    }

    drawOutputArea(ctx) {
        const x = this.beltEndX + 20;
        const y = this.beltY - this.beltH / 2;
        // Collection box
        ctx.fillStyle = '#d8c0a0';
        ctx.fillRect(x - 5, y - 20, 50, 55);
        ctx.fillStyle = '#c8b090';
        ctx.fillRect(x - 5, y + 35, 50, 8);
        ctx.strokeStyle = '#b0a080';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 5, y - 20, 50, 63);
        // Open top
        ctx.fillStyle = '#e8d8c0';
        ctx.fillRect(x - 2, y - 20, 44, 10);
        // Label
        ctx.fillStyle = '#a09070';
        ctx.font = `${Math.max(10, this.canvasW * 0.009)}px Jua`;
        ctx.textAlign = 'center';
        ctx.fillText('📦 완성!', x + 20, y + 22);
    }

    getCompletedCount() {
        let count = 0;
        for (let i = this.riceCakes.length - 1; i >= 0; i--) {
            if (this.riceCakes[i].completed && this.riceCakes[i].opacity <= 0) {
                count++;
            }
        }
        return count;
    }
}
