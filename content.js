// content.js - 다리 역할 스크립트 (V5.0)

(function() {
    console.log("🌐 [더망고 V2] content.js 로드됨");

    // 1. inject.js 페이지 내 주입
    const injectScript = () => {
        if (document.getElementById('themango-v2-inject')) return;
        const script = document.createElement('script');
        script.id = 'themango-v2-inject';
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() { this.remove(); };
        (document.head || document.documentElement).appendChild(script);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectScript();
            startObservingStatus();
            autoCheckAndCollect(); 
        });
    } else {
        injectScript();
        startObservingStatus();
        autoCheckAndCollect();
    }

    let currentFilterName = ""; // 현재 작업 중인 필터명 저장용

    // 2. 팝업 메시지 수신
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "GET_FILTERS") {
            sendResponse({ data: scrapeFilters() });
        }

        if (request.action === "SYNC_MARKETS") {
            window.postMessage({
                type: "SET_MARKET_SYNC",
                market: request.market,
                checked: request.checked
            }, "*");
            sendResponse({ status: "forwarded" });
        }

        if (request.action === "GET_PAGE_MARKET_STATUS") {
            sendResponse({ status: getPageMarketStatus() });
        }

        if (request.action === "CLICK_REAL_DELETE_ALL_BTN") {
            currentFilterName = request.filterName; 
            clickWebpageDeleteAllBtn();
            sendResponse({ status: "clicked" });
        }

        if (request.action === "TRIGGER_DELETE") {
            injectScript();
            setTimeout(() => {
                window.postMessage({
                    type: "EXECUTE_MARKET_DELETE",
                    mode: request.mode 
                }, "*");
            }, 100);
            sendResponse({ status: "forwarded" });
        }
        return true;
    });

    // 필터 수집 함수
    function scrapeFilters() {
        const filters = [];
        const rows = document.querySelectorAll('#search_category tbody tr');
        rows.forEach(row => {
            const checkbox = row.querySelector('input[name="chk_value"]');
            const nameInput = row.querySelector('input.input_[type="text"]');
            if (checkbox && nameInput) {
                const uid = checkbox.value.split('|')[0];
                const name = nameInput.value.trim();
                filters.push({ id: uid, name: name });
            }
        });
        return filters.slice(0, 10);
    }

    // 현재 페이지 마켓 상태 가져오기
    function getPageMarketStatus() {
        const checkboxMap = {
            'coupang': 'chk_coupang_yn',
            'gmarket': 'chk_gmarket20_yn',
            '11st': 'chk_11st_yn',
            'smartstore': 'chk_smartstore_yn',
            'lotteon': 'chk_lotteon_yn',
            'auction': 'chk_auction20_yn'
        };
        const status = {};
        for (const [key, id] of Object.entries(checkboxMap)) {
            const el = document.getElementById(id);
            status[key] = el ? el.checked : false;
        }
        return status;
    }

    // 실제 페이지의 "마켓삭제시작(검색결과모든상품)" 버튼을 찾아 클릭
    function clickWebpageDeleteAllBtn() {
        const allButtons = Array.from(document.querySelectorAll('a, button'));
        const targetBtn = allButtons.find(btn => 
            btn.innerText.includes('마켓삭제시작') && btn.innerText.includes('검색결과모든상품')
        );

        if (targetBtn) {
            targetBtn.click();
            console.log("✅ [더망고 V2] 페이지 내 전체 삭제 버튼을 클릭했습니다.");
        } else {
            console.error("❌ [더망고 V2] 삭제 버튼을 찾을 수 없습니다.");
            alert("페이지에서 삭제 버튼을 찾을 수 없습니다. 페이지를 확인해주세요.");
        }
    }

    function getParamFromUrl(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || "";
    }

    // 페이지 내 삭제 상태 감시 관찰자
    function startObservingStatus() {
        const targetNode = document.getElementById('layer_page');
        if (!targetNode) {
            setTimeout(startObservingStatus, 2000);
            return;
        }

        const config = { childList: true, characterData: true, subtree: true };
        const callback = function(mutationsList, observer) {
            const currentText = targetNode.innerText;
            if (currentText.includes("마켓삭제가 완료되었습니다")) {
                console.log("🎊 [더망고 V2] 삭제 완료 감지! 3초 후 이동합니다.");
                
                try { chrome.runtime.sendMessage({ action: "DELETE_COMPLETED" }); } catch(e) {}

                setTimeout(() => {
                    const filterName = currentFilterName || getParamFromUrl('ps_subject');
                    const encodedName = encodeURIComponent(filterName);
                    const REDIRECT_URL = `https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=${encodedName}&ft_num=10&ft_show=&ft_sort=register_asc&is_after_del=Y`;
                    window.location.href = REDIRECT_URL;
                }, 3000);

                observer.disconnect();
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }

    // [V5.0 수정] 삭제 완료 후 이동했을 때 첫 번째 항목 체크 및 수집 버튼 클릭 (함수 직접 호출 방식)
    function autoCheckAndCollect() {
        const url = window.location.href;
        if (url.includes('getGoodsCategory.php') && url.includes('sch_keyword=') && url.includes('is_after_del=Y')) {
            console.log("🔎 [더망고 V2] 필터 자동 체크 및 수집 버튼 실행 시도 중...");
            
            setTimeout(() => {
                const firstCheckbox = document.querySelector('#search_category tbody tr input[name="chk_value"]');
                if (firstCheckbox) {
                    firstCheckbox.checked = true;
                    console.log("✅ [더망고 V2] 필터 자동 선택 완료.");

                    // 페이지의 스크립트 컨텍스트에서 site_check_window()를 실행하도록 주입
                    const script = document.createElement('script');
                    script.textContent = `
                        (function() {
                            console.log("🚀 [더망고 V2] 페이지 내부 site_check_window() 함수를 직접 실행합니다.");
                            if (typeof site_check_window === 'function') {
                                site_check_window();
                            } else {
                                const btn = document.getElementById('start_button');
                                if (btn) btn.click();
                            }
                        })();
                    `;
                    document.body.appendChild(script);
                    script.remove();
                }
            }, 1200); // 안정성을 위해 지연 시간을 1.2초로 충분히 확보
        }
    }
})();
