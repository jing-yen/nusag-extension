// content.js
var searchResult;

function analyzePage() {
    const elements = document.querySelectorAll('*');
    const analysis = {
      tags: {},
      classes: {}
    };
  
    elements.forEach(element => {
      const tag = element.tagName.toLowerCase();
      analysis.tags[tag] = (analysis.tags[tag] || 0) + 1;
  
      element.classList.forEach(cls => {
        analysis.classes[cls] = (analysis.classes[cls] || 0) + 1;
      });
    });
  
    return analysis;
  }
  
  function evaluateMatch(text, criteria) {  
    console.log(text, criteria.value, text === criteria.value);
    switch (criteria.matchType) {
      case 'equals':
        return text === criteria.value;
      case 'largerThan':
        return parseFloat(text) > parseFloat(criteria.value);
      case 'smallerThan':
        return parseFloat(text) < parseFloat(criteria.value);
      case 'largerEqThan':
        return parseFloat(text) >= parseFloat(criteria.value);
      case 'smallerEqThan':
        return parseFloat(text) <= parseFloat(criteria.value);
      case 'contains':
        return text.includes(criteria.value);
      default:
        return false;
    }
  }
  
  function filterElementsByRegex(criteria) {

    switch (criteria.matchType) {
        case 'exists':
            return searchResult.length>0;
        case 'size':
            return searchResult.length > parseInt(criteria.value, 10);
        default:
            return searchResult.some(text => text && evaluateMatch(text, criteria));
    }
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyze') {
      const analysis = analyzePage();
      sendResponse(analysis);
    } else if (request.action === 'filterByRegex') {
      const matchedElements = filterElementsByRegex(request.criteria);
      sendResponse({ matchedElements });
    } else if (request.action === 'applyRegex') {
      const regex = new RegExp(request.regex, request.flags);
      const elements = document.querySelectorAll('*');
      const matches = [];
  
      elements.forEach(element => {
        const text = element.childNodes[0]?.nodeValue;
        if (text) {
            const regexText = regex.test(text);
            if (regexText) text.match(request.regex).forEach(m=>matches.push(m));
        }
      });

      searchResult = matches;
      sendResponse(matches);
    }
  });
  