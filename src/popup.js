const toggleBtn = document.getElementById('toggleBtn');

chrome.storage.local.get(['robuxHiderEnabled'], (result) => {
  const isEnabled = result.robuxHiderEnabled !== false;
  updateButton(isEnabled);
});

toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['robuxHiderEnabled'], (result) => {
    const currentState = result.robuxHiderEnabled !== false;
    const newState = !currentState;
    
    chrome.storage.local.set({ robuxHiderEnabled: newState }, () => {
      updateButton(newState);
      
      chrome.tabs.query({ url: 'https://www.roblox.com/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });
});

function updateButton(isEnabled) {
  if (isEnabled) {
    toggleBtn.textContent = 'Enabled';
    toggleBtn.className = 'toggle-btn enabled';
  } else {
    toggleBtn.textContent = 'Disabled';
    toggleBtn.className = 'toggle-btn disabled';
  }
}