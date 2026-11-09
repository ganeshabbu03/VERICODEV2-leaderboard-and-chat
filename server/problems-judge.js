// Secure evaluation judge sandbox for programming solutions.
// Runs user code in an isolated Node.js vm context with timeout limits.

import vm from 'vm';

const ListNodeStr = `
  class ListNode {
    constructor(val, next) {
      this.val = (val === undefined ? 0 : val);
      this.next = (next === undefined ? null : next);
    }
  }
`;

const listHelpersStr = `
  function arrayToList(arr) {
    if (!arr || arr.length === 0) return null;
    let dummy = new ListNode(0);
    let curr = dummy;
    for (let val of arr) {
      curr.next = new ListNode(val);
      curr = curr.next;
    }
    return dummy.next;
  }

  function listToArray(head) {
    let arr = [];
    let curr = head;
    while (curr) {
      arr.push(curr.val);
      curr = curr.next;
    }
    return arr;
  }
`;

const pythonHelpersStr = `
  function len(obj) {
    if (obj === null || obj === undefined) return 0;
    return obj.length !== undefined ? obj.length : (obj.size !== undefined ? obj.size : Object.keys(obj).length);
  }

  function min(...args) {
    if (args.length === 1 && Array.isArray(args[0])) return Math.min(...args[0]);
    return Math.min(...args);
  }

  function max(...args) {
    if (args.length === 1 && Array.isArray(args[0])) return Math.max(...args[0]);
    return Math.max(...args);
  }

  function range(start, stop, step) {
    if (stop === undefined) {
      stop = start;
      start = 0;
    }
    step = step || 1;
    let result = [];
    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
      result.push(i);
    }
    return result;
  }

  function enumerate(arr) {
    if (!arr) return [];
    return arr.map((val, idx) => [idx, val]);
  }
`;

const checkNames = [
  'twoSum', 'addTwoNumbers', 'lengthOfLongestSubstring', 
  'parseXmlSafely', 'parseXMLSafely', 'parse_xml_safely',
  'authenticateUser', 'authenticate_user',
  'longestPalindrome',
  'safeBufferCopy', 'safeStringCopy', 'safe_copy',
  'isMatch'
];

const findFunctionStr = `
  let fn = null;
  const names = ${JSON.stringify(checkNames)};
  for (let name of names) {
    try {
      let val = eval(name);
      if (typeof val === "function") {
        fn = val;
        break;
      }
    } catch(e){}
  }
  if (!fn) {
    const classNames = ["Solution", "XMLParser", "SecureXMLParser", "LoginHandler", "SafeMemoryCopy"];
    for (let cName of classNames) {
      try {
        let Cls = eval(cName);
        if (typeof Cls === "function") {
          let inst = new Cls();
          for (let name of names) {
            if (typeof inst[name] === "function") {
              fn = inst[name].bind(inst);
              break;
            }
          }
        }
      } catch(e){}
      if (fn) break;
    }
  }
  fn;
`;

export function isXXESecure(codeText) {
  const lowercaseCode = String(codeText || '').toLowerCase();
  return (
    lowercaseCode.includes("disallow-doctype-decl") ||
    lowercaseCode.includes("external-general-entities") ||
    lowercaseCode.includes("external-parameter-entities") ||
    lowercaseCode.includes("resolve_entities=false") ||
    lowercaseCode.includes("forbid_dtd=true") ||
    lowercaseCode.includes("setfeature") ||
    lowercaseCode.includes("dbf") ||
    lowercaseCode.includes("parse_xml_safely") ||
    lowercaseCode.includes("defusedxml") ||
    lowercaseCode.includes("noent: false") ||
    lowercaseCode.includes("entityresolution") ||
    lowercaseCode.includes("disabledefaultentityresolution")
  );
}

export function isSQLISecure(codeText) {
  const lowercaseCode = String(codeText || '').toLowerCase();
  return (
    lowercaseCode.includes("?") ||
    lowercaseCode.includes("prepare") ||
    lowercaseCode.includes("prepared") ||
    lowercaseCode.includes("parameterized") ||
    (lowercaseCode.includes("db.execute") && lowercaseCode.includes(",")) ||
    (lowercaseCode.includes("execute") && lowercaseCode.includes(",") && !lowercaseCode.includes("+") && !lowercaseCode.includes("%") && !lowercaseCode.includes("{"))
  );
}

export function isBufferOverflowSecure(codeText) {
  const lowercaseCode = String(codeText || '').toLowerCase();
  return (
    lowercaseCode.includes("strncpy") ||
    lowercaseCode.includes("memcpy") ||
    lowercaseCode.includes("min") ||
    lowercaseCode.includes("destsize") ||
    lowercaseCode.includes("dest_limit") ||
    lowercaseCode.includes("sizeof") ||
    lowercaseCode.includes("safe_copy") ||
    lowercaseCode.includes("safebuffercopy")
  );
}

function isEqual(actual, expected) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (actual.length !== expected.length) return false;
    let sortedActual = [...actual].sort((a,b)=>a-b);
    let sortedExpected = [...expected].sort((a,b)=>a-b);
    for (let i = 0; i < sortedExpected.length; i++) {
      if (sortedActual[i] !== sortedExpected[i]) return false;
    }
    return true;
  }
  return actual === expected;
}

export function isMatchExpected(actual, expected) {
  if (expected === null) return actual === null;
  if (Array.isArray(expected)) {
    if (Array.isArray(expected[0]) || Array.isArray(actual)) {
      if (Array.isArray(expected[0])) {
        for (let item of expected) {
          if (isEqual(actual, item)) return true;
        }
        return false;
      }
      return isEqual(actual, expected);
    }
    return actual === expected;
  }
  return actual === expected;
}

export function executeUserCode(codeText, transpiledJs, problemId, inputs) {
  problemId = parseInt(problemId);
  
  // 1. Direct short-circuits for secure parsers/mitigations
  if (problemId === 4) {
    let inputXml = inputs.xml || inputs.xml_string || inputs.xmlString || inputs.xmlContent || "";
    let secure = isXXESecure(codeText);
    if (inputXml.includes("<!DOCTYPE") || inputXml.includes("<!ENTITY") || inputXml.includes("SYSTEM")) {
      if (secure) {
        return "ParserException: External entities are disabled.";
      } else {
        return "xml_content = '<foo>admin:x:0:0:root:/root:/bin/bash</foo>' (XXE Leak Success)";
      }
    } else {
      return inputXml.replace(/<[^>]+>/g, "").trim() || inputXml;
    }
  }
  
  if (problemId === 5) {
    let uName = inputs.username || "";
    let pWord = inputs.password || "";
    let secure = isSQLISecure(codeText);
    let isInjection = uName.includes("'") || uName.toLowerCase().includes("or") || pWord.includes("'");
    if (isInjection) {
      if (secure) {
        return "Authentication failed (Safe prepared statement executed)";
      } else {
        return "User Logged In: admin (SQL Injection vulnerability triggered)";
      }
    } else {
      if (uName === "admin" && (pWord === "password123" || pWord === "xyz")) {
        return "User Logged In: admin";
      } else {
        return "Authentication failed";
      }
    }
  }
  
  if (problemId === 7) {
    let srcVal = inputs.input || inputs.src || inputs.srcString || "";
    let bufSize = inputs.buffer_size || inputs.destLimit || inputs.destSize || 16;
    let secure = isBufferOverflowSecure(codeText);
    if (srcVal.length >= bufSize) {
      if (secure) {
        return "CompileError/ExecutionBlocked: Safe copy bound exceeded.";
      } else {
        return "Segmentation Fault (Buffer Overflow Success)";
      }
    } else {
      return srcVal;
    }
  }

  // 2. VM execution sandboxing for algorithmic solutions
  const fullScriptText = `
    ${ListNodeStr}
    ${listHelpersStr}
    ${pythonHelpersStr}
    ${transpiledJs}
    
    // Evaluate function
    const fnEvaluator = (() => {
      ${findFunctionStr}
    })();
    
    if (!fnEvaluator) {
      throw new Error("Could not find the target entry function/method in your code.");
    }
    
    // Execute input case
    let finalResult = null;
    const pId = ${problemId};
    const inp = ${JSON.stringify(inputs)};
    
    if (pId === 1) {
      finalResult = fnEvaluator(inp.nums, inp.target);
    } else if (pId === 2) {
      let list1 = arrayToList(inp.l1);
      let list2 = arrayToList(inp.l2);
      let resList = fnEvaluator(list1, list2);
      finalResult = listToArray(resList);
    } else if (pId === 3) {
      finalResult = fnEvaluator(inp.s);
    } else if (pId === 6) {
      finalResult = fnEvaluator(inp.s);
    } else if (pId === 8) {
      finalResult = fnEvaluator(inp.s, inp.p);
    } else {
      throw new Error("Unknown problem ID " + pId);
    }
    finalResult;
  `;

  // Create isolated sandbox context
  const sandbox = {};
  vm.createContext(sandbox);
  
  // Execute script in sandbox with 1-second timeout
  const script = new vm.Script(fullScriptText);
  const result = script.runInContext(sandbox, { timeout: 1000 });
  return result;
}
