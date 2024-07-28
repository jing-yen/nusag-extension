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
    } else if (request.action === 'applyCriteria') {
      const elements = document.querySelectorAll('*');
      const matches = [];
  
      elements.forEach(element => {
        const text = element.childNodes[0]?.nodeValue;
        if (text && evaluateMatch(text, request.criteria)) {
          matches.push(element);
        }
      });
  
      sendResponse(matches);
    }
  });
  
  // Listen for messages from the webpage
  window.addEventListener("message", function(event) {
    // We only accept messages from this window
    if (event.source != window) return;

    if (event.data.type && event.data.type === "FROM_PAGE") {
      if (event.data.action === 'checkExtensionIsInstalled') {
        window.postMessage({ type: "FROM_EXTENSION", action: 'extensionIsInstalled' }, "*");
      } else {
        chrome.runtime.sendMessage(event.data, (response) => {});
      }
    }
  }, false);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.action === 'sendCriteria') {
      criteriaData = message.data;
      
      // Send to the popup if it's open
      window.postMessage({
        type: "FROM_EXTENSION",
        action: 'dataCollected',
        data: criteriaData
      });
  
      sendResponse({ status: 'criteria received' });
    } else if (message.action === 'announceComplete') {
      window.postMessage({
        type: "FROM_EXTENSION",
        action: 'announceComplete',
        data: message.data
      });
    }
  });