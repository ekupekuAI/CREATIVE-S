// MoodSense+ UI Module

class UIManager {
    static showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    static hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    static showLoading(elementId) {
        const element = document.getElementById(elementId);
        element.innerHTML = '<div class="loading">Loading...</div>';
    }

    static hideLoading(elementId) {
        const element = document.getElementById(elementId);
        element.innerHTML = '';
    }

    static displayError(message, elementId = 'error-message') {
        let errorElement = document.getElementById(elementId);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = elementId;
            errorElement.className = 'error-message';
            document.body.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    static createChart(canvasId, type, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type,
            data,
            options
        });
    }

    static animateElement(elementId, animation) {
        const element = document.getElementById(elementId);
        element.style.animation = animation;
        setTimeout(() => {
            element.style.animation = '';
        }, 1000);
    }

    static updateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        element.style.width = `${percentage}%`;
    }

    static toggleVisibility(elementId) {
        const element = document.getElementById(elementId);
        element.classList.toggle('hidden');
    }

    static setTheme(themeClass) {
        document.body.className = themeClass;
    }

    static scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        element.scrollIntoView({ behavior: 'smooth' });
    }

    static createNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
}

// Export for use in other modules
window.UIManager = UIManager;