// content.js - 더망고 웹페이지 제어 및 실시간 연동 실행기

console.log("The Mango Filter: Content Script Active!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_MANGO_DATA_FROM_DOM") {
        sendResponse({ data: scrapeFiltersFromDOM() });
    }

    // [실시간 연동] 팝업의 마켓 체크 상태를 웹페이지에 반영
    if (request.action === "SYNC_MARKETS") {
        updatePageCheckboxes(request.states);
        sendResponse({ status: "synced" });
    }

    // [자동 삭제] 웹페이지의 "마켓삭제시작 (검색결과모든상품)" 버튼 클릭
    if (request.action === "TRIGGER_DELETE") {
        triggerMarketDelete();
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
                // 체크박스 값 변경
                checkbox.checked = isChecked;
                
                // 더망고의 'select_tab' 스타일 연동 (색상 변경)
                const spanId = checkboxId.replace('_yn', '');
                const span = document.getElementById(spanId);
                if (span) {
                    span.className = isChecked ? 'label label-primary market btn_style1' : 'label label-default market btn_style1';
                }
            }
        }
    }
}

function triggerMarketDelete() {
    // 1. 브라우저 confirm 창 무력화 (자동 확인)
    const script = document.createElement('script');
    script.textContent = `
        window.confirm = () => true;
        // 실제 버튼 찾기 및 클릭
        const deleteButtons = Array.from(document.querySelectorAll('a.defbtn_med.dtype2, button'));
        const targetBtn = deleteButtons.find(btn => 
            btn.innerText.includes('마켓삭제시작') && btn.innerText.includes('검색결과모든상품')
        );
        if (targetBtn) {
            console.log('마켓 삭제 시작 버튼 클릭됨');
            targetBtn.click();
        } else {
            // 버튼을 못 찾을 경우 직접 함수 실행 시도
            if (typeof goods_permanent_delete === 'function') {
                goods_permanent_delete('all','','','');
            }
        }
    `;
    document.body.appendChild(script);
    script.remove();
}
