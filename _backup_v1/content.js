// content.js - 더망고 마켓 삭제 프로세스 연동 및 자동화 로직

console.log("The Mango Filter: Content Script Active!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content.js:", request.action, request);

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
        console.log("TRIGGER_DELETE action detected with type:", request.deleteType);
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
    // 제공된 소스 코드의 실제 ID 매핑
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
                // 제공된 소스의 span ID는 _yn을 제외한 형태 (chk_auction20 등)
                const spanId = checkboxId.replace('_yn', '');
                const span = document.getElementById(spanId);
                if (span) {
                    // 소스 상의 스타일 클래스 적용
                    span.className = isChecked ? 'label label-primary market btn_style1' : 'label label-default market btn_style1';
                }
            }
        }
    }
}

// 웹페이지의 삭제 버튼과 직접 연동하는 핵심 함수
function executeMarketDeleteOnPage(deleteType) {
    const script = document.createElement('script');
    script.textContent = `
        (function() {
            // 1. 브라우저 확인창 자동 승인
            window.confirm = function() { return true; };
            window.alert = function(msg) { console.log('더망고 알림 차단: ' + msg); return true; };
            
            console.log('더망고 확장앱: 페이지 내 삭제 함수 직접 실행 - 유형: ${deleteType}');

            const isAll = '${deleteType}' === 'all';
            
            if (typeof goods_permanent_delete === 'function') {
                if (isAll) {
                    // 검색결과 모든 상품 삭제 실행 (페이지 소스의 버튼 로직과 동일)
                    console.log('더망고 확장앱: goods_permanent_delete("all") 호출');
                    goods_permanent_delete('all', '', '', '');
                } else {
                    // 선택 상품 삭제 실행
                    console.log('더망고 확장앱: goods_permanent_delete("") 호출');
                    goods_permanent_delete('', '', '', '');
                }
            } else {
                // 함수를 찾을 수 없을 경우 버튼 클릭 시도
                const deleteButtons = Array.from(document.querySelectorAll('a, button'));
                const targetBtn = deleteButtons.find(el => {
                    const onclick = el.getAttribute('onclick') || '';
                    if (isAll) {
                        return (el.innerText.includes('마켓삭제시작') && el.innerText.includes('모든상품')) || 
                               onclick.includes("goods_permanent_delete('all'");
                    } else {
                        return el.innerText.includes('마켓 삭제 시작') || 
                               (onclick.includes('goods_permanent_delete(') && !onclick.includes("'all'"));
                    }
                });

                if (targetBtn) {
                    console.log('더망고 확장앱: 삭제 버튼 발견, 클릭 실행');
                    targetBtn.click();
                } else {
                    console.error('더망고 확장앱: 삭제 실행 수단을 찾을 수 없습니다.');
                }
            }
        })();
    `;
    document.body.appendChild(script);
    script.remove();
}
