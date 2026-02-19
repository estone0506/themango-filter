// 더망고 관리자 페이지 전용 콘텐츠 스크립트
console.log("The Mango Filter: Content Script Loaded!");

// 현재 활성화된 페이지의 DOM에서 데이터를 직접 추출하는 함수
function scrapeCurrentPageData() {
  const items = [];
  
  // 사용자가 제공한 HTML 구조 기반 선택자: #search_category 테이블 내의 input.input_
  // 현재 페이지에 이 요소가 있는지 확인합니다.
  const filterInputs = document.querySelectorAll('#search_category input.input_');
  
  console.log("Found filter inputs:", filterInputs.length);

  // 최대 10개까지 순차적으로 수집
  for (let i = 0; i < Math.min(filterInputs.length, 10); i++) {
    const val = filterInputs[i].value;
    if (val) {
      items.push({
        id: i + 1,
        name: val
      });
    }
  }

  return items;
}

// 팝업으로부터의 메시지 대기
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_MANGO_DATA") {
    // 현재 페이지에서 즉시 추출
    const data = scrapeCurrentPageData();
    sendResponse({ 
      data: data, 
      currentUrl: window.location.href 
    });
  }
  return true;
});
