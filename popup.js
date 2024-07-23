// popup.js
document.addEventListener('DOMContentLoaded', () => {
    // Load the last used criteria
    chrome.storage.local.get(['criteria', 'regex'], (result) => {
      if (result.regex) {
        document.getElementById('regex').value = result.regex.pattern;
        document.getElementById('flags').value = result.regex.flags;
        applyRegex();
      }
      if (result.criteria) {
        document.getElementById(result.criteria.matchType).checked = true;
        document.getElementById('value').value = result.criteria.value;
        setTimeout(function() {
          applyCriteria();
        }, 500);
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const pageLinkDiv = document.getElementById('pageLink');
        pageLinkDiv.textContent = tabs[0].url;
    
        chrome.tabs.sendMessage(tabs[0].id, { action: 'analyze' }, (response) => {
          displayAnalysis(response);
        });
      });
  
    // Analyze the page on load
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'analyze' }, (response) => {
        displayAnalysis(response);
      });
    });
  
    document.getElementById('applyRegex').addEventListener('click', applyRegex);
    document.getElementById('applyCriteria').addEventListener('click', applyCriteria);
    document.getElementById('confirmRegex').addEventListener('click', confirmCriteria);
  
    function applyRegex() {
      const regex = document.getElementById('regex').value;
      const flags = document.getElementById('flags').value;
      const secondButton = document.getElementById('applyCriteria');
      secondButton.disabled = false;
  
      chrome.storage.local.set({ regex: { pattern: regex, flags: flags } });
  
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'applyRegex', regex: regex, flags: flags }, (response) => {
          displayRegexResults(response);
          const isNumber = response.length==1 && !isNaN(response[0]);
          document.getElementById("equals").disabled=!isNumber;
          document.getElementById("largerThan").disabled=!isNumber;
          document.getElementById("smallerThan").disabled=!isNumber;
          document.getElementById("largerEqThan").disabled=!isNumber;
          document.getElementById("smallerEqThan").disabled=!isNumber;
          updateFinal(tabs[0].url);
        });
      });
    }
  
    function applyCriteria() {
      const regex = document.getElementById('regex').value;
      const matchType = document.querySelector('input[name="matchType"]:checked').value;
      const value = document.getElementById('value').value;
      const flags = document.getElementById('flags').value;
      const criteria = { regex, matchType, value, flags };
      chrome.storage.local.set({ criteria });

      if (document.getElementById(matchType).disabled) {
        alert('Invalid match type for the current regex');
        return;
      }
  
      const thirdButton = document.getElementById('confirmRegex');
      thirdButton.disabled = false;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'filterByRegex', criteria: criteria }, (response) => {
          displayCriteriaResults(response.matchedElements);
          updateFinal(tabs[0].url);
        });
      });
    }

    function confirmCriteria() {
        const regex = document.getElementById('regex').value;
        const matchType = document.querySelector('input[name="matchType"]:checked').value;
        const value = document.getElementById('value').value;
        const flags = document.getElementById('flags').value;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            showAlert(tabs[0].url, regex, flags, matchType, value);
          });
    }

    function updateFinal(currentPage) {
        const regex = document.getElementById('regex').value;
        const matchType = document.querySelector('input[name="matchType"]:checked').value;
        const value = document.getElementById('value').value;
        const flags = document.getElementById('flags').value;
        const preview = document.getElementById('preview');
        preview.textContent = `Parameters:
                                    \nLink: ${currentPage}
                                    \nRegex: ${regex}
                                    \nFlags: ${flags}
                                    \nMode: ${matchType}
                                    \nValue: ${value}`;
        
    }
  
    function displayRegexResults(result) {
      const regexResultsDiv = document.getElementById('regexResults');
      regexResultsDiv.innerHTML = `
        <hr/>
        <p>Exists: ${result.length>0?'True':'False'}</p>
        <p>Number of Matches: ${result.length}</p>
        <p>Is Number: ${(result.length==1 && !isNaN(result[0]))?'True':'False'}</p>
        <hr/>
        <ul>${result.length>0?result.map(el => `<li>${el}</li>`).join(''):`<li>No matches found</li>`}</ul>
      `;
    }
  
    function displayCriteriaResults(resultBool) {
      const criteriaResultsDiv = document.getElementById('criteriaResults');
      criteriaResultsDiv.innerHTML = resultBool ? '<hr/><p>True</p>': '<hr/><p>False</p>';
      if (elements.length > 0) {
        criteriaResultsDiv.innerHTML = `<p>Matched Elements:</p><ul>${elements.map(el => `<li>${el}</li>`).join('')}</ul>`;
      } else {
        criteriaResultsDiv.innerHTML = '<p>No matches found</p>';
      }
    }

    function showAlert(currentPage, regex, flags, matchType, value) {
        alert(`Parameters:
        Link: ${currentPage}
        Regex: ${regex}
        Flags: ${flags}
        Mode: ${matchType}
        Value: ${value}`);
      }
  });
  