document.addEventListener('DOMContentLoaded', () => {
  const filterList = document.getElementById('filter-list');
  const collectBtn = document.createElement('button');
  
  // UI에 버튼 추가
  collectBtn.innerText = "더망고 필터 10개 수집";
  collectBtn.className = "primary-btn collect-btn";
  document.querySelector('.button-group').prepend(collectBtn);

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
          alert("데이터를 가져오지 못했습니다. 로그인 상태와 페이지를 확인하세요.");
        }
      });
    } else {
      alert("더망고 관리자 페이지 탭을 활성화한 상태에서 눌러주세요!");
      collectBtn.disabled = false;
      collectBtn.innerText = "더망고 필터 10개 수집";
    }
  });

  // 수집된 데이터를 체크박스와 수정 가능한 input으로 렌더링
  function renderMangoList(data) {
    filterList.innerHTML = ''; 
    data.forEach(item => {
      const li = document.createElement('li');
      li.className = 'filter-item mango-item';
      li.innerHTML = `
        <div class="item-left">
          <input type="checkbox" class="item-checkbox" id="chk-${item.id}">
          <input type="text" class="item-name-input" value="${item.name}" title="수정 가능">
        </div>
        <button class="delete-btn">×</button>
      `;
      filterList.appendChild(li);
    });
  }

  // 기존 초기화 버튼 기능 유지
  document.getElementById('clear-btn').addEventListener('click', () => {
    filterList.innerHTML = '';
  });
});
