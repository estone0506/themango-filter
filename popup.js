// popup.js - 더망고 V2 리모컨 (삭제 버튼 제어)

document.addEventListener('DOMContentLoaded', async () => {
    const collectFiltersBtn = document.getElementById('collectFiltersBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const statusDiv = document.getElementById('status');
    const filterTableBody = document.getElementById('filterTableBody');

    const TARGET_FILTER_URL = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";

    let lastDataJson = ""; 

    // 1. 팝업 시작 시 저장된 데이터 불러오기
    loadSavedData();

    // 2. 1초마다 실시간 수집 실행 (필터 페이지일 때만 업데이트)
    const pollInterval = setInterval(fetchRealtimeData, 1000);
    fetchRealtimeData();

    async function loadSavedData() {
        chrome.storage.local.get(['savedFilters'], (result) => {
            if (result.savedFilters) {
                renderFilterTable(result.savedFilters);
                lastDataJson = JSON.stringify(result.savedFilters);
                updateStatus('📦 저장된 필터 목록을 불러왔습니다.');
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
                        
                        // 데이터 저장 (영구성 확보)
                        chrome.storage.local.set({ savedFilters: response.data });
                        updateStatus('📡 실시간 동기화 완료');
                    } else {
                        updateStatus('📡 실시간 연결 중...');
                    }
                }
            } else {
                // 필터 페이지가 아니어도 테이블은 유지됨 (상태 메시지만 변경)
                if (lastDataJson) {
                    updateStatus('✅ 수집된 데이터 유지 중 (페이지 이동 가능)');
                } else {
                    updateStatus('ℹ️ 필터 수집 페이지에서 데이터를 가져오세요.');
                }
            }
        } catch (e) {
            // 통신 에러 시에도 기존 데이터는 유지
        }
    }

    function renderFilterTable(filters) {
        filterTableBody.innerHTML = '';
        // 받은 데이터 렌더링
        filters.forEach((filter, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" data-id="${filter.id}"></td>
                <td style="text-align:left; padding-left:10px;">${filter.name}</td>
                <td>${filter.id}</td>
            `;
            filterTableBody.appendChild(tr);
        });

        // 10줄을 맞추기 위한 빈 행 추가
        for (let i = filters.length; i < 10; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td></td><td></td><td></td>';
            filterTableBody.appendChild(tr);
        }
    }

    // 1. 과거 필터 수집 버튼 이벤트 (URL 이동)
    collectFiltersBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.update(tab.id, { url: TARGET_FILTER_URL });
            updateStatus('🔄 필터 수집 페이지로 이동 중...');
        }
    });

    // 2. 삭제 페이지로 이동 버튼 이벤트
    deleteAllBtn.addEventListener('click', async () => {
        const DELETE_PAGE_URL = "https://tmg4084.mycafe24.com/mall/admin/admin_goods_update_delete.php";
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.update(tab.id, { url: DELETE_PAGE_URL });
            updateStatus('🔄 삭제 페이지로 이동 중...');
        }
    });

    // 3. 메시지 전송 함수 (Popup -> Content)
    async function sendDeleteMessage(mode) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url.includes('tmg4084.mycafe24.com')) {
                updateStatus('❌ 더망고 관리자 페이지가 아닙니다.');
                return;
            }

            // 메시지 전송
            await chrome.tabs.sendMessage(tab.id, { 
                action: "TRIGGER_DELETE", 
                mode: mode 
            });

        } catch (error) {
            console.error(error);
            updateStatus('❌ 전송 실패: ' + error.message);
        }
    }

    function updateStatus(msg) {
        statusDiv.textContent = msg;
        statusDiv.style.opacity = '1';
        setTimeout(() => { statusDiv.style.opacity = '0'; }, 3000);
    }
});
