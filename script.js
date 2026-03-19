document.addEventListener('DOMContentLoaded', () => {
    // 1. Page Transition & Fade In
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);

    // Override links for page transition
    document.querySelectorAll('a').forEach(link => {
        if (link.hostname === window.location.hostname && !link.hash && link.target !== '_blank' && !link.getAttribute('download')) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const target = this.href;
                document.body.classList.remove('loaded');
                setTimeout(() => {
                    window.location.href = target;
                }, 400); // Wait 0.4s for fade before redirecting
            });
        }
    });

    // 2. LocalStorage User Name Management
    const userName = localStorage.getItem('animatrix_username');
    const modalOverlay = document.getElementById('welcomeModal');
    const nameInput = document.getElementById('nameInput');
    const confirmNameBtn = document.getElementById('confirmNameBtn');

    // Display name elements
    const displayNameEls = document.querySelectorAll('.display-name');

    function updateDisplayNameEls(name) {
        displayNameEls.forEach(el => {
            el.textContent = name;
        });
    }

    if (!userName && modalOverlay) {
        // First time visit
        modalOverlay.classList.add('active');

        confirmNameBtn.addEventListener('click', () => {
            const val = nameInput.value.trim();
            if (val) {
                localStorage.setItem('animatrix_username', val);
                updateDisplayNameEls(val);

                // Change modal content for a welcome screen
                modalOverlay.innerHTML = `
                    <div class="modal">
                        <i class="bi bi-stars text-neon" style="font-size: 3rem;"></i>
                        <h2 style="margin: 20px 0;">Selamat datang di Animatrix, <span class="text-neon">${val}</span></h2>
                        <button class="btn btn-primary" id="startBtn">Mulai Eksplorasi</button>
                    </div>
                `;

                document.getElementById('startBtn').addEventListener('click', () => {
                    modalOverlay.classList.remove('active');
                });
            }
        });
    } else if (userName) {
        updateDisplayNameEls(userName);
    }

    // Double click to edit name
    const editableName = document.querySelector('.editable-name');
    if (editableName) {
        editableName.addEventListener('dblclick', function () {
            const currentName = localStorage.getItem('animatrix_username') || '';
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.className = 'name-input-inline';

            this.replaceWith(input);
            input.focus();

            input.addEventListener('blur', saveNewName);
            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    saveNewName.call(input);
                }
            });

            function saveNewName() {
                const newName = this.value.trim() || currentName;
                localStorage.setItem('animatrix_username', newName);

                const span = document.createElement('span');
                span.className = 'display-name editable-name text-neon';
                span.textContent = newName;

                // Reattach event
                span.addEventListener('dblclick', editableName.ondblclick || function () {
                    // trigger logic again
                    let dblclickEvent = new MouseEvent('dblclick', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });
                    span.dispatchEvent(dblclickEvent);
                });
                // We just refresh the page for simplicity or re-bind
                location.reload();
            }
        });
    }

    // 3. Sidebar Mobile Drawer
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggle');

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close when clicking outside in mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggleBtn && !sidebarToggleBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // 4. Sidebar Search Filter
    const searchInput = document.getElementById('lessonSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const filter = e.target.value.toLowerCase();
            const lessonLinks = document.querySelectorAll('.sidebar-lesson-link');

            lessonLinks.forEach(link => {
                const text = link.textContent.toLowerCase();
                if (text.includes(filter)) {
                    link.parentElement.style.display = 'block';
                } else {
                    link.parentElement.style.display = 'none';
                }
            });
        });
    }

    // 5. Lesson status synchronization in sidebar and stats
    syncLessonStatus();
    updateDashboardStats();

    // 6. Lesson Page Logic (Mark Complete & Scroll Top)
    const btnFinishLesson = document.getElementById('btnFinishLesson');
    if (btnFinishLesson) {
        // Determine lesson ID from filename
        const lessonPath = window.location.pathname;
        const lessonFileName = lessonPath.substring(lessonPath.lastIndexOf('/') + 1);
        const lessonId = lessonFileName.replace('.html', ''); // e.g., 'ae-bagian1-lesson1'

        // Check if already completed
        updateLessonStatusUI(lessonId);

        btnFinishLesson.addEventListener('click', () => {
            // Save to local Storage
            markLessonCompleted(lessonId);
            updateLessonStatusUI(lessonId);
            syncLessonStatus(); // Sync sidebar
        });
    }

    // Next Button Scroll
    const btnNext = document.getElementById('btnNext');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            // Because of our custom transition, if we want them to technically scroll on this page before transition, we could.
            // But normally a redirect resets scroll. If they want JS scroll on specific action:
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

});

// Utilities for Lesson Progress
function markLessonCompleted(lessonId) {
    let completedLessons = JSON.parse(localStorage.getItem('animatrix_completed_lessons') || '[]');
    if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
        localStorage.setItem('animatrix_completed_lessons', JSON.stringify(completedLessons));
    }

    // Save last lesson
    localStorage.setItem('animatrix_last_lesson', lessonId);
}

function updateLessonStatusUI(lessonId) {
    const completedLessons = JSON.parse(localStorage.getItem('animatrix_completed_lessons') || '[]');
    const statusBadge = document.getElementById('lessonStatusBadge');
    const finishBtn = document.getElementById('btnFinishLesson');

    if (completedLessons.includes(lessonId)) {
        if (statusBadge) {
            statusBadge.className = 'lesson-status completed';
            statusBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i> Sudah dipelajari';
        }
        if (finishBtn) {
            finishBtn.innerHTML = '<i class="bi bi-check2-all"></i> Pelajaran Selesai';
            finishBtn.classList.remove('btn-primary');
            finishBtn.classList.add('btn-outline');
            finishBtn.style.pointerEvents = 'none';
        }
    }
}

function syncLessonStatus() {
    const completedLessons = JSON.parse(localStorage.getItem('animatrix_completed_lessons') || '[]');

    // For sidebar items: they should have a data-lesson-id attribute corresponding to the id
    const sidebarLinks = document.querySelectorAll('.sidebar-lesson-link');
    sidebarLinks.forEach(link => {
        const id = link.getAttribute('data-lesson-id');
        if (id && completedLessons.includes(id)) {
            // add checklist if not exists
            if (!link.querySelector('.bi-check-circle-fill')) {
                link.innerHTML += ' <i class="bi bi-check-circle-fill lesson-completed-icon" style="margin-left:auto; font-size:1rem;"></i>';
            }
        }
    });
}

function updateDashboardStats() {
    // Only run if on dashboard
    const statAeEl = document.getElementById('statAe');
    if (!statAeEl) return;

    const completedLessons = JSON.parse(localStorage.getItem('animatrix_completed_lessons') || '[]');

    let aeCount = 0;
    let amCount = 0;

    completedLessons.forEach(id => {
        if (id.startsWith('ae-')) aeCount++;
        if (id.startsWith('am-')) amCount++;
    });

    // Sesuaikan TOTAL materi yang SUDAH TERSEDIA (bukan coming soon)
    const TOTAL_AE = 1; // Setelah Pertemuan 1 selesai, progress jadi 100%
    const TOTAL_AM = 0; // Alight Motion belum ada materi yang selesai dibuat

    const aeProgress = TOTAL_AE > 0 ? Math.min(Math.round((aeCount / TOTAL_AE) * 100), 100) : 0;
    const amProgress = TOTAL_AM > 0 ? Math.min(Math.round((amCount / TOTAL_AM) * 100), 100) : 0;

    document.getElementById('statAe').textContent = `${aeProgress}%`;
    document.getElementById('statAm').textContent = `${amProgress}%`;
    document.getElementById('statTotal').textContent = completedLessons.length;

    // Bagian "Terakhir" sudah dihapus dari HTML, skip update-nya jika element tidak ada
    const statLastEl = document.getElementById('statLast');
    if (statLastEl) {
        const lastLessonId = localStorage.getItem('animatrix_last_lesson');
        let lastLessonText = "Belum ada";
        if (lastLessonId) {
            if (lastLessonId.startsWith('ae-')) {
                lastLessonText = "AE - " + lastLessonId.split('-')[2].replace('lesson', 'Lesson ');
            } else if (lastLessonId.startsWith('am-')) {
                lastLessonText = "AM - " + lastLessonId.split('-')[2].replace('lesson', 'Lesson ');
            }
        }
        statLastEl.textContent = lastLessonText;
    }
}
