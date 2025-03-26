var showdown = require('showdown');
var converter = new showdown.Converter();

function markdownToHtml(markdown: string): string {
    return converter.makeHtml(markdown);
}

export { markdownToHtml };