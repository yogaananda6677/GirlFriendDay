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

    let autoFlipTimer;
    let finaleVisible = false;
    let storyStarted = false;
    let midwayWasShown = false;
    let midwayVisible = false;

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
    document.addEventListener('click', event => {
        if (event.target.closest('#openFinaleButton')) showFinale();
    });
    midwayClose.addEventListener('click', closeMidwaySurprise);
    continueButton.addEventListener('click', closeMidwaySurprise);

    openBookButton.addEventListener('click', () => {
        storyStarted = true;
        openingScene.classList.add('is-opened');
        openingScene.setAttribute('aria-hidden', 'true');
        bookShell.classList.remove('waiting');
        tryStartMusic();
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
