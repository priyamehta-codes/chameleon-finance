/**
 * Circle packing layout - d3-style circle packing without d3
 */
export class CirclePack {
  constructor(width, height, padding = 20) {
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.centerX = width / 2;
    this.centerY = height / 2;
  }

  layout(items) {
    if (!items.length) return [];

    const sorted = [...items].sort((a, b) => b.cost - a.cost);

    const costs = sorted.map(d => d.cost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);

    const availableArea = Math.min(this.width, this.height) * 0.45;
    const minRadius = 20;
    const maxRadius = Math.min(80, availableArea * 0.4);

    const withRadius = sorted.map(item => {
      const ratio = maxCost === minCost ? 0.5 : (item.cost - minCost) / (maxCost - minCost);
      const radius = minRadius + Math.sqrt(ratio) * (maxRadius - minRadius);
      return { ...item, radius };
    });

    return this._packCircles(withRadius);
  }

  _packCircles(circles) {
    if (circles.length === 0) return [];
    if (circles.length === 1) {
      return [{ ...circles[0], x: this.centerX, y: this.centerY }];
    }

    const placed = [];

    placed.push({ ...circles[0], x: this.centerX, y: this.centerY });
    placed.push({
      ...circles[1],
      x: this.centerX + circles[0].radius + circles[1].radius + 4,
      y: this.centerY
    });

    for (let i = 2; i < circles.length; i++) {
      const circle = circles[i];
      const pos = this._findBestPosition(circle.radius, placed);
      placed.push({ ...circle, x: pos.x, y: pos.y });
    }

    return this._centerPack(placed);
  }

  _findBestPosition(radius, placed) {
    let bestPos = null;
    let bestDist = Infinity;

    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const positions = this._tangentPositions(placed[i], placed[j], radius);

        for (const pos of positions) {
          if (!this._hasCollision(pos.x, pos.y, radius, placed)) {
            const dist = Math.sqrt(
              Math.pow(pos.x - this.centerX, 2) +
              Math.pow(pos.y - this.centerY, 2)
            );
            if (dist < bestDist) {
              bestDist = dist;
              bestPos = pos;
            }
          }
        }
      }
    }

    if (!bestPos) {
      for (const p of placed) {
        const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];
        for (const angle of angles) {
          const dist = p.radius + radius + 4;
          const x = p.x + Math.cos(angle) * dist;
          const y = p.y + Math.sin(angle) * dist;

          if (!this._hasCollision(x, y, radius, placed)) {
            const centerDist = Math.sqrt(
              Math.pow(x - this.centerX, 2) +
              Math.pow(y - this.centerY, 2)
            );
            if (centerDist < bestDist) {
              bestDist = centerDist;
              bestPos = { x, y };
            }
          }
        }
      }
    }

    if (!bestPos) {
      bestPos = { x: this.centerX, y: this.centerY + 100 };
    }

    return bestPos;
  }

  _tangentPositions(c1, c2, r) {
    const d = Math.sqrt(Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2));
    const r1 = c1.radius + r + 4;
    const r2 = c2.radius + r + 4;

    if (d > r1 + r2) return [];
    if (d < Math.abs(r1 - r2)) return [];

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;

    if (h2 < 0) return [];

    const h = Math.sqrt(h2);

    const px = c1.x + a * (c2.x - c1.x) / d;
    const py = c1.y + a * (c2.y - c1.y) / d;

    const dx = h * (c2.y - c1.y) / d;
    const dy = h * (c2.x - c1.x) / d;

    return [
      { x: px + dx, y: py - dy },
      { x: px - dx, y: py + dy }
    ];
  }

  _hasCollision(x, y, radius, placed) {
    const gap = 4;
    for (const p of placed) {
      const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
      if (dist < radius + p.radius + gap) {
        return true;
      }
    }
    return false;
  }

  _centerPack(circles) {
    if (!circles.length) return circles;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const c of circles) {
      minX = Math.min(minX, c.x - c.radius);
      maxX = Math.max(maxX, c.x + c.radius);
      minY = Math.min(minY, c.y - c.radius);
      maxY = Math.max(maxY, c.y + c.radius);
    }

    const packWidth = maxX - minX;
    const packHeight = maxY - minY;
    const packCenterX = (minX + maxX) / 2;
    const packCenterY = (minY + maxY) / 2;

    const scaleX = (this.width - this.padding * 2) / packWidth;
    const scaleY = (this.height - this.padding * 2) / packHeight;
    const scale = Math.min(1, scaleX, scaleY);

    return circles.map(c => ({
      ...c,
      x: this.centerX + (c.x - packCenterX) * scale,
      y: this.centerY + (c.y - packCenterY) * scale,
      radius: c.radius * scale
    }));
  }
}
