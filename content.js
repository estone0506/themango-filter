// 더망고 관리자 페이지 전용 콘텐츠 스크립트
console.log("The Mango Filter: Content Script Loaded!");

// 특정 URL에서 데이터를 가져와 파싱하는 함수
async function fetchFilterData() {
  const targetUrl = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";
  
  try {
    const response = await fetch(targetUrl);
    const htmlText = await response.text();
    
    // HTML 파싱을 위한 임시 DOM 생성
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    
    // 분석된 HTML 구조: #search_category 테이블 내의 input.input_ 요소들
    const items = [];
    const filterInputs = doc.querySelectorAll('#search_category input.input_');
    
    // 최대 10개까지 순차적으로 수집
    for (let i = 0; i < Math.min(filterInputs.length, 10); i++) {
      items.push({
        id: i + 1,
        name: filterInputs[i].value // 필터 이름(수정가능)의 실제 값
      });
    }

    return items;
  } catch (error) {
    console.error("데이터 수집 중 오류 발생:", error);
    return null;
  }
}

// 팝업으로부터의 메시지 대기
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_MANGO_DATA") {
    fetchFilterData().then(data => {
      sendResponse({ data: data });
    });
    return true; // 비동기 응답 처리
  }
});
