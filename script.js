document.addEventListener('DOMContentLoaded', () => {
    const AUTO_FLIP_DELAY = 8500;
    const bookShell = document.querySelector('.book-container');
    const bookElement = document.getElementById('pages');
    const hiddenPage = bookElement.querySelector('.hidden-page');
    const pageElements = [...bookElement.querySelectorAll('.page:not(.hidden-page)')];
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const finale = document.getElementById('photoFinale');
    const replayButton = document.getElementById('replayButton');
    const music = document.getElementById('backgroundMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicLabel = document.getElementById('musicLabel');
    const trainTrack = document.querySelector('.photo-train-track');
    const openingScene = document.getElementById('openingScene');
    const openBookButton = document.getElementById('openBookButton');
    const midwaySurprise = document.getElementById('midwaySurprise');
    const midwayClose = document.getElementById('midwayClose');
    const continueButton = document.getElementById('continueButton');
    const openFinaleButton = document.getElementById('openFinaleButton');
    const yesLoveButton = document.getElementById('yesLoveButton');
    const noLoveButton = document.getElementById('noLoveButton');
    const loveResponse = document.getElementById('loveResponse');
    const kissButton = document.getElementById('kissButton');
    const kissCount = document.getElementById('kissCount');
    const particleContainer = document.getElementById('particleContainer');
    const kissStorm = document.getElementById('kissStorm');
    const capsuleMessage = document.getElementById('capsuleMessage');
    const capsuleCards = [...document.querySelectorAll('.capsule-card')];

    let autoFlipTimer;
    let finaleVisible = false;
    let storyStarted = false;
    let midwayWasShown = false;
    let midwayVisible = false;
    let kisses = 0;

    hiddenPage?.remove();

    const progress = document.createElement('div');
    progress.className = 'story-progress';
    progress.innerHTML = '<span></span>';
    bookShell.appendChild(progress);

    const counter = document.createElement('div');
    counter.className = 'page-counter';
    bookShell.appendChild(counter);

    let pageFlip;

    function initializePageFlip() {
        if (pageFlip) return;

        pageFlip = new St.PageFlip(bookElement, {
            width: 390,
            height: 570,
            size: 'stretch',
            minWidth: 280,
            maxWidth: 460,
            minHeight: 410,
            maxHeight: 650,
            drawShadow: true,
            flippingTime: 820,
            usePortrait: true,
            autoSize: true,
            maxShadowOpacity: 0.28,
            showCover: true,
            mobileScrollSupport: true,
            swipeDistance: 28,
            clickEventForward: true,
            useMouseEvents: true
        });

        pageFlip.on('flip', event => {
            updateStatus(event.data);
            if (!midwayWasShown && event.data >= 4 && event.data < finalVisibleIndex()) {
                midwayWasShown = true;
                window.setTimeout(showMidwaySurprise, 900);
                return;
            }
            scheduleAutoFlip();
        });

        pageFlip.on('changeState', event => {
            if (event.data === 'user_fold' || event.data === 'fold_corner') scheduleAutoFlip();
        });

        pageFlip.loadFromHTML(pageElements);
        updateStatus(0);
    }

    const markMissingPhoto = image => {
        const showPlaceholder = () => image
            .closest('.photo-item, .cover-photo-container, .train-car')
            ?.classList.add('photo-missing');

        image.addEventListener('error', showPlaceholder);
        if (image.complete && image.naturalWidth === 0) showPlaceholder();
    };

    document.querySelectorAll('.photo-item img, .cover-photo, .train-car img')
        .forEach(markMissingPhoto);

    [...trainTrack.children].forEach(car => {
        const copy = car.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        trainTrack.appendChild(copy);
    });

    function currentPage() {
        return pageFlip ? pageFlip.getCurrentPageIndex() : 0;
    }

    function finalVisibleIndex() {
        return pageFlip && pageFlip.getOrientation() === 'landscape'
            ? pageElements.length - 2
            : pageElements.length - 1;
    }

    function updateStatus(pageIndex = currentPage()) {
        const pageNumber = Math.min(pageIndex + 1, pageElements.length);
        counter.textContent = `${String(pageNumber).padStart(2, '0')} / ${String(pageElements.length).padStart(2, '0')}`;
        progress.firstElementChild.style.width = `${(pageNumber / pageElements.length) * 100}%`;
        prevButton.disabled = pageIndex === 0;
        nextButton.setAttribute('aria-label', pageIndex >= finalVisibleIndex() ? 'Buka kejutan terakhir' : 'Balik halaman berikutnya');
    }

    function scheduleAutoFlip() {
        window.clearTimeout(autoFlipTimer);
        if (!storyStarted || finaleVisible || midwayVisible || document.hidden) return;

        autoFlipTimer = window.setTimeout(() => {
            if (currentPage() >= finalVisibleIndex()) {
                showFinale();
            } else {
                pageFlip.flipNext('bottom');
            }
        }, AUTO_FLIP_DELAY);
    }

    function tryStartMusic() {
        if (!music.paused) return;
        music.volume = 0.42;
        music.play().then(() => {
            musicToggle.classList.add('is-playing');
            musicToggle.setAttribute('aria-pressed', 'true');
            musicLabel.textContent = 'Jeda';
        }).catch(() => {
            musicLabel.textContent = 'Putar musik';
        });
    }

    function showFinale() {
        window.clearTimeout(autoFlipTimer);
        finaleVisible = true;
        bookShell.classList.add('is-closed');
        finale.classList.add('is-visible');
        finale.setAttribute('aria-hidden', 'false');
        finale.scrollTop = 0;
    }

    function showMidwaySurprise() {
        midwayWasShown = true;
        midwayVisible = true;
        window.clearTimeout(autoFlipTimer);
        midwaySurprise.classList.add('is-visible');
        midwaySurprise.setAttribute('aria-hidden', 'false');
    }

    function closeMidwaySurprise() {
        midwayVisible = false;
        noLoveButton?.classList.remove('is-running');
        if (noLoveButton) noLoveButton.removeAttribute('style');
        midwaySurprise.classList.remove('is-visible');
        midwaySurprise.setAttribute('aria-hidden', 'true');
        scheduleAutoFlip();
    }

    function replayStory() {
        finaleVisible = false;
        finale.classList.remove('is-visible');
        finale.setAttribute('aria-hidden', 'true');
        bookShell.classList.remove('is-closed');
        pageFlip.turnToPage(0);
        midwayWasShown = false;
        updateStatus(0);
        scheduleAutoFlip();
    }

    function manualAction(action) {
        if (!storyStarted || !pageFlip || midwayVisible || finaleVisible) return;
        tryStartMusic();
        action();
        scheduleAutoFlip();
    }

    prevButton.addEventListener('click', () => manualAction(() => pageFlip.flipPrev('bottom')));
    nextButton.addEventListener('click', () => manualAction(() => {
        if (currentPage() >= finalVisibleIndex()) showFinale();
        else pageFlip.flipNext('bottom');
    }));
    replayButton.addEventListener('click', replayStory);
    openFinaleButton.addEventListener('click', showFinale);

    function burstHearts(origin, amount = 16) {
        if (!particleContainer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = origin?.getBoundingClientRect?.() || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const symbols = ['♥', '♡', '✨', '💗', '🌷'];
        for (let i = 0; i < amount; i += 1) {
            const particle = document.createElement('span');
            particle.className = 'love-particle';
            particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            particle.style.setProperty('--x', `${x}px`);
            particle.style.setProperty('--y', `${y}px`);
            particle.style.setProperty('--dx', `${(Math.random() - .5) * 260}px`);
            particle.style.setProperty('--dy', `${-70 - Math.random() * 210}px`);
            particle.style.setProperty('--rot', `${(Math.random() - .5) * 120}deg`);
            particle.style.setProperty('--size', `${14 + Math.random() * 20}px`);
            particleContainer.appendChild(particle);
            particle.addEventListener('animationend', () => particle.remove(), { once: true });
        }
    }

    function moveNoButton() {
        if (!noLoveButton) return;
        const margin = 18;
        const width = noLoveButton.offsetWidth || 90;
        const height = noLoveButton.offsetHeight || 44;
        const maxX = Math.max(margin, innerWidth - width - margin);
        const maxY = Math.max(margin, innerHeight - height - margin);
        noLoveButton.classList.add('is-running');
        noLoveButton.style.left = `${margin + Math.random() * (maxX - margin)}px`;
        noLoveButton.style.top = `${margin + Math.random() * (maxY - margin)}px`;
        loveResponse.textContent = 'Hehe, tombol itu memang agak pemalu 😝';
    }

    noLoveButton?.addEventListener('pointerenter', moveNoButton);
    noLoveButton?.addEventListener('click', moveNoButton);
    noLoveButton?.addEventListener('touchstart', event => {
        event.preventDefault();
        moveNoButton();
    }, { passive: false });

    yesLoveButton?.addEventListener('click', () => {
        loveResponse.textContent = 'Nah, ini baru jawaban yang benar! Aku juga sayang kamu 💗';
        continueButton.classList.add('is-ready');
        noLoveButton?.classList.remove('is-running');
        if (noLoveButton) noLoveButton.style.display = 'none';
        burstHearts(yesLoveButton, 24);
    });

    function launchKissStorm() {
        if (!kissStorm) return;
        kissStorm.querySelectorAll('.kiss-drop').forEach(drop => drop.remove());
        const symbols = ['💋', '😘', '😚', '💗', '💕', '🩷'];
        const total = window.matchMedia('(max-width: 680px)').matches ? 52 : 72;
        for (let i = 0; i < total; i += 1) {
            const kiss = document.createElement('span');
            kiss.className = 'kiss-drop';
            kiss.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            kiss.style.left = `${Math.random() * 100}%`;
            kiss.style.setProperty('--kiss-size', `${22 + Math.random() * 34}px`);
            kiss.style.setProperty('--kiss-time', `${1.7 + Math.random() * 1.25}s`);
            kiss.style.setProperty('--kiss-delay', `${Math.random() * .6}s`);
            kiss.style.setProperty('--kiss-drift', `${(Math.random() - .5) * 150}px`);
            kiss.style.setProperty('--kiss-rotate', `${(Math.random() - .5) * 420}deg`);
            kissStorm.appendChild(kiss);
        }
        kissStorm.classList.remove('is-active');
        void kissStorm.offsetWidth;
        kissStorm.classList.add('is-active');
        window.setTimeout(() => {
            kissStorm.classList.remove('is-active');
            kissStorm.querySelectorAll('.kiss-drop').forEach(drop => drop.remove());
        }, 3200);
    }

    kissButton?.addEventListener('click', () => {
        kisses += 1;
        const messages = [
            'Cium virtualnya sudah sampai ke Della 💋',
            'Bonus satu lagi karena kamu lucu banget 😚',
            'Jangan senyum sendiri… nanti ketahuan 🤭',
            `${kisses} hujan cium terkirim. Stok sayangnya tetap tidak terbatas 💗`
        ];
        kissCount.textContent = messages[Math.min(kisses - 1, messages.length - 1)];
        launchKissStorm();
        burstHearts(kissButton, 24);
    });

    capsuleCards.forEach(card => {
        card.addEventListener('click', () => {
            capsuleCards.forEach(item => item.classList.remove('is-open'));
            card.classList.add('is-open');
            if (capsuleMessage) capsuleMessage.textContent = card.dataset.message || '';
            burstHearts(card, 10);
        });
    });

        midwayClose.addEventListener('click', closeMidwaySurprise);
    continueButton.addEventListener('click', closeMidwaySurprise);

    openBookButton.addEventListener('click', () => {
        storyStarted = true;
        openingScene.classList.add('is-opened');
        openingScene.setAttribute('aria-hidden', 'true');
        bookShell.classList.remove('waiting');
        tryStartMusic();
        burstHearts(openBookButton, 20);
        window.requestAnimationFrame(() => {
            initializePageFlip();
            scheduleAutoFlip();
        });
    });

    bookElement.addEventListener('pointerdown', () => {
        tryStartMusic();
        scheduleAutoFlip();
    }, { passive: true });

    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') manualAction(() => pageFlip.flipPrev('bottom'));
        if (event.key === 'ArrowRight') manualAction(() => pageFlip.flipNext('bottom'));
        if (event.key === 'Escape' && finaleVisible) replayStory();
    });

    document.addEventListener('visibilitychange', scheduleAutoFlip);

    musicToggle.addEventListener('click', async () => {
        if (music.paused) {
            tryStartMusic();
        } else {
            music.pause();
            musicToggle.classList.remove('is-playing');
            musicToggle.setAttribute('aria-pressed', 'false');
            musicLabel.textContent = 'Putar musik';
        }
    });

});
