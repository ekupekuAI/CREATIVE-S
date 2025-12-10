'use strict';

(function attachUIManager(global) {
    const UIManager = {
        showModal(id) {
            const modal = document.getElementById(id);
            if (modal) {
                modal.style.display = 'block';
                modal.setAttribute('aria-hidden', 'false');
            }
        },

        hideModal(id) {
            const modal = document.getElementById(id);
            if (modal) {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        },

        showLoader() {
            const loader = document.getElementById('loadingOverlay');
            if (loader) {
                loader.style.display = 'flex';
            }
        },

        hideLoader() {
            const loader = document.getElementById('loadingOverlay');
            if (loader) {
                loader.style.display = 'none';
            }
        },

        toast(message, duration = 3000) {
            const toast = this.createEl('div', { class: 'toast', textContent: message });
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 500);
            }, duration);
        },

        clean(element) {
            if (element) {
                element.innerHTML = '';
            }
        },

        createEl(type, attrs = {}) {
            const el = document.createElement(type);
            Object.keys(attrs).forEach(key => {
                if (key === 'textContent') {
                    el.textContent = attrs[key];
                } else {
                    el.setAttribute(key, attrs[key]);
                }
            });
            return el;
        }
    };

    global.UIManager = UIManager;
})(window);