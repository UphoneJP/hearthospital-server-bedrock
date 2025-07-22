// form validation
  (() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
        form.classList.add('was-validated')
      }, false)
    })
  })()

// collapse button 他のを閉じる 
  document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('[data-bs-toggle="collapse"]');

    buttons.forEach(function(button) {
        button.addEventListener('click', function() {
            const target = document.querySelector(button.getAttribute('data-bs-target'));

            // ボタンの親要素から、同じ階層にある collapse 要素だけを取得
            const parent = button.closest('.colEle'); // 直近の親 collapse
            const siblingCollapseElements = parent
                ? parent.querySelectorAll('.colEle') // 親がいる場合は親の中の collapse 要素
                : document.querySelectorAll('.colEle'); // 親がない場合は全体

            siblingCollapseElements.forEach(function(element) {
                if (element !== target) {
                    const collapseInstance = bootstrap.Collapse.getInstance(element);
                    if (collapseInstance) {
                        collapseInstance.hide();
                    }
                }
            });
        });
    });
  });

  // PWA(Progressive Web App)設定
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  // ActivityIndicator
  window.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a[href]:not([target="_blank"])');

    links.forEach(link => {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');

        // 外部リンクやアンカーリンクなどは除外
        if (href.startsWith('#') || href.startsWith('http')) return;

        // ローディング表示
        const loading = document.getElementById('loading-indicator');
        loading.classList.remove('d-none');
      });
    });

    // フォーム送信にも対応したい場合
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        const loading = document.getElementById('loading-indicator');
        loading.style.display = 'flex';
      });
    });
  });
