// 더망고 관리자 페이지에서 데이터를 수집하거나 UI를 제어하는 로직
console.log("The Mango Filter: Content Script Loaded!");

// 페이지에서 데이터를 수집하는 예시 함수
function collectListData() {
  // 실제 사이트의 HTML 구조에 맞춰 선택자를 수정해야 합니다.
  // 예: 테이블의 모든 행을 가져옴
  const rows = document.querySelectorAll('table tr'); 
  const data = [];
  
  rows.forEach((row, index) => {
    // 예시: 첫 10개의 데이터만 수집
    if (index > 0 && index <= 10) { 
      data.push({
        id: index,
        text: row.innerText.trim().substring(0, 50) + "..."
      });
    }
  });

  return data;
}

// 팝업에서 메시지를 보냈을 때의 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_DATA") {
    const scrapedData = collectListData();
    sendResponse({ data: scrapedData });
  }
  
  // 리스트 10개만 남기고 숨기는 기능 (예시)
  if (request.action === "FILTER_10") {
    const rows = document.querySelectorAll('table tr');
    rows.forEach((row, index) => {
      if (index > 10) {
        row.style.display = 'none'; // 10개 이후는 숨김
      }
    });
    sendResponse({ status: "success" });
  }
});
