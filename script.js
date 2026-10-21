var copy = document.querySelector(".logos-slide").cloneNode(true);
document.querySelector(".logos").appendChild(copy);

(function () {
    const section = document.querySelector('#bloco-03');

    if (!section) return;

    const track = section.querySelector('.custom-reviews-track');
    const pagination = section.querySelector('.custom-reviews-pagination');

    if (!track || !pagination) return;

    const cards = Array.from(
        track.querySelectorAll('.custom-review-card')
    );

    if (!cards.length) return;

    let activeIndex = 0;
    let resizeTimer;
    let scrollTimer;

    function getVisibleCards() {
        const width = section.getBoundingClientRect().width;

        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    function getTotalPositions() {
        return Math.max(1, cards.length - getVisibleCards() + 1);
    }

    function setActiveDot() {
        const dots = pagination.querySelectorAll('.custom-review-dot');

        dots.forEach((dot, index) => {
            const isActive = index === activeIndex;

            dot.classList.toggle('active', isActive);

            dot.setAttribute(
                'aria-current',
                isActive ? 'true' : 'false'
            );
        });
    }

    function goToSlide(index, smooth = true) {
        const total = getTotalPositions();

        activeIndex = Math.max(0, Math.min(index, total - 1));

        const target = cards[activeIndex];

        if (!target) return;

        const offset = target.offsetLeft - cards[0].offsetLeft;

        track.scrollTo({
            left: offset,
            behavior: smooth ? 'smooth' : 'instant'
        });

        setActiveDot();
    }

    function createPagination() {
        pagination.innerHTML = '';

        const total = getTotalPositions();

        for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');

            dot.type = 'button';
            dot.className = 'custom-review-dot';

            dot.setAttribute('aria-label', `Ir para avaliação ${i + 1}`);

            dot.addEventListener('click', () => {goToSlide(i);});

            pagination.appendChild(dot);
        }

        goToSlide(Math.min(activeIndex, total - 1), false);
    }

    function updateActiveOnScroll() {
        const firstOffset = cards[0].offsetLeft;

        let nearestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < getTotalPositions(); i++) {
            const cardOffset =
                cards[i].offsetLeft - firstOffset;

            const distance = Math.abs(
                track.scrollLeft - cardOffset
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }

        activeIndex = nearestIndex;

        setActiveDot();
    }

    track.addEventListener(
        'scroll',
        () => {
            clearTimeout(scrollTimer);

            scrollTimer = setTimeout(() => {
                updateActiveOnScroll();
            }, 100);
        },
        { passive: true }
    );

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            createPagination();
        }, 150);
    });

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;

    track.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return;

        if (event.target.closest('a, button, input, textarea')) return;

        isDragging = true;
        hasDragged = false;

        startX = event.pageX;
        startScrollLeft = track.scrollLeft;

        track.classList.add('is-dragging');

        event.preventDefault();
    });

    window.addEventListener('mousemove', (event) => {
        if (!isDragging) return;

        const distance = event.pageX - startX;

        if (Math.abs(distance) > 5) {
            hasDragged = true;
        }

        track.scrollLeft = startScrollLeft - distance;
    });

    function stopDragging() {
        if (!isDragging) return;

        isDragging = false;

        track.classList.remove('is-dragging');

        requestAnimationFrame(() => {
            updateActiveOnScroll();
        });
    }

    window.addEventListener('mouseup', stopDragging);

    window.addEventListener('blur', stopDragging);

    track.addEventListener('dragstart', (event) => {
        event.preventDefault();
    });

    track.addEventListener('click', (event) => {
        if (hasDragged) {
            event.preventDefault();
            event.stopPropagation();
            hasDragged = false;
        }
    }, true);

    createPagination();
})();
// ---- formulário de revenda → Gestor de Leads (Agência Delucca) ----
(function () {
    const form = document.querySelector('#form');

    if (!form) return;

    const GESTOR_LEADS_URL = 'https://yygodycmrphlzxxyjzxp.supabase.co/functions/v1/collect';
    const GESTOR_LEADS_SLUG = 'terrana';
    const GESTOR_LEADS_SUBID = 'revenda-atacado-terrana';
    const GESTOR_LEADS_API_KEY = '3d2eae2fffc25029c07fe3dbf11d9e8e8e09bb4521707c0f';

    const submitBtn = form.querySelector('.submit');
    const message = form.querySelector('#mensagem');
    const whatsapp = form.querySelector('#whatsapp');
    const submitText = submitBtn ? submitBtn.textContent : '';

    whatsapp?.addEventListener('input', (event) => {
        let v = event.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        else if (v.length > 0) v = v.replace(/^(\d*)/, '($1');
        event.target.value = v;
    });

    function setMessage(text, type) {
        if (!message) return;
        message.textContent = text;
        message.classList.remove('success', 'error');
        if (type) message.classList.add(type);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = Object.fromEntries(new FormData(form).entries());
        payload.form_origin = GESTOR_LEADS_SUBID;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }
        setMessage('', null);

        try {
            const response = await fetch(GESTOR_LEADS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': GESTOR_LEADS_API_KEY },
                body: JSON.stringify({ slug: GESTOR_LEADS_SLUG, subid: GESTOR_LEADS_SUBID, payload }),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            form.reset();
            setMessage('Recebemos seus dados! Em breve entraremos em contato.', 'success');
        } catch (error) {
            setMessage('Não foi possível enviar agora. Tente novamente em instantes.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitText;
            }
        }
    });
})();
