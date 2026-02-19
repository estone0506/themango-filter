document.addEventListener('DOMContentLoaded', () => {
  const filterList = document.getElementById('filter-list');
  const clearBtn = document.getElementById('clear-btn');
  const collectBtn = document.createElement('button');
  
  // UI에 버튼 추가
  collectBtn.innerText = "더망고 필터 10개 수집";
  collectBtn.className = "primary-btn collect-btn";
  document.getElementById('main-actions').prepend(collectBtn);

  // 수집 버튼 클릭 이벤트
  collectBtn.addEventListener('click', async () => {
    collectBtn.disabled = true;
    collectBtn.innerText = "수집 중...";
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url.includes("tmg4084.mycafe24.com")) {
      chrome.tabs.sendMessage(tab.id, { action: "GET_MANGO_DATA" }, (response) => {
        collectBtn.disabled = false;
        collectBtn.innerText = "더망고 필터 10개 수집";

        if (response && response.data && response.data.length > 0) {
          renderMangoList(response.data);
        } else {
          alert("데이터를 가져오지 못했습니다. 로그인 상태를 확인하세요.");
        }
      });
    } else {
      alert("더망고 관리자 페이지 탭을 활성화해 주세요!");
      collectBtn.disabled = false;
      collectBtn.innerText = "더망고 필터 10개 수집";
    }
  });

  // 수집된 데이터를 체크박스와 수정 가능한 input으로 10개 나열
  function renderMangoList(data) {
    filterList.innerHTML = ''; 
    data.forEach(item => {
      const li = document.createElement('li');
      li.className = 'filter-item mango-item';
      li.innerHTML = `
        <div class="item-left">
          <input type="checkbox" class="item-checkbox" id="chk-${item.id}">
          <span class="item-index">${item.id}.</span>
          <input type="text" class="item-name-input" value="${item.name}" title="필터 이름 수정 가능">
        </div>
      `;
      filterList.appendChild(li);
    });
  }

  // 초기화 버튼
  clearBtn.addEventListener('click', () => {
    filterList.innerHTML = '';
  });
});
