document.addEventListener('DOMContentLoaded', () => {
  const filterInput = document.getElementById('filter-input');
  const addBtn = document.getElementById('add-btn');
  const clearBtn = document.getElementById('clear-btn');
  const filterList = document.getElementById('filter-list');

  // Load saved filters
  chrome.storage.sync.get(['filters'], (result) => {
    const filters = result.filters || [];
    filters.forEach(filter => addFilterToList(filter));
  });

  // Add filter event
  addBtn.addEventListener('click', () => {
    const value = filterInput.value.trim();
    if (value) {
      saveFilter(value);
      filterInput.value = '';
    }
  });

  // Clear all event
  clearBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ filters: [] }, () => {
      filterList.innerHTML = '';
    });
  });

  function saveFilter(value) {
    chrome.storage.sync.get(['filters'], (result) => {
      const filters = result.filters || [];
      if (!filters.includes(value)) {
        filters.push(value);
        chrome.storage.sync.set({ filters }, () => {
          addFilterToList(value);
        });
      }
    });
  }

  function addFilterToList(value) {
    const li = document.createElement('li');
    li.className = 'filter-item';
    li.innerHTML = `
      <span>${value}</span>
      <button class="delete-btn" data-value="${value}">×</button>
    `;
    
    li.querySelector('.delete-btn').addEventListener('click', (e) => {
      const valToRemove = e.target.getAttribute('data-value');
      removeFilter(valToRemove, li);
    });

    filterList.appendChild(li);
  }

  function removeFilter(value, element) {
    chrome.storage.sync.get(['filters'], (result) => {
      const filters = result.filters || [];
      const newFilters = filters.filter(f => f !== value);
      chrome.storage.sync.set({ filters: newFilters }, () => {
        element.remove();
      });
    });
  }
});
