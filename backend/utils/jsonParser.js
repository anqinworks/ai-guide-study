/**
 * 增强的JSON解析工具
 * 专门处理AI返回结果中包含科学计算表达式、代码格式等特殊内容时的JSON解析问题
 */

const { smartRepairJson } = require('./jsonRepair');

/**
 * 预处理JSON字符串，处理特殊格式内容
 * @param {string} jsonString - 原始JSON字符串
 * @returns {string} - 预处理后的JSON字符串
 */
function preprocessJsonString(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  let processed = jsonString;

  // 1. 移除可能的BOM标记
  processed = processed.replace(/^\uFEFF/, '');

  // 2. 处理未转义的换行符（在字符串值中）
  // 注意：这个处理比较复杂，因为需要区分已转义和未转义的字符
  // 我们使用更保守的方法，只在明显需要的地方进行修复

  // 3. 处理科学计算表达式中的特殊字符
  // 例如：E+、E-、e+、e-（科学计数法）
  // 这些在JSON中通常是合法的，但需要确保它们不在字符串边界外
  // 在字符串值内部，这些是合法的，不需要转义

  // 4. 处理代码块中的特殊字符
  // 代码块通常在字符串值中，已经通过步骤2处理了换行符
  // 但需要确保代码中的引号被正确转义
  // 这个在JSON.parse时会自动处理，但我们可以预先检查

  // 5. 移除JSON字符串前后的多余空白字符和标记
  processed = processed.trim();

  // 6. 处理可能的Markdown代码块标记
  // 如果JSON被包裹在```json或```中，移除这些标记
  processed = processed.replace(/^```(?:json)?\s*\n?/i, '');
  processed = processed.replace(/\n?```\s*$/i, '');

  // 7. 处理可能的说明文字前缀
  // 例如："以下是JSON格式的数据：[...]"
  // 尝试提取第一个完整的JSON数组或对象
  // 使用非贪婪匹配，但需要确保匹配到完整的JSON结构
  const jsonArrayMatch = processed.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  // 如果非贪婪匹配失败，尝试贪婪匹配（可能包含多个对象）
  const jsonArrayMatchGreedy = processed.match(/\[\s*\{[\s\S]*\}\s*\]/);
  const jsonObjectMatch = processed.match(/\{\s*"[\s\S]*?"\s*\}/);
  
  if (jsonArrayMatch) {
    processed = jsonArrayMatch[0];
  } else if (jsonArrayMatchGreedy) {
    processed = jsonArrayMatchGreedy[0];
  } else if (jsonObjectMatch) {
    processed = jsonObjectMatch[0];
  }

  // 8. 修复常见的JSON格式问题
  // 8.1 修复单引号（JSON不支持单引号）
  // 但要注意，单引号可能在字符串值中，需要小心处理
  // 这里我们只处理键名和字符串值边界外的单引号
  processed = processed.replace(/'/g, (match, offset, str) => {
    // 检查前后字符，判断是否在字符串值中
    // 这是一个简化的检查，更复杂的需要完整的JSON解析器
    // 暂时跳过，因为单引号在字符串值中可能是合法的内容
    return match;
  });

  // 8.2 修复尾随逗号
  processed = processed.replace(/,(\s*[}\]])/g, '$1');

  // 8.3 确保字符串值中的特殊字符被正确转义
  // 这个比较复杂，我们通过多次尝试解析来处理

  return processed.trim();
}

/**
 * 识别并转义特殊格式内容
 * @param {string} value - 需要处理的值
 * @returns {string} - 转义后的值
 */
function escapeSpecialContent(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // 这里主要是确保字符串值在JSON中是安全的
  // JSON.stringify会自动处理转义，所以这个函数主要用于预处理
  return value;
}

/**
 * 增强的JSON解析函数，包含错误恢复机制
 * @param {string} jsonString - 要解析的JSON字符串
 * @param {Object} options - 解析选项
 * @returns {Object|Array} - 解析后的JSON对象或数组
 * @throws {Error} - 如果所有解析尝试都失败
 */
function parseJsonSafely(jsonString, options = {}) {
  const {
    maxRetries = 3,
    enablePreprocessing = true,
    enableRecovery = true,
    logErrors = true
  } = options;

  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('输入必须是有效的字符串');
  }

  let processedString = jsonString;
  let lastError = null;

  // 尝试1: 直接解析（最快）
  try {
    return JSON.parse(processedString);
  } catch (error) {
    lastError = error;
    if (logErrors) {
      console.log('[JSON解析] 直接解析失败，尝试预处理...', error.message);
    }
  }

  // 尝试2: 预处理后解析
  if (enablePreprocessing) {
    try {
      processedString = preprocessJsonString(jsonString);
      return JSON.parse(processedString);
    } catch (error) {
      lastError = error;
      if (logErrors) {
        console.log('[JSON解析] 预处理后解析失败，尝试恢复机制...', error.message);
      }
    }
  }

  // 尝试3: 使用恢复机制
  if (enableRecovery) {
    try {
      // 尝试提取JSON数组
      const arrayMatch = jsonString.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (arrayMatch) {
        const extracted = arrayMatch[0];
        const preprocessed = preprocessJsonString(extracted);
        return JSON.parse(preprocessed);
      }

      // 尝试提取JSON对象
      const objectMatch = jsonString.match(/\{\s*"[\s\S]*?"\s*\}/);
      if (objectMatch) {
        const extracted = objectMatch[0];
        const preprocessed = preprocessJsonString(extracted);
        return JSON.parse(preprocessed);
      }
    } catch (error) {
      lastError = error;
      if (logErrors) {
        console.log('[JSON解析] 恢复机制失败，尝试逐字符修复...', error.message);
      }
    }
  }

  // 尝试4: 使用智能修复工具（专门处理LaTeX公式等特殊内容）
  try {
    const repaired = smartRepairJson(jsonString);
    return JSON.parse(repaired);
  } catch (error) {
    lastError = error;
    if (logErrors) {
      console.log('[JSON解析] 智能修复失败，尝试逐字符修复...', error.message);
    }
  }

  // 尝试5: 逐字符修复常见问题（增强版，支持LaTeX公式）
  try {
    let fixed = jsonString;
    
    // 修复尾随逗号（在对象和数组的最后一个元素后）
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // 移除Markdown代码块标记
    fixed = fixed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    // 使用状态机修复字符串值中的未转义字符
    // 特别处理LaTeX公式中的特殊字符
    let inString = false;
    let escapeNext = false;
    let result = '';
    let stringStart = -1;
    
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      const prevChar = i > 0 ? fixed[i - 1] : '';
      const nextChar = i + 1 < fixed.length ? fixed[i + 1] : '';
      
      if (escapeNext) {
        // 处理转义序列
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        // 检查是否是字符串内的反斜杠
        if (inString) {
          // 在字符串内，检查下一个字符
          // 如果下一个字符不是有效的转义字符，需要转义这个反斜杠
          // 有效的转义字符：", \, /, b, f, n, r, t, u, 0-9 (用于Unicode转义)
          const validEscapes = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
          const isValidEscape = validEscapes.includes(nextChar) || 
                               (nextChar >= '0' && nextChar <= '9'); // Unicode转义序列的一部分
          
          if (isValidEscape) {
            // 已经是有效的转义序列，保留
            result += char;
            escapeNext = true;
          } else {
            // 不是有效的转义序列，可能是LaTeX命令（如 \sum, \frac）
            // 需要转义反斜杠本身
            result += '\\\\';
            // 不设置escapeNext，让下一个字符正常处理
          }
        } else {
          // 不在字符串内，保留原样
          result += char;
          escapeNext = true;
        }
        continue;
      }
      
      if (char === '"') {
        // 检查是否是转义的引号
        if (prevChar === '\\' && inString) {
          result += char;
          continue;
        }
        // 切换字符串状态
        inString = !inString;
        if (inString) {
          stringStart = i;
        }
        result += char;
        continue;
      }
      
      if (inString) {
        // 在字符串内部，转义控制字符
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char === '\b') {
          result += '\\b';
        } else if (char === '\f') {
          result += '\\f';
        } else {
          result += char;
        }
      } else {
        result += char;
      }
    }
    
    fixed = result;

    return JSON.parse(fixed);
  } catch (error) {
    lastError = error;
    if (logErrors) {
      console.log('[JSON解析] 逐字符修复失败', error.message);
      // 记录错误位置信息
      if (error.message && error.message.includes('position')) {
        const positionMatch = error.message.match(/position (\d+)/);
        if (positionMatch) {
          const pos = parseInt(positionMatch[1]);
          const start = Math.max(0, pos - 50);
          const end = Math.min(jsonString.length, pos + 50);
          console.log('[JSON解析] 错误位置附近的文本:', jsonString.substring(start, end));
        }
      }
    }
  }

  // 尝试5: 使用更激进的方法 - 先提取字符串值，然后修复
  try {
    // 使用正则表达式找到所有字符串值，然后修复其中的特殊字符
    let fixed = jsonString;
    
    // 修复尾随逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 移除Markdown代码块标记
    fixed = fixed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    
    // 使用更智能的方法：找到所有字符串值并修复
    // 匹配JSON字符串值："..." 或 '...'（虽然JSON标准不支持单引号，但有些AI可能使用）
    fixed = fixed.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content, escapePart) => {
      // content是字符串内容（不包括引号）
      // 检查内容中是否有未转义的特殊字符
      let fixedContent = content;
      
      // 修复未转义的控制字符（但保留已转义的）
      fixedContent = fixedContent.replace(/(?<!\\)\n/g, '\\n');
      fixedContent = fixedContent.replace(/(?<!\\)\r/g, '\\r');
      fixedContent = fixedContent.replace(/(?<!\\)\t/g, '\\t');
      fixedContent = fixedContent.replace(/(?<!\\)\b/g, '\\b');
      fixedContent = fixedContent.replace(/(?<!\\)\f/g, '\\f');
      
      // 修复未转义的反斜杠（但保留已转义的转义序列）
      // 这是一个复杂的问题，因为LaTeX命令如 \sum 中的反斜杠需要保留
      // 但如果AI返回的JSON中反斜杠没有正确转义，我们需要修复
      // 这里我们采用保守策略：只修复明显错误的未转义反斜杠
      
      return `"${fixedContent}"`;
    });
    
    return JSON.parse(fixed);
  } catch (error) {
    lastError = error;
    if (logErrors) {
      console.log('[JSON解析] 字符串值修复失败', error.message);
    }
  }

  // 所有尝试都失败
  if (logErrors) {
    console.error('[JSON解析] 所有解析尝试都失败');
    console.error('[JSON解析] 最后错误:', lastError);
    console.error('[JSON解析] 原始内容长度:', jsonString.length);
    console.error('[JSON解析] 原始内容预览:', jsonString.substring(0, 500));
  }

  throw new Error(`JSON解析失败: ${lastError ? lastError.message : '未知错误'}`);
}

/**
 * 使用括号匹配算法提取完整的JSON数组
 * @param {string} text - 要搜索的文本
 * @param {number} startIndex - 开始搜索的索引位置
 * @returns {string|null} - 提取的JSON数组字符串，如果未找到则返回null
 */
function extractCompleteJsonArray(text, startIndex = 0) {
  // 查找第一个 '['
  const arrayStart = text.indexOf('[', startIndex);
  if (arrayStart === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let i = arrayStart;

  while (i < text.length) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : '';

    if (escapeNext) {
      escapeNext = false;
      i++;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      i++;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      i++;
      continue;
    }

    if (!inString) {
      if (char === '[') {
        depth++;
      } else if (char === ']') {
        depth--;
        if (depth === 0) {
          // 找到了完整的数组
          return text.substring(arrayStart, i + 1);
        }
      }
    }

    i++;
  }

  return null;
}

/**
 * 从AI响应文本中提取并解析JSON
 * @param {string} aiResponseText - AI返回的完整文本
 * @param {Object} options - 解析选项
 * @returns {Object|Array} - 解析后的JSON对象或数组
 */
function extractAndParseJson(aiResponseText, options = {}) {
  if (!aiResponseText || typeof aiResponseText !== 'string') {
    throw new Error('AI响应文本无效');
  }

  // 方法1: 使用括号匹配算法提取完整的JSON数组（最可靠的方法）
  try {
    const jsonArray = extractCompleteJsonArray(aiResponseText);
    if (jsonArray) {
      try {
        return parseJsonSafely(jsonArray, options);
      } catch (error) {
        console.warn('[JSON提取] 括号匹配提取的数组解析失败，尝试其他方法...', error.message);
        // 记录错误位置附近的文本，帮助调试
        if (error.message.includes('position')) {
          const positionMatch = error.message.match(/position (\d+)/);
          if (positionMatch) {
            const pos = parseInt(positionMatch[1]);
            const start = Math.max(0, pos - 50);
            const end = Math.min(jsonArray.length, pos + 50);
            console.warn('[JSON提取] 错误位置附近的文本:', jsonArray.substring(start, end));
          }
        }
      }
    }
  } catch (error) {
    console.warn('[JSON提取] 括号匹配提取失败:', error.message);
  }

  // 方法2: 尝试使用正则表达式提取（作为备用方案）
  // 使用贪婪匹配以处理多对象数组
  const jsonArrayPatternGreedy = /\[\s*\{[\s\S]*\}\s*\]/;
  let arrayMatch = aiResponseText.match(jsonArrayPatternGreedy);
  
  if (arrayMatch) {
    try {
      return parseJsonSafely(arrayMatch[0], options);
    } catch (error) {
      console.warn('[JSON提取] 正则提取的数组解析失败，尝试其他方法...', error.message);
    }
  }

  // 方法3: 尝试提取JSON对象
  const jsonObjectPattern = /\{\s*"[\s\S]*?"\s*\}/;
  const objectMatch = aiResponseText.match(jsonObjectPattern);
  
  if (objectMatch) {
    try {
      return parseJsonSafely(objectMatch[0], options);
    } catch (error) {
      console.warn('[JSON提取] 对象提取失败，尝试直接解析...', error.message);
    }
  }

  // 方法4: 如果都失败，尝试直接解析整个文本
  try {
    return parseJsonSafely(aiResponseText, options);
  } catch (error) {
    // 记录详细的错误信息
    console.error('[JSON提取] 所有提取方法都失败');
    console.error('[JSON提取] 错误信息:', error.message);
    console.error('[JSON提取] AI响应文本长度:', aiResponseText.length);
    console.error('[JSON提取] AI响应文本预览 (前500字符):', aiResponseText.substring(0, 500));
    
    // 如果错误信息包含位置信息，显示该位置附近的文本
    if (error.message && error.message.includes('position')) {
      const positionMatch = error.message.match(/position (\d+)/);
      if (positionMatch) {
        const pos = parseInt(positionMatch[1]);
        const start = Math.max(0, pos - 100);
        const end = Math.min(aiResponseText.length, pos + 100);
        console.error('[JSON提取] 错误位置附近的文本:', aiResponseText.substring(start, end));
        console.error('[JSON提取] 错误位置:', pos, '字符:', aiResponseText[pos]);
      }
    }
    
    throw new Error(`无法从AI响应中提取有效的JSON: ${error.message}`);
  }
}

module.exports = {
  parseJsonSafely,
  extractAndParseJson,
  preprocessJsonString,
  escapeSpecialContent,
  extractCompleteJsonArray
};

