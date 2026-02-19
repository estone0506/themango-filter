document.addEventListener('DOMContentLoaded', () => {
  const filterList = document.getElementById('filter-list');
  const clearBtn = document.getElementById('clear-btn');
  const collectBtn = document.createElement('button');
  
  // UI에 버튼 추가
  collectBtn.innerText = "현재 페이지 필터 10개 수집";
  collectBtn.className = "primary-btn collect-btn";
  document.getElementById('main-actions').prepend(collectBtn);

  // 수집 버튼 클릭 이벤트
  collectBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 1. 더망고 사이트인지 확인
    if (!tab.url.includes("tmg4084.mycafe24.com")) {
      alert("더망고 관리자 페이지(tmg4084.mycafe24.com)를 먼저 열어주세요.");
      return;
    }

    // 2. 필터 관리 페이지인지 확인
    if (!tab.url.includes("getGoodsCategory.php")) {
      if (confirm("필터 관리 페이지(getGoodsCategory.php)가 아닙니다. 해당 페이지로 이동할까요?")) {
        chrome.tabs.update(tab.id, { url: "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc" });
      }
      return;
    }

    collectBtn.disabled = true;
    collectBtn.innerText = "수집 중...";

    // 3. 페이지 내의 데이터를 직접 수집 요청
    chrome.tabs.sendMessage(tab.id, { action: "GET_MANGO_DATA" }, (response) => {
      collectBtn.disabled = false;
      collectBtn.innerText = "현재 페이지 필터 10개 수집";

      if (response && response.data && response.data.length > 0) {
        renderMangoList(response.data);
      } else {
        alert("데이터를 찾을 수 없습니다. 페이지에 필터 리스트가 표시되어 있는지 확인하세요.");
      }
    });
  });

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

  clearBtn.addEventListener('click', () => {
    filterList.innerHTML = '';
  });
});
