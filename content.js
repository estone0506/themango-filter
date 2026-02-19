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
    
    // 더망고 페이지 구조에 따라 수정이 필요할 수 있는 부분
    // 예: 필터 이름이 들어있는 input이나 td를 찾습니다. 
    // 여기서는 일반적인 관리자 페이지의 리스트 구조를 가정합니다.
    const items = [];
    
    // 예시: 테이블의 행(tr) 중 데이터가 있는 부분을 선택 (더망고 실제 구조에 맞춰 조정 필요)
    const rows = doc.querySelectorAll('tr[id^="row_"], .list_tr, table tr');
    
    let count = 0;
    rows.forEach((row) => {
      if (count >= 10) return;
      
      // 행 내에서 텍스트나 입력값을 추출 (필터 이름이 들어있는 위치)
      // 보통 name="ft_name[]" 같은 input이거나 특정 class의 td일 확률이 높습니다.
      const nameElement = row.querySelector('input[type="text"], .ft_name, td:nth-child(3)');
      
      if (nameElement) {
        const nameValue = nameElement.value || nameElement.innerText.trim();
        if (nameValue && nameValue !== "필터명") { // 헤더 제외
          items.push({
            id: count + 1,
            name: nameValue
          });
          count++;
        }
      }
    });

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
    return true; // 비동기 응답을 위해 true 반환
  }
});
