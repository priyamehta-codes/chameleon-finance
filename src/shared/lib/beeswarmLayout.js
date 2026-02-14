/**
 * Beeswarm layout - dots on x-axis by value, pushed up/down to avoid overlap
 */
export class Beeswarm {
  constructor(width, height, padding = 20, isMobile = false) {
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.centerY = height / 2;
    this.isMobile = isMobile;
  }

  layout(items) {
    if (!items.length) return [];

    const sorted = [...items].sort((a, b) => a.cost - b.cost);

    const costs = sorted.map(d => d.cost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);

    const maxRadius = this.isMobile ? 28 : 45;
    const minRadius = this.isMobile ? 16 : 22;
    const spacing = this.isMobile ? 2.8 : 2.2;

    const baseRadius = Math.min(
      maxRadius,
      Math.max(minRadius, (this.width - this.padding * 2) / (items.length * spacing))
    );

    const xScale = (cost) => {
      if (maxCost === minCost) return this.width / 2;
      const ratio = (cost - minCost) / (maxCost - minCost);
      return this.padding + baseRadius + ratio * (this.width - this.padding * 2 - baseRadius * 2);
    };

    const placed = [];

    const positioned = sorted.map(item => {
      const x = xScale(item.cost);
      const y = this._findYPosition(x, baseRadius, placed);

      const result = { ...item, x, y, radius: baseRadius };
      placed.push(result);
      return result;
    });

    return this._normalizeY(positioned);
  }

  _findYPosition(x, radius, placed) {
    let y = this.centerY;
    let offset = 0;
    let direction = 1;
    const step = radius * 0.8;

    while (this._hasCollision(x, y, radius, placed)) {
      offset += step;
      y = this.centerY + offset * direction;
      direction *= -1;

      if (offset > this.height) break;
    }

    return y;
  }

  _hasCollision(x, y, radius, placed) {
    const minDistance = radius * 1.8;

    for (const item of placed) {
      const dx = x - item.x;
      const dy = y - item.y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        return true;
      }
    }
    return false;
  }

  _normalizeY(items) {
    if (!items.length) return items;

    const ys = items.map(d => d.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeY = maxY - minY;

    const availableHeight = this.height - this.padding * 2;
    const scale = rangeY > 0 ? Math.min(1, availableHeight / rangeY) : 1;
    const centerCurrent = (minY + maxY) / 2;

    return items.map(item => ({
      ...item,
      y: this.centerY + (item.y - centerCurrent) * scale,
    }));
  }
}
