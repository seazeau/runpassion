const fs = require('fs');
const doc = fs.readFileSync('./content/articles/test-hoka-tecton-x2.md', 'utf-8');

let count = 0;
let parsedContent = doc.replace(/<div class="wp-block-kadence-iconlist[^>]*>([\s\S]*?)<\/div>/g, (match, innerHtml) => {
    count++;
    const items = [];
    const liRegex = /<span class="kt-svg-icon-list-text">(.*?)<\/span>/g;
    let matchLi;
    while ((matchLi = liRegex.exec(innerHtml)) !== null) {
        items.push(matchLi[1]);
    }
    const renderedItems = items.map(item => `
        <li class="flex items-center gap-3 bg-brand-cardGray p-4 rounded-xl border border-white/5 shadow-md">
            <svg class="w-5 h-5 text-brand-yellow shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-white font-medium">${item}</span>
        </li>
    `).join('');
    return `<ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">${renderedItems}</ul>`;
});

const idx = parsedContent.indexOf('<ul class="grid');
if (idx > -1) {
    console.log(parsedContent.substring(idx - 100, idx + 800));
} else {
    console.log("Not found.");
}
