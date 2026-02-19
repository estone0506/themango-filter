// popup.js - 더망고 V2 리모컨 (삭제 버튼 제어)

document.addEventListener('DOMContentLoaded', async () => {
    const collectFiltersBtn = document.getElementById('collectFiltersBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const statusDiv = document.getElementById('status');
    const filterTableBody = document.getElementById('filterTableBody');
    const marketSection = document.getElementById('marketSection');
    const startDeleteBtn = document.getElementById('startDeleteBtn');
    const allMarketChk = document.getElementById('allMarketChk');

    const TARGET_FILTER_URL = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";

    let lastDataJson = ""; 

    // 1. 팝업 시작 시 초기화
    loadSavedData();
    checkCurrentPageAndSync();

    // 2. 1초마다 실시간 수집 및 페이지 상태 확인
    setInterval(() => {
        fetchRealtimeData();
        checkCurrentPageAndSync();
    }, 1000);

    // 페이지 확인 및 마켓 상태 동기화
    async function checkCurrentPageAndSync() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('admin_goods_update_delete.php')) {
            marketSection.style.display = 'block';
            
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_MARKET_STATUS" });
                if (response && response.status) {
                    let allChecked = true;
                    for (const [market, checked] of Object.entries(response.status)) {
                        const chk = document.querySelector(`.market-chk[value="${market}"]`);
                        if (chk) chk.checked = checked;
                        if (!checked) allChecked = false;
                    }
                    // 개별 체크 상태에 따라 전체 선택 체크박스 상태 업데이트
                    allMarketChk.checked = allChecked;
                }
            } catch(e) {}
        } else {
            marketSection.style.display = 'none';
        }
    }

    // "전체 마켓 선택" 로직
    allMarketChk.addEventListener('change', async () => {
        const isChecked = allMarketChk.checked;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        document.querySelectorAll('.market-chk').forEach(chk => {
            chk.checked = isChecked;
            // 각 마켓별로 페이지에 동기화 명령 전송
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: "SYNC_MARKETS",
                    market: chk.value,
                    checked: isChecked
                });
            }
        });
    });

    async function loadSavedData() {
        chrome.storage.local.get(['savedFilters'], (result) => {
            if (result.savedFilters) {
                renderFilterTable(result.savedFilters);
                lastDataJson = JSON.stringify(result.savedFilters);
            }
        });
    }

    async function fetchRealtimeData() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('getGoodsCategory.php')) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_FILTERS" });
                if (response && response.data) {
                    const currentDataJson = JSON.stringify(response.data);
                    if (currentDataJson !== lastDataJson) {
                        renderFilterTable(response.data);
                        lastDataJson = currentDataJson;
                        chrome.storage.local.set({ savedFilters: response.data });
                        updateStatus('📡 실시간 동기화 완료');
                    }
                }
            }
        } catch (e) {}
    }

    function renderFilterTable(filters) {
        filterTableBody.innerHTML = '';
        filters.forEach((filter) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" data-id="${filter.id}" data-name="${filter.name}"></td>
                <td style="text-align:left; padding-left:10px;">${filter.name}</td>
                <td>${filter.id}</td>
            `;
            filterTableBody.appendChild(tr);
        });
        for (let i = filters.length; i < 10; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td></td><td></td><td></td>';
            filterTableBody.appendChild(tr);
        }
    }

    // 개별 마켓 체크박스 연동
    document.querySelectorAll('.market-chk').forEach(chk => {
        chk.addEventListener('change', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: "SYNC_MARKETS",
                    market: chk.value,
                    checked: chk.checked
                });
            }
        });
    });

    // 버튼 이벤트들
    collectFiltersBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.tabs.update(tab.id, { url: TARGET_FILTER_URL });
    });

    deleteAllBtn.addEventListener('click', async () => {
        const selectedCheckbox = document.querySelector('#filterTableBody input[type="checkbox"]:checked');
        if (!selectedCheckbox) { alert('이동할 필터를 테이블에서 먼저 선택해주세요.'); return; }
        const filterName = selectedCheckbox.getAttribute('data-name');
        const encodedName = encodeURIComponent(filterName);
        const DELETE_PAGE_URL = `https://tmg4084.mycafe24.com/mall/admin/admin_goods_update_delete.php?bmode=market_only&amode=detail_search&search_d=&pg=1&search_type=filter_name&ps_subject=${encodedName}&ps_status=sale`;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.tabs.update(tab.id, { url: DELETE_PAGE_URL });
    });

    // "마켓 삭제 시작" 버튼 클릭 시 페이지의 실제 버튼 클릭 연동
    startDeleteBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: "CLICK_REAL_DELETE_ALL_BTN" });
            updateStatus('🚀 페이지 삭제 버튼 클릭됨');
        }
    });

    // [V4.1 추가] 삭제 완료 메시지 수신 (content.js -> popup.js)
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "DELETE_COMPLETED") {
            updateStatus('🎊 마켓 삭제가 모두 완료되었습니다!');
            statusDiv.style.backgroundColor = '#4CAF50'; 
            
            // 체크된 필터 정보 가져오기 (이동 시 검색어로 사용)
            const selectedCheckbox = document.querySelector('#filterTableBody input[type="checkbox"]:checked');
            let filterName = "";
            if (selectedCheckbox) {
                filterName = selectedCheckbox.getAttribute('data-name');
            }

            // 3초 후 자동 이동 로직
            setTimeout(async () => {
                const encodedName = encodeURIComponent(filterName);
                const REDIRECT_URL = `https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=${encodedName}&ft_num=10&ft_show=&ft_sort=register_asc`;
                
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    chrome.tabs.update(tab.id, { url: REDIRECT_URL });
                    console.log(`🚚 [V4.2] ${filterName} 필터 페이지로 자동 이동합니다.`);
                }
            }, 3000);

            alert('마켓 삭제가 완료되었습니다. 3초 후 필터 관리 페이지로 이동합니다.');
        }
    });

    function updateStatus(msg) {
        statusDiv.textContent = msg;
        statusDiv.style.opacity = '1';
        setTimeout(() => { statusDiv.style.opacity = '0'; }, 3000);
    }
});
