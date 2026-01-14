const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'questions.json');

function quoteNumericKeysInObjectText(objText) {
	// Replace unquoted numeric keys like: 1: or  23 : with "1":
	return objText.replace(/([\{,\s])(\d+)\s*:/g, (m, p1, p2) => `${p1}\"${p2}\":`);
}

function findMatchingBrace(text, startIdx) {
	let depth = 0;
	for (let i = startIdx; i < text.length; i++) {
		const ch = text[i];
		if (ch === '{') depth++;
		else if (ch === '}') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

try {
	let content = fs.readFileSync(filePath, 'utf8');

	const keyRegex = /"score_mapping"\s*:\s*\{/g;
	let out = '';
	let lastIdx = 0;
	let m;

	while ((m = keyRegex.exec(content)) !== null) {
		const matchStart = m.index;
		// find the position of the opening brace for this match
		const bracePos = content.indexOf('{', matchStart + m[0].length - 1);
		if (bracePos === -1) break;
		const endPos = findMatchingBrace(content, bracePos);
		if (endPos === -1) break;

		out += content.slice(lastIdx, bracePos);
		const objText = content.slice(bracePos, endPos + 1);
		const fixed = quoteNumericKeysInObjectText(objText);
		out += fixed;
		lastIdx = endPos + 1;
	}

	out += content.slice(lastIdx);

	if (out === content) {
		console.log('No changes needed: no unquoted numeric keys found in score_mapping blocks.');
	} else {
		fs.writeFileSync(filePath, out, 'utf8');
		console.log('Updated questions.json — numeric keys in score_mapping are now quoted.');
	}
} catch (err) {
	console.error('Error processing questions.json:', err);
	process.exitCode = 2;
}

