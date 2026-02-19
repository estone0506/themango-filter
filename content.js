// content.js - 더망고 웹페이지 제어 및 특정 URL 데이터 수집

console.log("The Mango Filter: Content Script Active!");

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_MANGO_DATA") {
        // 요청받은 특정 URL에서 데이터를 백그라운드 수집
        fetchTargetUrlData(request.url).then(data => {
            sendResponse({ data: data });
        });
        return true; // 비동기 응답 처리
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

// 특정 URL의 HTML을 가져와 필터 10개를 추출하는 함수
async function fetchTargetUrlData(targetUrl) {
    try {
        // 현재 로그인 세션(쿠키)을 포함하여 요청
        const response = await fetch(targetUrl, { credentials: 'include' });
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        const filters = [];
        const rows = doc.querySelectorAll('#search_category tbody tr');
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
    } catch (error) {
        console.error("데이터 fetch 중 오류 발생:", error);
        return [];
    }
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
