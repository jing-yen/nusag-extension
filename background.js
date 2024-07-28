// background.js
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });

let action = null; // Specifies that the extension is tracking a question, setting up tracking, or none at all
let criteriaData = null; // Criteria data for tracking
let nusagTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message, sender);
  if (message.action === 'openAndCollectData') {
    const { url, criteria } = message;
    action = 'openAndCollectData';
    criteriaData = criteria;
    nusagTabId = sender.tab.id;

    chrome.tabs.create({ url }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === tab.id) {
          chrome.tabs.sendMessage(tabId, { action: 'applyCriteria', criteria }, (response) => {
            sendResponse(response);
            chrome.tabs.onUpdated.removeListener(listener);
          });
        }
      });
    });
    return true; // Keep the message channel open for async response

  } else if (message.action === 'startTracking') {
    const { url, criteria } = message;
    action = 'startTracking';
    criteriaData = criteria;
    nusagTabId = sender.tab.id;

    chrome.tabs.create({ url }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === tab.id) {
          chrome.tabs.sendMessage(tabId, { action: 'applyCriteria', criteria }, (response) => {
            sendResponse(response);
            chrome.tabs.onUpdated.removeListener(listener);
          });
        }
      });
    });
    return true; // Keep the message channel open for async
  } else if (message.action === 'sendCriteria') {
    criteriaData = message.data;
    
    // Send to the popup if it's open
    if (nusagTabId) {
      chrome.tabs.sendMessage(nusagTabId, {
        action: 'sendCriteria',
        data: criteriaData
      });
    }

    sendResponse({ status: 'criteria received' });

  } else if (message.action === 'getCriteria') {
    sendResponse({ action, criteriaData });
  } else if (message.action === 'announceComplete') {
    if (nusagTabId) {
      chrome.tabs.sendMessage(nusagTabId, {
        action: 'announceComplete'
      });
    }
  }
});
