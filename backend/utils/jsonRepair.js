/**
 * JSON修复工具 - 专门处理包含LaTeX公式等特殊内容的JSON字符串
 */

/**
 * 修复JSON字符串中的LaTeX公式转义问题
 * 主要处理：
 * 1. LaTeX公式中的反斜杠（如 \sum, \frac）需要转义为 \\
 * 2. 确保字符串值中的特殊字符正确转义
 * 3. 处理未转义的控制字符
 */
function repairJsonWithLatex(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  let result = '';
  let inString = false;
  let escapeNext = false;
  let stringStart = -1;
  let i = 0;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const nextChar = i + 1 < jsonString.length ? jsonString[i + 1] : null;
    const prevChar = i > 0 ? jsonString[i - 1] : null;

    // 处理转义状态
    if (escapeNext) {
      result += char;
      escapeNext = false;
      i++;
      continue;
    }

    // 处理反斜杠
    if (char === '\\') {
      if (inString) {
        // 在字符串内，检查下一个字符
        if (nextChar && ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'].includes(nextChar)) {
          // 有效的JSON转义序列，保留
          result += char;
          escapeNext = true;
        } else {
          // 可能是LaTeX命令（如 \sum），需要转义反斜杠
          result += '\\\\';
          // 不设置escapeNext，让下一个字符正常处理
        }
      } else {
        // 不在字符串内，保留
        result += char;
        escapeNext = true;
      }
      i++;
      continue;
    }

    // 处理引号
    if (char === '"') {
      // 检查是否是转义的引号
      if (prevChar === '\\' && inString) {
        result += char;
        i++;
        continue;
      }
      
      // 切换字符串状态
      inString = !inString;
      if (inString) {
        stringStart = i;
      }
      result += char;
      i++;
      continue;
    }

    // 在字符串内处理特殊字符
    if (inString) {
      // 转义控制字符
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

    i++;
  }

  return result;
}

/**
 * 使用正则表达式修复JSON字符串
 * 这个方法更激进，但可能更有效
 */
function repairJsonWithRegex(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  let fixed = jsonString;

  // 1. 修复尾随逗号
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // 2. 移除Markdown代码块标记
  fixed = fixed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // 3. 修复字符串值中的未转义字符
  // 使用更智能的正则表达式匹配JSON字符串值
  fixed = fixed.replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
    let fixedContent = content;
    
    // 修复未转义的控制字符（使用负向后顾断言确保不是已转义的）
    // 注意：JavaScript的正则表达式不支持后顾断言，所以使用其他方法
    fixedContent = fixedContent.replace(/\n/g, '\\n');
    fixedContent = fixedContent.replace(/\r/g, '\\r');
    fixedContent = fixedContent.replace(/\t/g, '\\t');
    fixedContent = fixedContent.replace(/\b/g, '\\b');
    fixedContent = fixedContent.replace(/\f/g, '\\f');
    
    // 修复未转义的反斜杠（但保留已转义的转义序列）
    // 这是一个复杂的问题，我们需要小心处理
    // 策略：找到所有反斜杠，如果后面不是有效的转义字符，就转义它
    // 注意：JavaScript正则表达式不支持负向后顾断言，所以我们需要使用其他方法
    // 先处理已转义的反斜杠，然后处理未转义的
    // 将已转义的反斜杠临时替换为占位符
    const escapedBackslashPlaceholder = '__ESCAPED_BACKSLASH__';
    fixedContent = fixedContent.replace(/\\\\/g, escapedBackslashPlaceholder);
    // 现在处理未转义的反斜杠（后面不是有效转义字符的）
    fixedContent = fixedContent.replace(/\\(?![\\"\/bfnrtux0-9])/g, '\\\\');
    // 恢复已转义的反斜杠
    fixedContent = fixedContent.replace(new RegExp(escapedBackslashPlaceholder, 'g'), '\\\\');
    
    return `"${fixedContent}"`;
  });

  return fixed;
}

/**
 * 修复未闭合的字符串值
 * 检测并修复JSON中未正确闭合的字符串值
 * 这是处理AI返回的JSON中字符串值未闭合问题的关键函数
 */
function repairUnclosedStrings(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  let result = '';
  let inString = false;
  let escapeNext = false;
  let stringStart = -1;
  let i = 0;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const nextChar = i + 1 < jsonString.length ? jsonString[i + 1] : null;
    const prevChar = i > 0 ? jsonString[i - 1] : null;

    // 处理转义状态
    if (escapeNext) {
      result += char;
      escapeNext = false;
      i++;
      continue;
    }

    // 处理反斜杠
    if (char === '\\') {
      if (inString) {
        // 在字符串内，检查下一个字符是否是有效的转义字符
        if (nextChar && ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'].includes(nextChar)) {
          result += char;
          escapeNext = true;
        } else {
          // 可能是LaTeX命令，转义反斜杠
          result += '\\\\';
        }
      } else {
        result += char;
        escapeNext = true;
      }
      i++;
      continue;
    }

    // 处理引号
    if (char === '"') {
      if (prevChar === '\\' && inString) {
        // 转义的引号，保留
        result += char;
        i++;
        continue;
      }
      
      // 切换字符串状态
      inString = !inString;
      if (inString) {
        stringStart = i;
      }
      result += char;
      i++;
      continue;
    }

    // 在字符串内
    if (inString) {
      // 检查是否应该结束字符串
      // 关键：如果遇到换行符后跟空格和引号（下一个字段的键），说明当前字符串应该结束了
      if (char === '\n' || char === '\r') {
        // 向前看，检查换行符后面是否跟着下一个字段的开始
        let j = i + 1;
        // 跳过空白字符（空格、制表符等）
        while (j < jsonString.length && /\s/.test(jsonString[j])) {
          j++;
        }
        
        if (j < jsonString.length) {
          const afterWhitespace = jsonString[j];
          // 如果换行后遇到引号（下一个字段的键）或大括号/中括号（对象/数组结束）
          if (afterWhitespace === '"' || afterWhitespace === '}' || afterWhitespace === ']') {
            // 字符串应该在这里结束
            // 先闭合字符串（在换行符之前）
            result += '"';
            inString = false;
            // 然后添加换行符（不在字符串内，所以不需要转义）
            result += char;
            i++;
            continue;
          }
        }
        
        // 否则，转义换行符（字符串内的换行符）
        result += char === '\n' ? '\\n' : '\\r';
      } else if (char === ',' && prevChar !== '\\') {
        // 遇到逗号，检查是否是字段分隔符
        // 如果前面有换行符，可能是字符串应该结束了
        let j = i - 1;
        let foundNewline = false;
        // 向前查找，看是否有换行符
        while (j >= 0 && /\s/.test(jsonString[j])) {
          if (jsonString[j] === '\n' || jsonString[j] === '\r') {
            foundNewline = true;
            break;
          }
          j--;
        }
        
        // 检查逗号后面是否跟着换行符和下一个字段
        let k = i + 1;
        while (k < jsonString.length && /\s/.test(jsonString[k])) {
          k++;
        }
        const afterComma = k < jsonString.length ? jsonString[k] : null;
        
        if (foundNewline && afterComma === '"') {
          // 字符串应该在这里结束（在逗号之前）
          result += '"';
          inString = false;
        }
        result += char;
      } else if ((char === '}' || char === ']') && prevChar !== '\\') {
        // 遇到大括号或中括号，说明对象或数组结束
        // 如果还在字符串内，说明字符串未闭合
        result += '"';
        inString = false;
        result += char;
      } else {
        result += char;
      }
    } else {
      // 不在字符串内
      result += char;
    }

    i++;
  }

  // 如果最后还在字符串内，闭合它
  if (inString) {
    result += '"';
  }

  return result;
}

/**
 * 智能修复JSON字符串
 * 结合多种方法，逐步尝试修复
 */
function smartRepairJson(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  // 方法1: 修复未闭合的字符串
  try {
    const repaired0 = repairUnclosedStrings(jsonString);
    JSON.parse(repaired0); // 测试是否能解析
    return repaired0;
  } catch (e) {
    // 方法1失败，尝试方法2
  }

  // 方法2: 使用状态机修复
  try {
    const repaired1 = repairJsonWithLatex(jsonString);
    JSON.parse(repaired1); // 测试是否能解析
    return repaired1;
  } catch (e) {
    // 方法2失败，尝试方法3
  }

  // 方法3: 先修复未闭合字符串，再使用状态机修复
  try {
    const step1 = repairUnclosedStrings(jsonString);
    const repaired2 = repairJsonWithLatex(step1);
    JSON.parse(repaired2); // 测试是否能解析
    return repaired2;
  } catch (e) {
    // 方法3失败，尝试方法4
  }

  // 方法4: 使用正则表达式修复
  try {
    const repaired3 = repairJsonWithRegex(jsonString);
    JSON.parse(repaired3); // 测试是否能解析
    return repaired3;
  } catch (e) {
    // 方法4也失败
  }

  // 方法5: 组合修复（未闭合字符串 + 正则）
  try {
    const step1 = repairUnclosedStrings(jsonString);
    const repaired4 = repairJsonWithRegex(step1);
    JSON.parse(repaired4); // 测试是否能解析
    return repaired4;
  } catch (e) {
    // 所有方法都失败
  }

  // 如果都失败，返回原字符串
  return jsonString;
}

module.exports = {
  repairJsonWithLatex,
  repairJsonWithRegex,
  repairUnclosedStrings,
  smartRepairJson
};

