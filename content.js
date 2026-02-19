// content.js - 더망고 마켓 삭제 프로세스 연동 및 자동화 로직

console.log("The Mango Filter: Content Script Active!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_MANGO_DATA_FROM_DOM") {
        sendResponse({ data: scrapeFiltersFromDOM() });
    }

    // [실시간 연동] 팝업의 마켓 체크 상태를 웹페이지에 즉시 반영
    if (request.action === "SYNC_MARKETS") {
        updatePageCheckboxes(request.states);
        sendResponse({ status: "synced" });
    }

    // [자동 삭제] "마켓 삭제 시작" 또는 "마켓삭제시작(검색결과모든상품)" 연동 실행
    if (request.action === "TRIGGER_DELETE") {
        executeMarketDeleteOnPage(request.deleteType);
        sendResponse({ status: "triggered" });
    }
    return true;
});

function scrapeFiltersFromDOM() {
    const filters = [];
    const rows = document.querySelectorAll('#search_category tbody tr');
    let count = 0;
    rows.forEach(row => {
        if (count >= 10 || row.querySelector('th') || row.style.display === 'none') return;
        const checkbox = row.querySelector('input[name="chk_value"]');
        const nameInput = row.querySelector('input.input_[type="text"]');
        if (checkbox && nameInput) {
            const [uid, siteId] = checkbox.value.split('|');
            filters.push({ id: uid, siteId: siteId, name: nameInput.value.trim(), checked: false });
            count++;
        }
    });
    return filters;
}

function updatePageCheckboxes(marketStates) {
    const checkboxMap = {
        'coupang': 'chk_coupang_yn',
        'gmarket': 'chk_gmarket20_yn',
        '11st': 'chk_11st_yn',
        'smartstore': 'chk_smartstore_yn',
        'lotteon': 'chk_lotteon_yn',
        'auction': 'chk_auction20_yn'
    };

    for (const [market, isChecked] of Object.entries(marketStates)) {
        const checkboxId = checkboxMap[market];
        if (checkboxId) {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.checked = isChecked;
                // 웹페이지 내의 라벨 색상 및 스타일 연동 (더망고 내부 select_tab 로직 모사)
                const spanId = checkboxId.replace('_yn', '');
                const span = document.getElementById(spanId);
                if (span) {
                    // 페이지 소스에서 확인된 실제 클래스명 적용 (label-primary 또는 label-default)
                    span.className = isChecked ? 'label label-primary market btn_style1' : 'label label-default market btn_style1';
                }
            }
        }
    }
}

// 웹페이지의 삭제 버튼과 직접 연동하는 핵심 함수
function executeMarketDeleteOnPage(deleteType) {
    // 페이지의 컨텍스트에서 코드를 실행하기 위해 스크립트 주입
    const script = document.createElement('script');
    script.textContent = `
        (function() {
            // 1. 브라우저 확인창(confirm) 자동 '확인' 처리 (자동화 필수 단계)
            window.confirm = function() { return true; };
            
            console.log('더망고 확장앱: 삭제 프로세스 시작 (${deleteType})');

            const isAll = '${deleteType}' === 'all';
            
            // 2. 실제 삭제 버튼 찾기 및 실행
            const deleteButtons = Array.from(document.querySelectorAll('a.defbtn_med.dtype2, a.defbtn_med, button'));
            let targetBtn = null;

            if (isAll) {
                // "마켓삭제시작(검색결과모든상품)" 버튼 찾기
                targetBtn = deleteButtons.find(btn => 
                    (btn.innerText.includes('마켓삭제시작') && btn.innerText.includes('검색결과모든상품')) ||
                    (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("goods_permanent_delete('all'"))
                );
            } else {
                // "마켓 삭제 시작" (선택 상품) 버튼 찾기
                targetBtn = deleteButtons.find(btn => 
                    (btn.innerText.includes('마켓 삭제 시작') && !btn.innerText.includes('모든상품')) ||
                    (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("goods_permanent_delete('')")) ||
                    (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("goods_permanent_delete()"))
                );
            }

            if (targetBtn) {
                console.log('더망고 확장앱: 타겟 버튼 클릭 실행');
                targetBtn.click();
            } else if (typeof goods_permanent_delete === 'function') {
                console.log('더망고 확장앱: 전역 함수 직접 호출 실행');
                if (isAll) {
                    goods_permanent_delete('all', '', '', '');
                } else {
                    goods_permanent_delete('', '', '', '');
                }
            } else {
                alert('삭제 버튼이나 함수를 찾을 수 없습니다. 페이지를 확인해주세요.');
            }
        })();
    `;
    document.body.appendChild(script);
    script.remove();
}
