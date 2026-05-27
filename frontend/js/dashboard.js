

// Destaque no menu conforme a página atual
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    const menuLinks = document.querySelectorAll('.menu-nav a');
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.closest('li').classList.add('active');
        } else {
            link.closest('li')?.classList.remove('active');
        }
    });
});