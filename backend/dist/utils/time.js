"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.durationToMs = durationToMs;
const map = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};
function durationToMs(value) {
    const match = /^([0-9]+)([smhd])$/i.exec(value.trim());
    if (!match) {
        throw new Error(`Неверный формат длительности: ${value}`);
    }
    const [_, amount, unit] = match;
    const multiplier = map[unit.toLowerCase()];
    return Number(amount) * multiplier;
}
//# sourceMappingURL=time.js.map