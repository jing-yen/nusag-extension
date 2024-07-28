// popup.js

let criteriaData = null;

document.addEventListener('DOMContentLoaded', () => {
    // Load the last used criteria
    /*chrome.storage.local.get(['criteria', 'regex'], (result) => {
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
    });*/


    chrome.runtime.sendMessage({ action: 'getCriteria' }, (data) => {
      console.log(data);
      if (data.action) {
        document.getElementById('default').style.display = 'none';
        if (data.action==='openAndCollectData') {
          document.getElementById('track').style.display = 'none';
        } else if (data.action==='startTracking') {
          document.getElementById('left-setup').style.display = 'none';
          document.getElementById('middle-setup').style.display = 'none';
          document.getElementById('right-setup').style.display = 'none';
        }

        criteriaData = data.criteriaData;

        // Populate the popup UI with the criteria data
        document.getElementById('regex').value = data.criteriaData.regex;
        document.getElementById('flags').value = data.criteriaData.flags;
        document.getElementById(data.criteriaData.matchType).checked = true;
        document.getElementById('value').value = data.criteriaData.value;
        // Do other stuff as needed
        applyRegex();
        setTimeout(function() {
          applyCriteria();
        }, 200);
      } else {
        document.getElementById('left-setup').style.display = 'none';
        document.getElementById('middle-setup').style.display = 'none';
        document.getElementById('right-setup').style.display = 'none';
        document.getElementById('track').style.display = 'none';
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
    document.getElementById('evaluate').addEventListener('click', evaluate);
  
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

    function evaluate() {
      applyRegex();
      setTimeout(function() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'filterByRegex', criteria: criteriaData }, (response) => {
            const trackTextBox = document.getElementById('track-text');
            trackTextBox.innerHTML = response.matchedElements ? 'Congratulations, you finished the goal!\n\nYou can go back to NUSAG.': 'You have not finished the goal yet.';
            if (response.matchedElements) {
              trackTextBox.style.color = 'green';
              document.getElementById('evaluate').display = 'none';
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.runtime.sendMessage({
                  action: 'announceComplete',
                  data: "empty data"
                });
              });
            }
          });
        });
      }, 200);
    }

    function confirmCriteria() {
        const regex = document.getElementById('regex').value;
        const matchType = document.querySelector('input[name="matchType"]:checked').value;
        const value = document.getElementById('value').value;
        const flags = document.getElementById('flags').value;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.runtime.sendMessage({
              action: 'sendCriteria',
              data: {regex, matchType, value, flags}
            });
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
    }

    function showAlert(currentPage, regex, flags, matchType, value) {
        /*alert(`Parameters:
        Link: ${currentPage}
        Regex: ${regex}
        Flags: ${flags}
        Mode: ${matchType}
        Value: ${value}`);*/
        alert('Criteria recorded. You can head back to NUSAG now.');
      }
  });
  