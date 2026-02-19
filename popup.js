// popup.js - 더망고 V2 리모컨 (삭제 버튼 제어)

document.addEventListener('DOMContentLoaded', async () => {
    const collectFiltersBtn = document.getElementById('collectFiltersBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const statusDiv = document.getElementById('status');
    const filterTableBody = document.getElementById('filterTableBody');

    const TARGET_FILTER_URL = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";

    let lastDataJson = ""; // 이전 데이터와 비교하기 위한 변수

    // 1초마다 실시간 수집 실행
    const pollInterval = setInterval(fetchRealtimeData, 1000);
    fetchRealtimeData(); // 최초 즉시 실행

    async function fetchRealtimeData() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('getGoodsCategory.php')) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_FILTERS" });
                if (response && response.data) {
                    const currentDataJson = JSON.stringify(response.data);
                    
                    // 데이터가 변경되었을 때만 테이블 갱신 (깜빡임 방지)
                    if (currentDataJson !== lastDataJson) {
                        renderFilterTable(response.data);
                        lastDataJson = currentDataJson;
                        updateStatus('📡 실시간 동기화 중...');
                    }
                }
            } else {
                updateStatus('ℹ️ 필터 관리 페이지에서만 수집 가능');
            }
        } catch (e) {
            // 탭이 닫히거나 페이지가 바뀐 경우 에러 무시
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

    // 2. 전체 삭제 버튼 이벤트
    deleteAllBtn.addEventListener('click', async () => {
        if (!confirm('🚨 경고: 검색 결과의 모든 상품을 마켓에서 삭제하시겠습니까?\n(취소할 수 없습니다.)')) return;
        await sendDeleteMessage('all');
        updateStatus('🚨 전체 상품 삭제 요청 전송');
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
