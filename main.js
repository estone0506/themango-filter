document.addEventListener('DOMContentLoaded', () => {
  const filterList = document.getElementById('filter-list');
  const collectBtn = document.createElement('button');
  
  // UI에 '수집하기' 버튼 추가
  collectBtn.innerText = "더망고 데이터 10개 수집";
  collectBtn.className = "primary-btn";
  collectBtn.style.marginBottom = "10px";
  document.querySelector('.button-group').prepend(collectBtn);

  // 데이터 수집 버튼 클릭 이벤트
  collectBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.includes("tmg4084.mycafe24.com")) {
      chrome.tabs.sendMessage(tab.id, { action: "GET_DATA" }, (response) => {
        if (response && response.data) {
          renderCollectedData(response.data);
        } else {
          alert("데이터를 찾을 수 없습니다. 더망고 관리자 페이지인지 확인하세요.");
        }
      });
    } else {
      alert("더망고 관리자 페이지에서 실행해 주세요!");
    }
  });

  function renderCollectedData(data) {
    filterList.innerHTML = ''; // 기존 목록 초기화
    data.forEach(item => {
      const li = document.createElement('li');
      li.className = 'filter-item';
      li.innerHTML = `<span>${item.text}</span>`;
      filterList.appendChild(li);
    });
  }

  // 기존 필터 로직들... (생략 가능 또는 유지)
});
