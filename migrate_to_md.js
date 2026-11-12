const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '_legacy', 'articles_data.js');
let rawData = fs.readFileSync(dataFile, 'utf-8');

// Strip out the variable assignment to parse JSON
rawData = rawData.replace(/^\s*const\s+(wordpressArticles|mockArticles)\s*=\s*/m, '').replace(/;\s*$/m, '');

let articles;
try {
  articles = JSON.parse(rawData);
} catch (e) {
  console.error("Failed to parse articles JSON", e);
  process.exit(1);
}

const outDir = path.join(__dirname, 'content', 'articles');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

articles.forEach(article => {
  if (!article.slug) return;
  const fileName = `${article.slug}.md`;
  const filePath = path.join(outDir, fileName);
  
  // Format dates: Fri, 09 Jun 2023 12:45:48 +0000 -> YYYY-MM-DD
  let isoDate = article.date;
  try {
    isoDate = new Date(article.date).toISOString().split('T')[0];
  } catch (e) {}

  const yaml = `---
title: "${article.title.replace(/"/g, '\\"')}"
date: "${isoDate}"
category: "${article.category || 'Article'}"
image: "${article.image || ''}"
excerpt: "${(article.excerpt || '').replace(/"/g, '\\"').replace(/\n/g, ' ')}"
---

${article.content || ''}
`;

  fs.writeFileSync(filePath, yaml, 'utf-8');
});

console.log(`Successfully converted ${articles.length} articles to Markdown!`);
