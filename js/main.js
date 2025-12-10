// ===== Creative Studio Main JavaScript =====

document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeAnimations();
    initializeModuleCards();
    initializeOfflineMode();
    initializeFirebaseMigration();
});

// ===== Offline Mode =====
function initializeOfflineMode() {
    window.addEventListener("offline", () => {
        document.body.classList.add("offline-mode");
    });

    window.addEventListener("online", () => {
        document.body.classList.remove("offline-mode");
    });
}

// ===== Firebase Migration =====
async function initializeFirebaseMigration() {
    // Wait a bit for Firebase to initialize
    setTimeout(async () => {
        if (window.AppStorage && window.AppStorage.migrateLocalStorageToFirebase) {
            try {
                await window.AppStorage.migrateLocalStorageToFirebase();
            } catch (e) {
                console.warn('Firebase migration failed:', e);
            }
        }
    }, 2000); // 2 second delay to ensure Firebase is ready
}

// ===== Theme Management =====
async function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    // Load saved theme via AppStorage (Firestore-first), default to light
    let currentTheme = 'light';
    try {
        const saved = await window.AppStorage.load('theme');
        if (typeof saved === 'string') currentTheme = saved;
    } catch {}
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', toggleTheme);
}

async function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    await window.AppStorage.save('theme', newTheme);
    updateThemeIcon(newTheme);

    // Add transition effect
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ===== Animation Initialization =====
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe all module cards and feature items
    document.querySelectorAll('.module-card, .feature-item').forEach(el => {
        observer.observe(el);
    });

    // Parallax effect for hero background
    window.addEventListener('scroll', handleParallax);
}

function handleParallax() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-section');
    const animatedBg = document.querySelector('.animated-background');

    if (hero && animatedBg) {
        const rate = scrolled * -0.5;
        animatedBg.style.transform = `translateY(${rate}px)`;
    }
}

// ===== Module Card Interactions =====
function initializeModuleCards() {
    const moduleCards = document.querySelectorAll('.module-card');

    moduleCards.forEach(card => {
        card.addEventListener('mouseenter', handleCardHover);
        card.addEventListener('mouseleave', handleCardLeave);
        card.addEventListener('mousemove', handleCardMouseMove);
    });
}

function handleCardHover(event) {
    const card = event.currentTarget;
    const cardIcon = card.querySelector('.card-icon');

    // Add subtle animation to icon
    if (cardIcon) {
        cardIcon.style.transform = 'scale(1.1) rotate(5deg)';
    }

    createRippleEffect(event);
    // Create and start cursor-tracking glow
    createCursorGlow(card);
}

function handleCardLeave(event) {
    const card = event.currentTarget;
    const cardIcon = card.querySelector('.card-icon');

    if (cardIcon) {
        cardIcon.style.transform = 'scale(1) rotate(0deg)';
    }
    // Remove cursor-tracking glow when pointer leaves the card
    removeCursorGlow(card);
}

// Mouse move handler updates target coordinates for the glow
function handleCardMouseMove(event) {
    const card = event.currentTarget;
    const state = card.__glowState;
    if (!state) return;
    const rect = state.rect || card.getBoundingClientRect();
    // target coordinates relative to the card
    state.targetX = event.clientX - rect.left;
    state.targetY = event.clientY - rect.top;
    // Optional: adapt glow size slightly based on distance to center
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = Math.abs(state.targetX - cx) / cx; // 0..1
    const dy = Math.abs(state.targetY - cy) / cy;
    const dist = Math.sqrt(dx*dx + dy*dy) / Math.sqrt(2);
    // closer to edge -> slightly smaller glow, closer to center -> larger
    const sizeFactor = 1.0 - (dist * 0.35);
    state.targetSize = Math.max(120, Math.min(rect.width * 0.9 * sizeFactor, 420));
}

// Create a cursor-following glow element inside the card
function createCursorGlow(card) {
    if (card.__glowState) return; // already created

    const rect = card.getBoundingClientRect();
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    const theme = document.documentElement.getAttribute('data-theme') || 'light';

    // Initial size and style; we'll animate position with rAF
    const initialSize = Math.min(rect.width * 0.8, 360);
    // determine colors from data attribute or fall back to theme-based defaults
    const glowAttr = (card.getAttribute('data-glow') || '').trim();
    const presets = {
        blue: ['rgba(55,65,255,0.72)', 'rgba(88,24,196,0.48)', 'rgba(6,182,212,0.26)'],
        pink: ['rgba(240,93,159,0.72)', 'rgba(245,87,108,0.52)', 'rgba(255,175,189,0.26)'],
        gold: ['rgba(212,175,55,0.78)', 'rgba(180,130,40,0.56)', 'rgba(255,230,153,0.24)'],
        purple: ['rgba(99,102,241,0.78)', 'rgba(139,92,246,0.56)', 'rgba(162,155,254,0.26)'],
        defaultDark: ['rgba(99,102,241,0.85)', 'rgba(139,92,246,0.56)', 'rgba(6,182,212,0.32)'],
        defaultLight: ['rgba(55,65,255,0.62)', 'rgba(88,24,196,0.44)', 'rgba(6,182,212,0.22)']
    };

    let colorStops;
    if (glowAttr.indexOf(',') !== -1) {
        // custom comma-separated values provided
        colorStops = glowAttr.split(',').map(s => s.trim()).slice(0,3);
    } else if (glowAttr && presets[glowAttr]) {
        colorStops = presets[glowAttr];
    } else {
        colorStops = (theme === 'dark') ? presets.defaultDark : presets.defaultLight;
    }
    const colors = colorStops.join(', ');

    glow.style.cssText = `
        position: absolute;
        left: ${rect.width / 2}px;
        top: ${rect.height / 2}px;
        width: ${initialSize}px;
        height: ${initialSize}px;
        pointer-events: none;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
        transition: width 0.12s ease, height 0.12s ease, opacity 0.22s ease, left 0.08s linear, top 0.08s linear;
        opacity: 1;
        z-index: 2; /* sit above card background but below content (content z-index will be bumped)
        */
        mix-blend-mode: normal; /* normal blend so color is visible on light backgrounds */
        background: radial-gradient(circle at 50% 40%, ${colors.split(',')[0]} 0%, ${colors.split(',')[1]} 30%, ${colors.split(',')[2]} 55%, rgba(0,0,0,0) 72%);
        filter: blur(18px) saturate(135%);
    `;

    // Ensure card children render above the glow
    Array.from(card.children).forEach(child => {
        if (child !== glow) {
            const prev = child.style.zIndex;
            // ensure content appears above the glow
            if (!prev) child.style.zIndex = 3;
            if (!child.style.position) child.style.position = 'relative';
        }
    });

    card.appendChild(glow);

    const state = {
        glow,
        rect,
        x: rect.width / 2,
        y: rect.height / 2,
        targetX: rect.width / 2,
        targetY: rect.height / 2,
        size: initialSize,
        targetSize: initialSize,
        raf: null
    };
    card.__glowState = state;

    // Animation loop for smooth following
    function loop() {
        // lerp positions
        state.x += (state.targetX - state.x) * 0.18;
        state.y += (state.targetY - state.y) * 0.18;
        state.size += (state.targetSize - state.size) * 0.12;

        state.glow.style.left = `${state.x}px`;
        state.glow.style.top = `${state.y}px`;
        state.glow.style.width = `${state.size}px`;
        state.glow.style.height = `${state.size}px`;

        state.raf = requestAnimationFrame(loop);
    }

    state.raf = requestAnimationFrame(loop);

    // Update rect periodically in case of layout changes
    state.rectUpdate = setInterval(() => {
        state.rect = card.getBoundingClientRect();
    }, 800);
}

function removeCursorGlow(card) {
    const state = card.__glowState;
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.rectUpdate) clearInterval(state.rectUpdate);
    // fade out then remove
    state.glow.style.transition = 'opacity 0.32s ease, transform 0.32s ease';
    state.glow.style.opacity = '0';
    state.glow.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
        if (state.glow && state.glow.parentNode) state.glow.parentNode.removeChild(state.glow);
        delete card.__glowState;
    }, 340);
}

function createRippleEffect(event) {
    const card = event.currentTarget;
    const ripple = document.createElement('div');
    const rect = card.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        z-index: 1;
    `;

    card.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// ===== Module Navigation =====
function openModule(moduleType, evt) {
    // Add loading state to button (if available)
    let button = null;
    try {
        if (evt && evt.target) button = evt.target.closest('.start-btn') || evt.target.closest('button');
    } catch (e) { button = null; }
    const originalHTML = button ? button.innerHTML : null;
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Loading...';
    }

    // Simulate loading delay for better UX
    setTimeout(() => {
        switch(moduleType) {
            case 'certificate':
                window.location.href = 'certificate-generator/certificate.html';
                break;
            case 'magazine':
                window.location.href = 'magazine/Mag.html';
                break;
            case 'todo':
                window.location.href = 'todo.html';
                break;
            default:
                console.warn('Unknown module type:', moduleType);
                if (button) { button.disabled = false; button.innerHTML = originalHTML; }
        }
    }, 400);
}

// ===== Utility Functions =====

// Smooth scroll to section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Storage helper functions
async function saveToStorage(key, data) {
    try {
        await window.AppStorage.save(key, data);
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

function loadFromStorage(key) {
    try {
        return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : null;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return null;
    }
}

// Add CSS animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== Performance Optimization =====

// Debounce function for scroll events
function debounce(func, wait) {
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

// Optimized scroll handler
const optimizedParallax = debounce(handleParallax, 16); // ~60fps
window.removeEventListener('scroll', handleParallax);
window.addEventListener('scroll', optimizedParallax);

// ===== Error Handling =====
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    showNotification('An error occurred. Please refresh the page.', 'warning');
});

// ===== Service Worker Registration (for future offline support) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ===== Development Helper =====
console.log('%c🎨 Creative Studio Loaded Successfully!', 
    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; border-radius: 5px; font-weight: bold;');

// Export functions for use in modules
window.CreativeStudio = {
    saveToStorage,
    loadFromStorage,
    showNotification,
    toggleTheme,
    openModule
};
