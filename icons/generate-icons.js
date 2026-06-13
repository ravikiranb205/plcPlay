// Node script — run once: node icons/generate-icons.js
const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, size, size);

  // Gold accent bar at top
  ctx.fillStyle = '#e8c040';
  ctx.fillRect(0, 0, size, size * 0.04);

  // Emoji / letter
  ctx.fillStyle = '#e8c040';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💪', size / 2, size * 0.52);

  return canvas.toBuffer('image/png');
}

fs.writeFileSync('icons/icon-192.png', makeIcon(192));
fs.writeFileSync('icons/icon-512.png', makeIcon(512));
console.log('Icons generated.');
