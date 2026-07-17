export interface ParsedBlock {
  type: 'heading' | 'numbered' | 'bullet' | 'table' | 'paragraph' | 'image';
  listStyle?: 'decimal' | 'lower-alpha' | 'disc';
  startIndex?: number;
  content?: string;
  headers?: string[];
  caption?: string;
  rows?: string[][];
  key: string | number;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string;
}

export const parseRichText = (text: string): ParsedBlock[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];
  
  // Regular formatting helpers
  const format = (textToFormat: string) => {
    let temp = textToFormat;
    // Bold
    temp = temp.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Underline
    temp = temp.replace(/__(.*?)__/g, '<u>$1</u>');
    // Italic (needs to be checked after bold and underline to avoid conflict with * or _)
    temp = temp.replace(/\*(.*?)\*/g, '<em>$1</em>');
    temp = temp.replace(/_(.*?)_/g, '<em>$1</em>');
    // Inline images: ![Alt](URL)
    temp = temp.replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" style="max-height: 250px; max-width: 100%; border-radius: 4px; display: inline-block; vertical-align: middle; margin: 4px 0;" />');
    // Markdown links: [Title](URL) - negative lookbehind for !
    temp = temp.replace(/(?<!\!)\[([^\]]+)\]\((https?:\/\/[^\s)]+|data:image\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">$1</a>');
    return temp;
  };

  let i = 0;
  let currentAlign: 'left' | 'center' | 'right' | 'justify' | undefined = undefined;
  let currentLineHeight: string | undefined = undefined;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if it's the start of a table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[][] = [];
      let headerRow: string[] | null = null;
      let tableWidth = '100%';
      let tableCaption = '';

      // Check if previous blocks were width or caption comments
      while (blocks.length > 0 && blocks[blocks.length - 1].type === 'paragraph') {
        const prevBlock = blocks[blocks.length - 1];
        const widthMatch = prevBlock.content?.match(/<!-- width:\s*(.*?)\s*-->/);
        const captionMatch = prevBlock.content?.match(/<!-- caption:\s*(.*?)\s*-->/);
        
        if (widthMatch) {
          tableWidth = widthMatch[1];
          blocks.pop();
        } else if (captionMatch) {
          tableCaption = captionMatch[1];
          blocks.pop();
        } else {
          break;
        }
      }
      
      // Parse table lines
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const currentTrimmed = lines[i].trim();
        // Check if it's a separator line like `| :--- | :--- |` or `| --- |`
        const isSeparator = /^\|[\s\-:|]*\|$/.test(currentTrimmed);
        
        if (!isSeparator) {
          // Extract cells, filtering out the first and last empty elements from split
          const cells = currentTrimmed
            .split('|')
            .slice(1, -1)
            .map(cell => format(cell.trim()));
            
          if (!headerRow) {
            headerRow = cells;
          } else {
            tableRows.push(cells);
          }
        }
        i++;
      }
      
      // If we got a table, check if we have rows or just a header
      if (headerRow) {
        blocks.push({
          type: 'table',
          headers: headerRow,
          rows: tableRows,
          key: `table-${i}`,
          align: currentAlign,
          content: tableWidth, // Use content to store width
          caption: tableCaption
        });
      }
      continue;
    }
    
    // Determine alignment & line spacing tags
    const fullAlignMatch = trimmed.match(/^<div\s+style=["'](.*?)["']>(.*?)<\/div>$/i);
    const alignOpenMatch = trimmed.match(/^<div\s+style=["'](.*?)["']>/i);
    const alignCloseMatch = trimmed.match(/^<\/div>/i);

    if (fullAlignMatch) {
      const styleString = fullAlignMatch[1];
      const innerContent = fullAlignMatch[2];
      
      let alignType: 'left' | 'center' | 'right' | 'justify' | undefined = undefined;
      const alignMatch = styleString.match(/text-align:\s*(left|center|right|justify)/i);
      if (alignMatch) {
        alignType = alignMatch[1] as any;
      }

      let lineHeightVal: string | undefined = undefined;
      const lhMatch = styleString.match(/line-height:\s*([\d\.]+)/i);
      if (lhMatch) {
        lineHeightVal = lhMatch[1];
      }
      
      const trimmedInner = innerContent.trim();
      if (trimmedInner.startsWith('# ')) {
        blocks.push({ type: 'heading', content: format(trimmedInner.substring(2)), key: i, align: alignType, lineHeight: lineHeightVal });
      } else if (trimmedInner.startsWith('## ')) {
        blocks.push({ type: 'heading', content: format(trimmedInner.substring(3)), key: i, align: alignType, lineHeight: lineHeightVal });
      } else if (trimmedInner.startsWith('### ')) {
        blocks.push({ type: 'heading', content: format(trimmedInner.substring(4)), key: i, align: alignType, lineHeight: lineHeightVal });
      } else if (trimmedInner.startsWith('1. ') || /^\d+\.\s/.test(trimmedInner) || /^\d+\)\s/.test(trimmedInner)) {
        const match = trimmedInner.match(/^(\d+)(\.|\))\s/);
        const startIndex = match ? parseInt(match[1], 10) : 1;
        const content = trimmedInner.replace(/^(\d+\.|\d+\))\s/, '');
        blocks.push({ type: 'numbered', listStyle: 'decimal', startIndex, content: format(content), key: i, align: alignType, lineHeight: lineHeightVal });
      } else if (/^[a-zA-Z]\.\s/.test(trimmedInner) || /^[a-zA-Z]\)\s/.test(trimmedInner)) {
        const match = trimmedInner.match(/^([a-zA-Z])(\.|\))\s/);
        const char = match ? match[1].toLowerCase() : 'a';
        const startIndex = char.charCodeAt(0) - 96;
        const content = trimmedInner.replace(/^([a-zA-Z]\.|[a-zA-Z]\))\s/, '');
        blocks.push({ type: 'numbered', listStyle: 'lower-alpha', startIndex, content: format(content), key: i, align: alignType, lineHeight: lineHeightVal });
      } else if (trimmedInner.startsWith('- ')) {
        blocks.push({ type: 'bullet', listStyle: 'disc', content: format(trimmedInner.substring(2)), key: i, align: alignType, lineHeight: lineHeightVal });
      } else {
        blocks.push({
          type: 'paragraph',
          content: format(innerContent),
          key: i,
          align: alignType,
          lineHeight: lineHeightVal
        });
      }
      i++;
      continue;
    }

    if (alignOpenMatch) {
      const styleString = alignOpenMatch[1];
      const alignMatch = styleString.match(/text-align:\s*(left|center|right|justify)/i);
      if (alignMatch) {
        currentAlign = alignMatch[1] as any;
      }
      const lhMatch = styleString.match(/line-height:\s*([\d\.]+)/i);
      if (lhMatch) {
        currentLineHeight = lhMatch[1];
      }
      i++;
      continue;
    }

    if (alignCloseMatch) {
      currentAlign = undefined;
      currentLineHeight = undefined;
      i++;
      continue;
    }

    // Process normal formats
    let lineText = trimmed;
    let explicitClosingStyle = false;
    
    if (trimmed.endsWith('</div>')) {
      lineText = trimmed.substring(0, trimmed.length - 6).trim();
      explicitClosingStyle = true;
    }

    // Check if it's a markdown image or plain URL
    const isFullLineImage = /^!\[.*?\]\((.*?)\)$/i.test(lineText);
    const imgMatch = lineText.match(/!\[.*?\]\((.*?)\)/i);
    const isPlainUrl = (lineText.startsWith('http://') || lineText.startsWith('https://') || lineText.startsWith('data:image/')) && !lineText.includes(' ');
    
    if (isFullLineImage && imgMatch) {
      blocks.push({ type: 'image', content: imgMatch[1], key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (isPlainUrl) {
      blocks.push({ type: 'image', content: lineText, key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (lineText === '') {
      blocks.push({ type: 'paragraph', content: '', key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (lineText.startsWith('# ')) {
      blocks.push({ type: 'heading', content: format(lineText.substring(2)), key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (lineText.startsWith('## ')) {
      blocks.push({ type: 'heading', content: format(lineText.substring(3)), key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (lineText.startsWith('### ')) {
      blocks.push({ type: 'heading', content: format(lineText.substring(4)), key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (lineText.startsWith('1. ') || /^\d+\.\s/.test(lineText) || /^\d+\)\s/.test(lineText)) {
      const match = lineText.match(/^(\d+)(\.|\))\s/);
      const startIndex = match ? parseInt(match[1], 10) : 1;
      const content = lineText.replace(/^(\d+\.|\d+\))\s/, '');
      blocks.push({ type: 'numbered', listStyle: 'decimal', startIndex, content: format(content), key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (/^[a-zA-Z]\.\s/.test(lineText) || /^[a-zA-Z]\)\s/.test(lineText)) {
      const match = lineText.match(/^([a-zA-Z])(\.|\))\s/);
      const char = match ? match[1].toLowerCase() : 'a';
      const startIndex = char.charCodeAt(0) - 96;
      const content = lineText.replace(/^([a-zA-Z]\.|[a-zA-Z]\))\s/, '');
      blocks.push({ type: 'numbered', listStyle: 'lower-alpha', startIndex, content: format(content), key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else if (lineText.startsWith('- ')) {
      blocks.push({ type: 'bullet', listStyle: 'disc', content: format(lineText.substring(2)), key: i, align: currentAlign, lineHeight: currentLineHeight });
    } else {
      blocks.push({ type: 'paragraph', content: format(lineText), key: i, align: currentAlign, lineHeight: currentLineHeight });
    }
    
    // If the line had an explicit closing div, clear the current active style text-align and line-height context
    if (explicitClosingStyle) {
      currentAlign = undefined;
      currentLineHeight = undefined;
    }
    
    i++;
  }
  
  return blocks;
};

export interface BlockGroup {
  type: ParsedBlock['type'] | 'list_group';
  listType?: 'bullet' | 'numbered';
  listStyle?: 'decimal' | 'lower-alpha' | 'disc';
  startIndex?: number;
  items?: ParsedBlock[];
  block?: ParsedBlock;
  align?: string;
  key: string | number;
}

export const groupBlocks = (blocks: ParsedBlock[]): BlockGroup[] => {
  const grouped: BlockGroup[] = [];
  let currentList: any = null;

  blocks.forEach((block, idx) => {
    const isList = block.type === 'bullet' || block.type === 'numbered';
    if (isList) {
      if (currentList && currentList.listType === block.type && currentList.listStyle === block.listStyle && currentList.align === block.align) {
        currentList.items.push(block);
      } else {
        currentList = { 
          type: 'list_group', 
          listType: block.type, 
          listStyle: block.listStyle,
          startIndex: block.startIndex || 1,
          items: [block], 
          align: block.align, 
          key: `list-${idx}` 
        };
        grouped.push(currentList);
      }
    } else {
      currentList = null;
      grouped.push({
        type: block.type,
        block: block,
        align: block.align,
        key: block.key
      });
    }
  });

  return grouped;
};

export const markdownToHtml = (markdown: string): string => {
  const blocks = parseRichText(markdown);
  const groups = groupBlocks(blocks);
  let html = '';
  
  groups.forEach(group => {
    let styles = [];
    if (group.align) styles.push(`text-align: ${group.align};`);
    // Note: lineHeight is only on individual blocks, we can pull it from the first item for groups
    const baseBlock = group.type === 'list_group' ? group.items![0] : group.block!;
    if (baseBlock.lineHeight) styles.push(`line-height: ${baseBlock.lineHeight};`);
    const styleAttr = styles.length > 0 ? ` style="${styles.join(' ')}"` : '';

    if (group.type === 'list_group') {
      const tag = group.listType === 'bullet' ? 'ul' : 'ol';
      let listStyles = [...styles];
      if (group.listStyle === 'lower-alpha') {
        listStyles.push('list-style-type: lower-alpha;');
        listStyles.push('margin-left: 40px;');
      } else {
        listStyles.push('margin-left: 20px;');
      }
      const listStyleAttr = listStyles.length > 0 ? ` style="${listStyles.join(' ')}"` : '';
      const startAttr = (group.listType === 'numbered' && group.startIndex && group.startIndex > 1) ? ` start="${group.startIndex}"` : '';
      
      html += `<${tag}${listStyleAttr}${startAttr}>`;
      group.items!.forEach(item => {
        html += `<li>${item.content || '<br>'}</li>`;
      });
      html += `</${tag}>`;
    } else if (group.type === 'heading') {
      html += `<h2${styleAttr}>${group.block!.content || ''}</h2>`;
    } else if (group.type === 'image') {
      html += `<div style="text-align: center; margin: 10px 0;"><img src="${group.block!.content || ''}" style="max-height: 300px; max-width: 100%; border-radius: 6px;" /></div>`;
    } else if (group.type === 'table') {
      const block = group.block!;
      const tableWidth = block.content || '100%'; // We'll store width in content for tables
      let tableHtml = `<table style="width: ${tableWidth}; border-collapse: collapse; margin: 10px auto; font-size: 12px; border: 1px solid #cbd5e1;">`;
      if (block.caption) {
        tableHtml += `<caption style="caption-side: top; padding: 5px; font-weight: bold; text-align: center; font-size: 14px; color: #1e293b;">${block.caption}</caption>`;
      }
      if (block.headers) {
        tableHtml += `<thead style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1;"><tr>`;
        block.headers.forEach(h => {
          tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 6px 12px; font-weight: 600; text-align: center;">${h}</th>`;
        });
        tableHtml += `</tr></thead>`;
      }
      if (block.rows) {
        tableHtml += `<tbody>`;
        block.rows.forEach(row => {
          tableHtml += `<tr>`;
          row.forEach(cell => {
            tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 6px 12px;">${cell}</td>`;
          });
          tableHtml += `</tr>`;
        });
        tableHtml += `</tbody>`;
      }
      tableHtml += `</table>`;
      html += tableHtml;
    } else if (group.type === 'paragraph') {
      if (group.block!.content === '') {
        html += `<p${styleAttr}><br></p>`;
      } else {
        html += `<p${styleAttr}>${group.block!.content || ''}</p>`;
      }
    }
  });
  
  return html || '<p><br></p>';
};

export const htmlToMarkdown = (html: string): string => {
  if (typeof window === 'undefined' || !window.DOMParser) {
    return html;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  let markdown = '';

  const cleanText = (node: Node): string => {
    let text = '';
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent || '';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const elStyle = el.getAttribute('style') || '';
        
        if (tagName === 'strong' || tagName === 'b' || elStyle.includes('font-weight: bold') || elStyle.includes('font-weight: 700') || elStyle.includes('font-weight:bold')) {
          text += `**${cleanText(el)}**`;
        } else if (tagName === 'u' || elStyle.includes('text-decoration: underline') || elStyle.includes('text-decoration:underline')) {
          text += `__${cleanText(el)}__`;
        } else if (tagName === 'em' || tagName === 'i' || elStyle.includes('font-style: italic') || elStyle.includes('font-style:italic')) {
          text += `*${cleanText(el)}*`;
        } else if (tagName === 'a') {
          const href = el.getAttribute('href') || '#';
          text += `[${cleanText(el)}](${href})`;
        } else if (tagName === 'img') {
          const src = el.getAttribute('src') || '';
          text += `![Image](${src})`;
        } else if (tagName === 'br') {
          text += '\n';
        } else {
          text += cleanText(el);
        }
      }
    });
    return text;
  };

  const processElement = (el: HTMLElement, parentAlign?: string, parentLineHeight?: string): string => {
    const tagName = el.tagName.toLowerCase();
    
    // Get alignment and line height styling
    let align = parentAlign;
    let lineHeight = parentLineHeight;
    const style = el.getAttribute('style') || '';
    const alignMatch = style.match(/text-align:\s*(left|center|right|justify)/i);
    if (alignMatch) {
      align = alignMatch[1];
    }
    const lhMatch = style.match(/line-height:\s*([\d\.]+)/i);
    if (lhMatch) {
      lineHeight = lhMatch[1];
    }

    const wrapAlign = (text: string): string => {
      let styles = [];
      if (align && align !== 'left') {
        styles.push(`text-align: ${align};`);
      }
      if (lineHeight) {
        styles.push(`line-height: ${lineHeight};`);
      }
      if (styles.length > 0) {
        return `<div style="${styles.join(' ')}">${text}</div>`;
      }
      return text;
    };

    if (tagName === 'p' || tagName === 'div') {
      const text = cleanText(el).trim();
      if (!text || el.innerHTML === '<br>' || el.innerHTML === '') {
        return '\n';
      }
      // Check if it's just an image
      if (text.startsWith('![Image]') && text.endsWith(')') && !text.includes('\n')) {
        return wrapAlign(text) + '\n';
      }
      return wrapAlign(text) + '\n';
    }

    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
      const text = cleanText(el).trim();
      const level = tagName === 'h1' ? '# ' : tagName === 'h2' ? '## ' : '### ';
      return wrapAlign(`${level}${text}`) + '\n';
    }

    if (tagName === 'ul') {
      let itemsStr = '';
      el.querySelectorAll('li').forEach(li => {
        const itemText = cleanText(li).trim();
        itemsStr += wrapAlign(`- ${itemText}`) + '\n';
      });
      return itemsStr;
    }

    if (tagName === 'ol') {
      let itemsStr = '';
      const listStyle = el.style.listStyleType || '';
      const isAlpha = listStyle.includes('alpha') || el.getAttribute('type') === 'a';
      const startAttr = el.getAttribute('start');
      const startIndex = startAttr ? parseInt(startAttr, 10) : 1;
      
      el.querySelectorAll('li').forEach((li, idx) => {
        const itemText = cleanText(li).trim();
        if (isAlpha) {
          const letter = String.fromCharCode(97 + ((startIndex - 1 + idx) % 26)); // a, b, c...
          itemsStr += wrapAlign(`${letter}. ${itemText}`) + '\n';
        } else {
          itemsStr += wrapAlign(`${startIndex + idx}. ${itemText}`) + '\n';
        }
      });
      return itemsStr;
    }

    if (tagName === 'img') {
      const src = el.getAttribute('src') || '';
      return src ? wrapAlign(`![Image](${src})`) + '\n' : '';
    }

    if (tagName === 'table') {
      let tableStr = '\n';
      const width = el.style.width || '100%';
      if (width !== '100%') {
        tableStr += `<!-- width: ${width} -->\n`;
      }
      
      const captionEl = el.querySelector('caption');
      if (captionEl) {
        tableStr += `<!-- caption: ${cleanText(captionEl).trim()} -->\n`;
      }

      const headers: string[] = [];
      const rows: string[][] = [];

      el.querySelectorAll('th').forEach(th => {
        headers.push(cleanText(th).trim() || ' ');
      });

      el.querySelectorAll('tr').forEach(tr => {
        if (tr.querySelector('th')) return;
        
        const rowCells: string[] = [];
        tr.querySelectorAll('td').forEach(td => {
          rowCells.push(cleanText(td).trim() || ' ');
        });
        if (rowCells.length > 0) {
          rows.push(rowCells);
        }
      });

      if (headers.length > 0) {
        tableStr += '| ' + headers.join(' | ') + ' |\n';
        tableStr += '| ' + headers.map(() => ':---').join(' | ') + ' |\n';
      } else if (rows.length > 0) {
        const maxCols = Math.max(...rows.map(r => r.length));
        const dummyHeaders = Array.from({ length: maxCols }, (_, i) => `Kolom ${i + 1}`);
        tableStr += '| ' + dummyHeaders.join(' | ') + ' |\n';
        tableStr += '| ' + dummyHeaders.map(() => ':---').join(' | ') + ' |\n';
      }

      rows.forEach(row => {
        tableStr += '| ' + row.join(' | ') + ' |\n';
      });

      return tableStr + '\n';
    }

    let recur = '';
    el.childNodes.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        recur += processElement(child as HTMLElement, align, lineHeight);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const txt = child.textContent?.trim();
        if (txt) recur += txt + '\n';
      }
    });
    return recur;
  };

  body.childNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      markdown += processElement(node as HTMLElement);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.textContent?.trim();
      if (txt) markdown += txt + '\n';
    }
  });

  return markdown.replace(/\n{3,}/g, '\n\n').trim();
};
