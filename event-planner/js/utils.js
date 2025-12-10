// AI Event Architect - Utilities

export class Utils {
    static async saveToLocalStorage(key, data) {
        try {
            if (window.AppStorage) {
                await AppStorage.save(key, data);
            } else {
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    static async loadFromLocalStorage(key, defaultValue = null) {
        try {
            if (window.AppStorage) {
                const result = await AppStorage.load(key);
                return result !== undefined ? result : defaultValue;
            }
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultValue;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return defaultValue;
        }
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static formatDate(date) {
        if (!date) return 'TBD';

        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return 'Invalid Date';
            }

            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(dateObj);
        } catch (error) {
            console.warn('Invalid date format:', date, error);
            return 'Invalid Date';
        }
    }

    static formatTime(time) {
        if (!time) return 'TBD';

        try {
            const dateObj = new Date(`1970-01-01T${time}`);
            if (isNaN(dateObj.getTime())) {
                return 'Invalid Time';
            }

            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }).format(dateObj);
        } catch (error) {
            console.warn('Invalid time format:', time, error);
            return 'Invalid Time';
        }
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

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1050;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    static animateElement(element, animation) {
        element.style.animation = animation;
        element.addEventListener('animationend', () => {
            element.style.animation = '';
        }, { once: true });
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^\+?[\d\s\-\(\)]+$/;
        return re.test(phone);
    }

    static calculatePercentage(part, total) {
        return total > 0 ? Math.round((part / total) * 100) : 0;
    }

    static sortByProperty(array, property, ascending = true) {
        return array.sort((a, b) => {
            if (a[property] < b[property]) return ascending ? -1 : 1;
            if (a[property] > b[property]) return ascending ? 1 : -1;
            return 0;
        });
    }

    static groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }

    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static isEmpty(obj) {
        return obj == null || Object.keys(obj).length === 0;
    }

    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}