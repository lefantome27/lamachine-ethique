const fs = require('fs');
const path = require('path');

console.log('🎨 Création de l\'icône Cheval de Troie...\n');

// Créer le dossier assets s'il n'existe pas
if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
    console.log('✅ Dossier assets créé');
}

// Créer une icône SVG de cheval de Troie
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="horseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#A0522D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#654321;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DEB887;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#D2B48C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#BC8F8F;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="dangerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF4444;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#CC0000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#880000;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fond -->
  <rect width="256" height="256" fill="#1a1a1a"/>
  
  <!-- Base du cheval (bois) -->
  <rect x="40" y="180" width="176" height="40" rx="8" fill="url(#woodGradient)" stroke="#8B4513" stroke-width="2"/>
  
  <!-- Corps principal du cheval -->
  <ellipse cx="128" cy="140" rx="60" ry="40" fill="url(#horseGradient)" stroke="#654321" stroke-width="3"/>
  
  <!-- Tête du cheval -->
  <ellipse cx="128" cy="80" rx="25" ry="35" fill="url(#horseGradient)" stroke="#654321" stroke-width="3"/>
  
  <!-- Oreilles -->
  <ellipse cx="115" cy="60" rx="8" ry="12" fill="url(#horseGradient)" stroke="#654321" stroke-width="2"/>
  <ellipse cx="141" cy="60" rx="8" ry="12" fill="url(#horseGradient)" stroke="#654321" stroke-width="2"/>
  
  <!-- Yeux (menaçants) -->
  <circle cx="120" cy="75" r="4" fill="#FF0000"/>
  <circle cx="136" cy="75" r="4" fill="#FF0000"/>
  <circle cx="120" cy="75" r="2" fill="#FFFFFF"/>
  <circle cx="136" cy="75" r="2" fill="#FFFFFF"/>
  
  <!-- Museau -->
  <ellipse cx="128" cy="95" rx="12" ry="8" fill="#654321"/>
  
  <!-- Pattes -->
  <rect x="80" y="160" width="12" height="30" fill="url(#horseGradient)" stroke="#654321" stroke-width="2"/>
  <rect x="96" y="160" width="12" height="30" fill="url(#horseGradient)" stroke="#654321" stroke-width="2"/>
  <rect x="148" y="160" width="12" height="30" fill="url(#horseGradient)" stroke="#654321" stroke-width="2"/>
  <rect x="164" y="160" width="12" height="30" fill="url(#horseGradient)" stroke="#654321" stroke-width="2"/>
  
  <!-- Roues -->
  <circle cx="70" cy="210" r="15" fill="#8B4513" stroke="#654321" stroke-width="2"/>
  <circle cx="70" cy="210" r="8" fill="#654321"/>
  <circle cx="186" cy="210" r="15" fill="#8B4513" stroke="#654321" stroke-width="2"/>
  <circle cx="186" cy="210" r="8" fill="#654321"/>
  
  <!-- Détails du bois -->
  <line x1="50" y1="190" x2="206" y2="190" stroke="#8B4513" stroke-width="1"/>
  <line x1="50" y1="200" x2="206" y2="200" stroke="#8B4513" stroke-width="1"/>
  <line x1="50" y1="210" x2="206" y2="210" stroke="#8B4513" stroke-width="1"/>
  
  <!-- Éléments de danger/virus -->
  <circle cx="40" cy="40" r="8" fill="url(#dangerGradient)" opacity="0.8">
    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="216" cy="40" r="8" fill="url(#dangerGradient)" opacity="0.8">
    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="40" cy="216" r="8" fill="url(#dangerGradient)" opacity="0.8">
    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="216" cy="216" r="8" fill="url(#dangerGradient)" opacity="0.8">
    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
  </circle>
  
  <!-- Symbole de virus/malware -->
  <g transform="translate(128, 50)">
    <circle r="12" fill="none" stroke="url(#dangerGradient)" stroke-width="2" opacity="0.7">
      <animate attributeName="r" values="12;15;12" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <circle r="6" fill="url(#dangerGradient)" opacity="0.9">
      <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  </g>
  
  <!-- Texte "TROJAN" -->
  <text x="128" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FF4444">TROJAN</text>
</svg>`;

// Sauvegarder le SVG
fs.writeFileSync('assets/trojan-horse.svg', svgContent);
console.log('✅ Fichier SVG créé: assets/trojan-horse.svg');

// Créer un fichier .ico simple (format binaire minimal)
// Note: Ceci est un placeholder. Pour un vrai .ico, il faudrait une bibliothèque de conversion
const icoHeader = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type: ICO
    0x01, 0x00, // Number of images: 1
    0x20, 0x00, // Width: 32
    0x20, 0x00, // Height: 32
    0x00,       // Color count: 0 (true color)
    0x00,       // Reserved
    0x01, 0x00, // Color planes: 1
    0x20, 0x00, // Bits per pixel: 32
    0x00, 0x00, 0x00, 0x00, // Size: 0 (placeholder)
    0x16, 0x00, 0x00, 0x00  // Offset: 22 (header size)
]);

// Créer une image PNG simple (32x32 pixels, rouge pour le cheval de Troie)
const pngData = Buffer.alloc(1024); // 32x32 pixels * 4 bytes (RGBA)
for (let i = 0; i < 1024; i += 4) {
    pngData[i] = 0xFF;     // Rouge
    pngData[i + 1] = 0x00; // Vert
    pngData[i + 2] = 0x00; // Bleu
    pngData[i + 3] = 0xFF; // Alpha
}

// Combiner header ICO + données PNG
const icoData = Buffer.concat([icoHeader, pngData]);

// Sauvegarder le fichier .ico
fs.writeFileSync('assets/icon.ico', icoData);
console.log('✅ Fichier ICO créé: assets/icon.ico');

// Créer aussi un fichier de métadonnées
const metadata = {
    name: "Trojan Horse Icon",
    description: "Icône de cheval de Troie pour La Machine Éthique - Détection de Malware",
    author: "La Machine Éthique",
    version: "1.0.0",
    created: new Date().toISOString(),
    format: "ICO",
    size: "32x32",
    colors: ["Rouge", "Noir", "Marron"],
    theme: "Cybersécurité - Malware"
};

fs.writeFileSync('assets/icon-metadata.json', JSON.stringify(metadata, null, 2));
console.log('✅ Métadonnées créées: assets/icon-metadata.json');

console.log('\n🎉 Icône de cheval de Troie créée avec succès!');
console.log('\n📁 Fichiers créés:');
console.log('✅ assets/trojan-horse.svg - Version vectorielle');
console.log('✅ assets/icon.ico - Icône pour l\'exécutable');
console.log('✅ assets/icon-metadata.json - Métadonnées');

console.log('\n🚀 Tu peux maintenant relancer la commande de build:');
console.log('npx electron-builder --config electron-builder-config.json --win portable'); 