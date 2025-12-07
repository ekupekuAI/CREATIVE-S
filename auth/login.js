/**
 * Creative Studio - Login System JavaScript
 * Advanced Interactive Login with Animations
 */

class LoginSystem {
    constructor() {
        this.currentTab = 'login';
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeAnimations();
        this.checkSession();
    }

    bindEvents() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });

        // Password toggle
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        signupForm.addEventListener('submit', (e) => this.handleSignup(e));

        // Google sign-in buttons (UI only for now)
        const googleBtns = document.querySelectorAll('.google-btn');
        googleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleGoogleSignIn());
        });

        // Input focus effects
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => this.handleInputFocus(input));
            input.addEventListener('blur', () => this.handleInputBlur(input));
        });

        // Forgot password link
        const forgotLink = document.querySelector('.forgot-link');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => this.handleForgotPassword(e));
        }
    }

    initializeAnimations() {
        // Add entrance animations with delays
        const elements = [
            { selector: '.logo-section', delay: 0.2 },
            { selector: '.login-card', delay: 0.4 },
            { selector: '.tab-nav', delay: 0.6 },
            { selector: '.form-group', delay: 0.8 },
            { selector: '.auth-btn', delay: 1.0 }
        ];

        elements.forEach(({ selector, delay }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.animationDelay = `${delay}s`;
            }
        });

        // Initialize floating shapes
        this.animateFloatingShapes();
    }

    animateFloatingShapes() {
        const shapes = document.querySelectorAll('.floating-shape');
        shapes.forEach((shape, index) => {
            // Add random movement
            setInterval(() => {
                const randomX = Math.random() * 20 - 10;
                const randomY = Math.random() * 20 - 10;
                shape.style.transform += `translate(${randomX}px, ${randomY}px)`;
            }, 3000 + index * 500);
        });
    }

    switchTab(e) {
        const targetTab = e.target.dataset.tab;
        if (targetTab === this.currentTab) return;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');

        // Switch forms with animation
        const currentForm = document.querySelector(`[data-form="${this.currentTab}"]`);
        const targetForm = document.querySelector(`[data-form="${targetTab}"]`);

        currentForm.style.animation = 'formFadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            currentForm.classList.remove('active');
            targetForm.classList.add('active');
            targetForm.style.animation = 'formFadeIn 0.3s ease-out';
        }, 300);

        this.currentTab = targetTab;
        this.clearErrors();
    }

    togglePassword(e) {
        const targetId = e.currentTarget.dataset.target;
        const input = document.getElementById(targetId);
        const icon = e.currentTarget.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }

        // Add ripple effect
        this.createRipple(e.currentTarget, e);
    }

    handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validation
        if (!this.validateLoginForm(email, password)) {
            return;
        }

        // Show loading
        this.showLoading();

        // Simulate API call
        this.authenticateUser(email, password, rememberMe, 'login');
    }

    handleSignup(e) {
        e.preventDefault();

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!this.validateSignupForm(name, email, password, confirmPassword, agreeTerms)) {
            return;
        }

        // Show loading
        this.showLoading();

        // Simulate API call
        this.authenticateUser(email, password, false, 'register');
    }

    validateLoginForm(email, password) {
        this.clearErrors();

        let isValid = true;

        if (!email) {
            this.showError('loginEmail', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError('loginEmail', 'Please enter a valid email');
            isValid = false;
        }

        if (!password) {
            this.showError('loginPassword', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError('loginPassword', 'Password must be at least 6 characters');
            isValid = false;
        }

        return isValid;
    }

    validateSignupForm(name, email, password, confirmPassword, agreeTerms) {
        this.clearErrors();

        let isValid = true;

        if (!name) {
            this.showError('signupName', 'Full name is required');
            isValid = false;
        }

        if (!email) {
            this.showError('signupEmail', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError('signupEmail', 'Please enter a valid email');
            isValid = false;
        }

        if (!password) {
            this.showError('signupPassword', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError('signupPassword', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (password !== confirmPassword) {
            this.showError('signupConfirmPassword', 'Passwords do not match');
            isValid = false;
        }

        if (!agreeTerms) {
            this.showError('agreeTerms', 'You must agree to the Terms & Conditions');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(inputId, message) {
        const input = document.getElementById(inputId);
        const wrapper = input.closest('.input-wrapper') || input.closest('.checkbox-container');

        wrapper.classList.add('error');

        let errorElement = wrapper.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            wrapper.appendChild(errorElement);
        }
        errorElement.textContent = message;

        // Shake animation
        wrapper.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            wrapper.style.animation = '';
        }, 500);
    }

    clearErrors() {
        document.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
            const errorMsg = el.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('active');
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('active');
    }

    async authenticateUser(email, password, rememberMe, action) {
        try {
            const response = await fetch(`/auth/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe
                })
            });

            const data = await response.json();

            if (data.success) {
                // Set session markers
                localStorage.setItem('cs.session', email || 'user');
                document.cookie = `session=true; path=/; max-age=${rememberMe ? 86400 * 30 : 3600}`;

                // Success animation
                this.showSuccessAnimation(() => {
                    window.location.href = data.redirect || '/';
                });
            } else {
                throw new Error(data.message || 'Authentication failed');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('loginEmail', error.message || 'Login failed. Please try again.');
        }
    }

    showSuccessAnimation(callback) {
        // Create success particles
        const card = document.querySelector('.login-card');
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createParticle(card);
            }, i * 50);
        }

        // Hide loading and redirect
        setTimeout(() => {
            this.hideLoading();
            if (callback) callback();
        }, 1500);
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'success-particle';
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: ${Math.random() > 0.5 ? 'var(--primary-neon)' : 'var(--secondary-neon)'};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: 50%;
            top: 50%;
            animation: particleExplode 1s ease-out forwards;
        `;

        container.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 1000);
    }

    handleGoogleSignIn() {
        // UI feedback
        const btn = event.target.closest('.google-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        btn.disabled = true;

        // Simulate Google OAuth
        setTimeout(() => {
            btn.innerHTML = '<i class="fab fa-google"></i> Continue with Google';
            btn.disabled = false;
            this.showError('loginEmail', 'Google sign-in not implemented yet');
        }, 2000);
    }

    handleForgotPassword(e) {
        e.preventDefault();
        // Placeholder for forgot password functionality
        alert('Forgot password functionality coming soon!');
    }

    handleInputFocus(input) {
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) {
            wrapper.style.transform = 'scale(1.02)';
        }
    }

    handleInputBlur(input) {
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) {
            wrapper.style.transform = 'scale(1)';
        }
    }

    createRipple(element, event) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    checkSession() {
        const hasSession = !!localStorage.getItem('cs.session') || document.cookie.includes('session=true');
        if (hasSession && window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = '/index.html';
        }
    }
}

// CSS for additional animations
const additionalStyles = `
@keyframes formFadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
}

@keyframes particleExplode {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
    }
    100% {
        transform: translate(
            ${Math.random() * 200 - 100}px,
            ${Math.random() * 200 - 100}px
        ) scale(1);
        opacity: 0;
    }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

@keyframes ripple {
    to {
        transform: scale(2);
        opacity: 0;
    }
}
`;

// Add additional styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the login system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});