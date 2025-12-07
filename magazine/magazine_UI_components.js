// Lightweight UI micro-interactions (no business logic changes)

document.addEventListener('DOMContentLoaded', () => {
  const toolbar = document.getElementById('floatingToolbar');
  if (toolbar) {
    window.addEventListener('scroll', () => {
      const offset = window.scrollY * 0.05;
      toolbar.style.transform = `translate(-50%, ${offset}px)`;
    });
  }

  document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.classList.add('ripple'));
    btn.addEventListener('animationend', () => btn.classList.remove('ripple'));
  });

  const canvasShell = document.getElementById('canvasShell');
  if (canvasShell) {
    canvasShell.addEventListener('mouseenter', () => canvasShell.classList.add('floaty'));
    canvasShell.addEventListener('mouseleave', () => canvasShell.classList.remove('floaty'));
  }

  const suggestionList = document.getElementById('layoutSuggestions');
  const autoLabel = document.createElement('div');
  if (suggestionList) {
    autoLabel.className = 'small text-muted shimmer';
    autoLabel.textContent = 'AI Layout recommends “Grid Mosaic” for visual-heavy stories';
    suggestionList.parentElement?.appendChild(autoLabel);
  }
});
