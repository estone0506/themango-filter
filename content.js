// content.js - 더망고 웹페이지 제어 및 데이터 추출

console.log("The Mango Filter: Content Script Active!");

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // [변경] 현재 페이지의 DOM에서 직접 추출
    if (request.action === "GET_MANGO_DATA_FROM_DOM") {
        const data = scrapeFiltersFromDOM();
        sendResponse({ data: data });
    }

    if (request.action === "SYNC_MARKETS") {
        updatePageCheckboxes(request.states);
        sendResponse({ status: "synced" });
    }

    if (request.action === "TRIGGER_DELETE") {
        triggerMarketDelete();
        sendResponse({ status: "triggered" });
    }
    return true;
});

// 현재 페이지의 HTML에서 필터 데이터 10개를 추출하는 함수
function scrapeFiltersFromDOM() {
    const filters = [];
    const rows = document.querySelectorAll('#search_category tbody tr');
    let count = 0;

    rows.forEach(row => {
        if (count >= 10) return;
        if (row.querySelector('th') || row.style.display === 'none') return;

        const checkbox = row.querySelector('input[name="chk_value"]');
        const nameInput = row.querySelector('input.input_[type="text"]');
        
        if (checkbox && nameInput) {
            const [uid, siteId] = checkbox.value.split('|');
            const dateSpan = Array.from(row.querySelectorAll('td span')).find(s => s.innerText.match(/\d{4}-\d{2}-\d{2}/));

            filters.push({
                id: uid,
                siteId: siteId,
                name: nameInput.value.trim(),
                createdDate: dateSpan ? dateSpan.innerText.trim() : ''
            });
            count++;
        }
    });
    return filters;
}

// 웹페이지의 마켓 체크박스 업데이트
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
                const span = document.getElementById(checkboxId.replace('_yn', ''));
                if (span) {
                    span.className = isChecked ? 'label label-primary market btn_style1' : 'label label-default market btn_style1';
                }
            }
        }
    }
}

// 마켓 삭제 버튼 자동 클릭
function triggerMarketDelete() {
    const script = document.createElement('script');
    script.textContent = `
        window.confirm = () => true;
        const deleteBtn = Array.from(document.querySelectorAll('a.defbtn_med.dtype2')).find(a => a.innerText.includes('마켓삭제시작'));
        if (deleteBtn) deleteBtn.click();
    `;
    document.body.appendChild(script);
    script.remove();
}
