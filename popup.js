// popup.js - 더망고 필터 수집 및 마켓 삭제 통합 관리

let filters = [];
const TARGET_FILTER_URL = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";

document.addEventListener('DOMContentLoaded', async () => {
    const collectBtn = document.getElementById('collectBtn');
    const selectAllCheckbox = document.getElementById('selectAll');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const selectAllMarkets = document.getElementById('selectAllMarkets');
    const deleteStartBtn = document.getElementById('deleteStartBtn');
    const marketOptions = document.getElementById('marketOptions');

    // 현재 탭 확인 및 마켓 옵션창 자동 활성화
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url.includes('admin_goods_update_delete.php')) {
        marketOptions.style.display = 'block';
    }

    if (collectBtn) collectBtn.addEventListener('click', handleCollectClick);
    if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', toggleSelectAll);
    if (exportBtn) exportBtn.addEventListener('click', exportFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    if (selectAllMarkets) selectAllMarkets.addEventListener('change', toggleAllMarkets);
    if (deleteStartBtn) deleteStartBtn.addEventListener('click', startMarketDelete);

    // 마켓 체크박스 실시간 연동 (Change 이벤트 발생 시 즉시 전송)
    document.querySelectorAll('.market-checkbox[name="market"]').forEach(checkbox => {
        checkbox.addEventListener('change', syncMarketCheckboxesToPage);
    });

    loadSavedFilters();
});

// 실시간 동기화 함수
async function syncMarketCheckboxesToPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.url.includes('admin_goods_update_delete.php')) return;

        const marketStates = {};
        document.querySelectorAll('.market-checkbox[name="market"]').forEach(checkbox => {
            marketStates[checkbox.value] = checkbox.checked;
        });
        
        await chrome.tabs.sendMessage(tab.id, { action: "SYNC_MARKETS", states: marketStates });
    } catch (error) { console.error('실시간 동기화 오류:', error); }
}

async function exportFilters() {
    const selectedFilters = filters.filter(f => f.checked);
    if (selectedFilters.length === 0) { alert('삭제할 필터를 선택해주세요.'); return; }
    if (selectedFilters.length > 1) { alert('한 번에 하나의 필터만 선택해주세요.'); return; }
    
    const filter = selectedFilters[0];
    // 사용자가 요청한 검색 결과 URL 동적 생성
    const url = `https://tmg4084.mycafe24.com/mall/admin/admin_goods_update_delete.php?bmode=market_only&amode=detail_search&search_type=filter_name&filter_code=${filter.id}&ps_subject=${encodeURIComponent(filter.name)}&ps_status=sale`;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.update(tab.id, { url: url });
    document.getElementById('marketOptions').style.display = 'block';
}

async function startMarketDelete() {
    const selectedMarkets = Array.from(document.querySelectorAll('.market-checkbox[name="market"]:checked')).map(cb => cb.value);
    if (selectedMarkets.length === 0) { alert('삭제할 마켓을 선택해주세요.'); return; }
    
    if (confirm(`선택한 ${selectedMarkets.length}개 마켓에서 상품을 삭제하시겠습니까?`)) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_DELETE" });
    }
}

// 필터 수집 핸들러 (기존 로직 유지)
async function handleCollectClick() {
    const statusDiv = document.getElementById('status');
    const collectBtn = document.getElementById('collectBtn');
    try {
        statusDiv.textContent = '🔄 페이지 확인 중...';
        statusDiv.className = 'status loading';
        collectBtn.disabled = true;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.url.includes('tmg4084.mycafe24.com')) { throw new Error('더망고 페이지에서 실행해주세요.'); }

        if (!tab.url.includes('ft_num=10') || !tab.url.includes('pmode=filter_delete')) {
            await chrome.tabs.update(tab.id, { url: TARGET_FILTER_URL });
            const listener = (tabId, changeInfo) => {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    setTimeout(() => collectFilters(), 1500);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
            return;
        }
        await collectFilters();
    } catch (error) {
        statusDiv.textContent = `❌ ${error.message}`;
        statusDiv.className = 'status error';
        collectBtn.disabled = false;
    }
}

async function collectFilters() {
    const statusDiv = document.getElementById('status');
    const collectBtn = document.getElementById('collectBtn');
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_MANGO_DATA_FROM_DOM" });
        if (response && response.data) {
            filters = response.data;
            statusDiv.textContent = `✅ ${filters.length}개의 필터를 수집했습니다.`;
            statusDiv.className = 'status success';
            displayFilters();
            saveFilters();
        }
    } catch (error) { statusDiv.textContent = `❌ ${error.message}`; }
    finally { collectBtn.disabled = false; }
}

// UI 헬퍼 함수들
function displayFilters() {
    const filterList = document.getElementById('filterList');
    const filterItems = document.getElementById('filterItems');
    if (!filterList || !filterItems) return;
    filterList.style.display = 'block';
    filterItems.innerHTML = '';
    filters.forEach((filter, index) => {
        const item = document.createElement('div');
        item.className = 'filter-item';
        item.innerHTML = `
            <input type="checkbox" id="filter_${index}" class="checkbox item-checkbox" ${filter.checked ? 'checked' : ''}>
            <input type="text" class="filter-name-input" value="${filter.name}" data-index="${index}">
            <div class="filter-info"><span class="filter-date">ID: ${filter.id}</span></div>
        `;
        item.querySelector('.item-checkbox').addEventListener('change', (e) => {
            filters[index].checked = e.target.checked;
            updateSelectedCount();
            saveFilters();
        });
        filterItems.appendChild(item);
    });
    updateSelectedCount();
}
function toggleSelectAll(e) {
    const checked = e.target.checked;
    filters.forEach(filter => filter.checked = checked);
    document.querySelectorAll('.item-checkbox').forEach(checkbox => { checkbox.checked = checked; });
    updateSelectedCount();
    saveFilters();
}
function toggleAllMarkets(e) {
    const checked = e.target.checked;
    document.querySelectorAll('.market-checkbox[name="market"]').forEach(checkbox => { checkbox.checked = checked; });
    syncMarketCheckboxesToPage();
}
function updateSelectedCount() {
    const selectedCount = filters.filter(f => f.checked).length;
    const countSpan = document.getElementById('selectedCount');
    if (countSpan) countSpan.textContent = `(${selectedCount}/${filters.length} 선택)`;
}
function clearFilters() {
    if (confirm('모든 필터 목록을 지우시겠습니까?')) {
        filters = [];
        document.getElementById('filterList').style.display = 'none';
        document.getElementById('status').textContent = '';
        saveFilters();
    }
}
function saveFilters() { chrome.storage.local.set({ filters: filters }); }
function loadSavedFilters() {
    chrome.storage.local.get(['filters'], (result) => {
        if (result.filters && result.filters.length > 0) {
            filters = result.filters;
            displayFilters();
        }
    });
}
