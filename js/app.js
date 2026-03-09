// ============================================
// SEPEI - App de Estudio Oposiciones
// Lógica principal de la aplicación
// ============================================

// Estado de la aplicación
const AppState = {
    currentCategory: null, // 'cabo' o 'sargento'
    currentMode: null, // 'practice' o 'exam'
    currentQuestionIndex: 0,
    questions: [],
    filteredQuestions: [],
    userAnswers: [],
    markedQuestions: [],
    examTimer: null,
    examTimeRemaining: 0,
    examConfig: {
        enableTimer: true,
        duration: 90,
        shuffleQuestions: true,
        shuffleAnswers: true
    },
    stats: {
        cabo: {
            answered: new Set(),
            correct: 0,
            incorrect: 0,
            examsCompleted: 0,
            examScores: []
        },
        sargento: {
            answered: new Set(),
            correct: 0,
            incorrect: 0,
            examsCompleted: 0,
            examScores: []
        }
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    updateHomeStats();
    initEventListeners();
});

// ============================================
// EVENT LISTENERS
// ============================================

function initEventListeners() {
    // Selección de categoría
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            selectCategory(category);
        });
    });

    // Botones de navegación hacia atrás
    document.getElementById('btn-back-home').addEventListener('click', showHomeScreen);
    document.getElementById('btn-back-mode-practice').addEventListener('click', showExitConfirmation);
    document.getElementById('btn-back-mode-exam').addEventListener('click', showExitConfirmation);
    document.getElementById('btn-back-results').addEventListener('click', showResultsScreen);
    document.getElementById('btn-back-home-results').addEventListener('click', showHomeScreen);

    // Selección de modo
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            if (mode === 'exam') {
                showExamConfigModal();
            } else {
                startPracticeMode();
            }
        });
    });

    // Filtro de temas
    document.getElementById('btn-toggle-filter').addEventListener('click', toggleFilter);
    document.getElementById('topic-filter').addEventListener('change', filterByTopic);

    // Navegación de preguntas (práctica)
    document.getElementById('btn-prev-question').addEventListener('click', () => navigateQuestion(-1));
    document.getElementById('btn-next-question').addEventListener('click', () => navigateQuestion(1));

    // Navegación de preguntas (examen)
    document.getElementById('btn-exam-prev').addEventListener('click', () => navigateExamQuestion(-1));
    document.getElementById('btn-exam-next').addEventListener('click', () => navigateExamQuestion(1));
    document.getElementById('btn-mark-review').addEventListener('click', toggleMarkQuestion);
    document.getElementById('btn-nav-toggle').addEventListener('click', toggleQuestionNav);
    document.getElementById('btn-submit-exam').addEventListener('click', confirmSubmitExam);

    // Modal de configuración de examen
    document.getElementById('btn-cancel-exam').addEventListener('click', hideExamConfigModal);
    document.getElementById('btn-start-exam').addEventListener('click', startExamMode);
    document.getElementById('enable-timer').addEventListener('change', toggleTimerConfig);

    // Modal de salida
    document.getElementById('btn-continue-exam').addEventListener('click', hideExitModal);
    document.getElementById('btn-confirm-exit').addEventListener('click', confirmExit);

    // Resultados
    document.getElementById('btn-review-exam').addEventListener('click', showReviewScreen);
    document.getElementById('btn-new-exam').addEventListener('click', () => {
        showExamConfigModal();
    });

    // Filtros de revisión
    document.querySelectorAll('.review-filter').forEach(filter => {
        filter.addEventListener('click', () => filterReviewQuestions(filter.dataset.filter));
    });
}

// ============================================
// NAVEGACIÓN DE PANTALLAS
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showHomeScreen() {
    stopExamTimer();
    AppState.currentCategory = null;
    AppState.currentMode = null;
    updateHomeStats();
    showScreen('home-screen');
}

function showModeScreen() {
    showScreen('mode-screen');
}

function showPracticeScreen() {
    showScreen('practice-screen');
}

function showExamScreen() {
    showScreen('exam-screen');
}

function showResultsScreen() {
    showScreen('results-screen');
}

function showReviewScreen() {
    renderReviewList('all');
    showScreen('review-screen');
}

// ============================================
// SELECCIÓN DE CATEGORÍA
// ============================================

function selectCategory(category) {
    AppState.currentCategory = category;
    AppState.questions = category === 'cabo' ? [...questionsCabo] : [...questionsSargento];
    
    // Actualizar UI
    const title = category === 'cabo' ? 'CABO SEPEI' : 'SARGENTO SEPEI';
    document.getElementById('selected-category-title').textContent = title;
    document.getElementById('stats-category-name').textContent = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Actualizar estadísticas de categoría
    updateCategoryStats();
    
    showModeScreen();
}

function updateCategoryStats() {
    const stats = AppState.stats[AppState.currentCategory];
    const totalQuestions = AppState.questions.length;
    
    document.getElementById('cat-total-questions').textContent = totalQuestions;
    document.getElementById('cat-answered').textContent = stats.answered.size;
    
    const accuracy = stats.answered.size > 0 
        ? Math.round((stats.correct / stats.answered.size) * 100) 
        : 0;
    document.getElementById('cat-accuracy').textContent = accuracy + '%';
    document.getElementById('cat-exams').textContent = stats.examsCompleted;
}

// ============================================
// MODO BATERÍA (PRÁCTICA)
// ============================================

function startPracticeMode() {
    AppState.currentMode = 'practice';
    AppState.currentQuestionIndex = 0;
    AppState.filteredQuestions = [...AppState.questions];
    AppState.userAnswers = new Array(AppState.questions.length).fill(null);
    
    // Configurar UI
    document.getElementById('practice-category').textContent = 
        AppState.currentCategory === 'cabo' ? 'CABO' : 'SARGENTO';
    
    // Cargar temas en el filtro
    loadTopicsFilter();
    
    // Mostrar primera pregunta
    renderPracticeQuestion();
    updatePracticeProgress();
    
    showPracticeScreen();
}

function loadTopicsFilter() {
    const topics = [...new Set(AppState.questions.map(q => q.topic))].sort();
    const select = document.getElementById('topic-filter');
    
    select.innerHTML = '<option value="all">Todos los temas</option>';
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        select.appendChild(option);
    });
}

function toggleFilter() {
    document.getElementById('filter-dropdown').classList.toggle('active');
}

function filterByTopic() {
    const topic = document.getElementById('topic-filter').value;
    
    if (topic === 'all') {
        AppState.filteredQuestions = [...AppState.questions];
    } else {
        AppState.filteredQuestions = AppState.questions.filter(q => q.topic === topic);
    }
    
    AppState.currentQuestionIndex = 0;
    renderPracticeQuestion();
    updatePracticeProgress();
}

function renderPracticeQuestion() {
    const question = AppState.filteredQuestions[AppState.currentQuestionIndex];
    if (!question) return;
    
    document.getElementById('q-number').textContent = AppState.currentQuestionIndex + 1;
    document.getElementById('current-question-num').textContent = AppState.currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = AppState.filteredQuestions.length;
    document.getElementById('question-topic').textContent = `Tema: ${question.topic}`;
    document.getElementById('question-text').textContent = question.question;
    
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';
    
    const letters = ['A', 'B', 'C', 'D'];
    const originalIndex = AppState.questions.indexOf(question);
    const previousAnswer = AppState.userAnswers[originalIndex];
    
    question.answers.forEach((answer, index) => {
        const div = document.createElement('div');
        div.className = 'answer-option';
        
        if (previousAnswer !== null) {
            div.classList.add('disabled');
            if (index === question.correct) {
                div.classList.add('correct');
            } else if (index === previousAnswer && previousAnswer !== question.correct) {
                div.classList.add('incorrect');
            }
        }
        
        div.innerHTML = `
            <span class="answer-letter">${letters[index]}</span>
            <span class="answer-text">${answer}</span>
            ${previousAnswer !== null && index === question.correct ? '<i class="fas fa-check answer-icon"></i>' : ''}
            ${previousAnswer !== null && index === previousAnswer && previousAnswer !== question.correct ? '<i class="fas fa-times answer-icon"></i>' : ''}
        `;
        
        if (previousAnswer === null) {
            div.addEventListener('click', () => selectPracticeAnswer(index, question));
        }
        
        answersContainer.appendChild(div);
    });
    
    // Mostrar/ocultar feedback
    const feedbackContainer = document.getElementById('feedback-container');
    if (previousAnswer !== null && question.explanation) {
        feedbackContainer.style.display = 'block';
        document.getElementById('feedback-text').textContent = question.explanation;
    } else {
        feedbackContainer.style.display = 'none';
    }
    
    // Actualizar botones de navegación
    document.getElementById('btn-prev-question').disabled = AppState.currentQuestionIndex === 0;
    document.getElementById('btn-next-question').disabled = 
        AppState.currentQuestionIndex === AppState.filteredQuestions.length - 1;
}

function selectPracticeAnswer(answerIndex, question) {
    const originalIndex = AppState.questions.indexOf(question);
    AppState.userAnswers[originalIndex] = answerIndex;
    
    const stats = AppState.stats[AppState.currentCategory];
    stats.answered.add(originalIndex);
    
    if (answerIndex === question.correct) {
        stats.correct++;
    } else {
        stats.incorrect++;
    }
    
    saveStats();
    renderPracticeQuestion();
    updatePracticeProgress();
}

function navigateQuestion(direction) {
    AppState.currentQuestionIndex += direction;
    renderPracticeQuestion();
}

function updatePracticeProgress() {
    const stats = AppState.stats[AppState.currentCategory];
    const total = AppState.filteredQuestions.length;
    
    let answered = 0;
    let correct = 0;
    let incorrect = 0;
    
    AppState.filteredQuestions.forEach((q, idx) => {
        const originalIndex = AppState.questions.indexOf(q);
        if (stats.answered.has(originalIndex)) {
            answered++;
            if (AppState.userAnswers[originalIndex] === q.correct) {
                correct++;
            } else {
                incorrect++;
            }
        }
    });
    
    const progress = (answered / total) * 100;
    document.getElementById('practice-progress-bar').style.width = `${progress}%`;
    document.getElementById('practice-correct').textContent = correct;
    document.getElementById('practice-incorrect').textContent = incorrect;
}

// ============================================
// MODO EXAMEN
// ============================================

function showExamConfigModal() {
    document.getElementById('exam-config-modal').classList.add('active');
}

function hideExamConfigModal() {
    document.getElementById('exam-config-modal').classList.remove('active');
}

function toggleTimerConfig() {
    const timerConfig = document.getElementById('timer-config');
    timerConfig.style.display = document.getElementById('enable-timer').checked ? 'block' : 'none';
}

function startExamMode() {
    hideExamConfigModal();
    
    // Leer configuración
    AppState.examConfig.enableTimer = document.getElementById('enable-timer').checked;
    AppState.examConfig.duration = parseInt(document.getElementById('exam-duration').value);
    AppState.examConfig.shuffleQuestions = document.getElementById('shuffle-questions').checked;
    AppState.examConfig.shuffleAnswers = document.getElementById('shuffle-answers').checked;
    
    AppState.currentMode = 'exam';
    AppState.currentQuestionIndex = 0;
    AppState.markedQuestions = [];
    
    // Seleccionar 60 preguntas aleatorias
    let examQuestions = [...AppState.questions];
    if (AppState.examConfig.shuffleQuestions) {
        examQuestions = shuffleArray(examQuestions);
    }
    AppState.filteredQuestions = examQuestions.slice(0, 60);
    
    // Mezclar respuestas si está configurado
    if (AppState.examConfig.shuffleAnswers) {
        AppState.filteredQuestions = AppState.filteredQuestions.map(q => {
            const shuffledAnswers = shuffleArrayWithIndex(q.answers);
            return {
                ...q,
                answers: shuffledAnswers.map(a => a.value),
                correct: shuffledAnswers.findIndex(a => a.originalIndex === q.correct)
            };
        });
    }
    
    AppState.userAnswers = new Array(60).fill(null);
    
    // Configurar UI
    document.getElementById('exam-category').textContent = 
        AppState.currentCategory === 'cabo' ? 'CABO' : 'SARGENTO';
    
    // Iniciar temporizador
    if (AppState.examConfig.enableTimer) {
        AppState.examTimeRemaining = AppState.examConfig.duration * 60;
        startExamTimer();
    } else {
        document.getElementById('timer-display').textContent = '--:--';
    }
    
    // Renderizar navegador de preguntas
    renderQuestionNavigator();
    
    // Mostrar primera pregunta
    renderExamQuestion();
    
    showExamScreen();
}

function startExamTimer() {
    updateTimerDisplay();
    AppState.examTimer = setInterval(() => {
        AppState.examTimeRemaining--;
        updateTimerDisplay();
        
        if (AppState.examTimeRemaining <= 0) {
            submitExam();
        }
    }, 1000);
}

function stopExamTimer() {
    if (AppState.examTimer) {
        clearInterval(AppState.examTimer);
        AppState.examTimer = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(AppState.examTimeRemaining / 60);
    const seconds = AppState.examTimeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('exam-timer');
    document.getElementById('timer-display').textContent = display;
    
    // Cambiar color según tiempo restante
    timerElement.classList.remove('warning', 'danger');
    if (AppState.examTimeRemaining <= 300) { // 5 minutos
        timerElement.classList.add('danger');
    } else if (AppState.examTimeRemaining <= 600) { // 10 minutos
        timerElement.classList.add('warning');
    }
}

function renderQuestionNavigator() {
    const grid = document.getElementById('question-nav-grid');
    grid.innerHTML = '';
    
    for (let i = 0; i < 60; i++) {
        const div = document.createElement('div');
        div.className = 'nav-item';
        div.textContent = i + 1;
        div.addEventListener('click', () => goToExamQuestion(i));
        grid.appendChild(div);
    }
    
    updateQuestionNavigator();
}

function updateQuestionNavigator() {
    const items = document.querySelectorAll('.nav-item');
    items.forEach((item, index) => {
        item.classList.remove('current', 'answered', 'marked');
        
        if (index === AppState.currentQuestionIndex) {
            item.classList.add('current');
        }
        if (AppState.userAnswers[index] !== null) {
            item.classList.add('answered');
        }
        if (AppState.markedQuestions.includes(index)) {
            item.classList.add('marked');
        }
    });
    
    // Actualizar barra de progreso
    const answered = AppState.userAnswers.filter(a => a !== null).length;
    const progress = (answered / 60) * 100;
    document.getElementById('exam-progress-fill').style.width = `${progress}%`;
}

function toggleQuestionNav() {
    const grid = document.getElementById('question-nav-grid');
    grid.style.display = grid.style.display === 'none' ? 'grid' : 'none';
}

function goToExamQuestion(index) {
    AppState.currentQuestionIndex = index;
    renderExamQuestion();
    updateQuestionNavigator();
}

function renderExamQuestion() {
    const question = AppState.filteredQuestions[AppState.currentQuestionIndex];
    if (!question) return;
    
    document.getElementById('exam-q-number').textContent = AppState.currentQuestionIndex + 1;
    document.getElementById('exam-question-text').textContent = question.question;
    
    const answersContainer = document.getElementById('exam-answers-container');
    answersContainer.innerHTML = '';
    
    const letters = ['A', 'B', 'C', 'D'];
    const currentAnswer = AppState.userAnswers[AppState.currentQuestionIndex];
    
    question.answers.forEach((answer, index) => {
        const div = document.createElement('div');
        div.className = 'answer-option';
        
        if (currentAnswer === index) {
            div.classList.add('selected');
        }
        
        div.innerHTML = `
            <span class="answer-letter">${letters[index]}</span>
            <span class="answer-text">${answer}</span>
        `;
        
        div.addEventListener('click', () => selectExamAnswer(index));
        answersContainer.appendChild(div);
    });
    
    // Actualizar botones
    document.getElementById('btn-exam-prev').disabled = AppState.currentQuestionIndex === 0;
    document.getElementById('btn-exam-next').disabled = AppState.currentQuestionIndex === 59;
    
    // Actualizar botón de marcar
    const markBtn = document.getElementById('btn-mark-review');
    if (AppState.markedQuestions.includes(AppState.currentQuestionIndex)) {
        markBtn.classList.add('marked');
        markBtn.innerHTML = '<i class="fas fa-flag"></i> Marcada';
    } else {
        markBtn.classList.remove('marked');
        markBtn.innerHTML = '<i class="fas fa-flag"></i> Marcar';
    }
}

function selectExamAnswer(answerIndex) {
    AppState.userAnswers[AppState.currentQuestionIndex] = answerIndex;
    renderExamQuestion();
    updateQuestionNavigator();
}

function navigateExamQuestion(direction) {
    AppState.currentQuestionIndex += direction;
    renderExamQuestion();
    updateQuestionNavigator();
}

function toggleMarkQuestion() {
    const index = AppState.currentQuestionIndex;
    const markedIndex = AppState.markedQuestions.indexOf(index);
    
    if (markedIndex === -1) {
        AppState.markedQuestions.push(index);
    } else {
        AppState.markedQuestions.splice(markedIndex, 1);
    }
    
    renderExamQuestion();
    updateQuestionNavigator();
}

function confirmSubmitExam() {
    const unanswered = AppState.userAnswers.filter(a => a === null).length;
    
    if (unanswered > 0) {
        if (!confirm(`Tienes ${unanswered} preguntas sin responder. ¿Deseas finalizar el examen?`)) {
            return;
        }
    }
    
    submitExam();
}

function submitExam() {
    stopExamTimer();
    
    // Calcular resultados
    let correct = 0;
    let incorrect = 0;
    let blank = 0;
    
    AppState.filteredQuestions.forEach((question, index) => {
        const userAnswer = AppState.userAnswers[index];
        if (userAnswer === null) {
            blank++;
        } else if (userAnswer === question.correct) {
            correct++;
        } else {
            incorrect++;
        }
    });
    
    // Calcular puntuación (sistema típico de oposiciones: +1 acierto, -0.25 error)
    const score = Math.max(0, correct - (incorrect * 0.25));
    const maxScore = 60;
    const percentage = (score / maxScore) * 100;
    
    // Guardar estadísticas
    const stats = AppState.stats[AppState.currentCategory];
    stats.examsCompleted++;
    stats.examScores.push({
        date: new Date().toISOString(),
        score: score,
        correct: correct,
        incorrect: incorrect,
        blank: blank
    });
    saveStats();
    
    // Mostrar resultados
    document.getElementById('results-category').textContent = 
        AppState.currentCategory === 'cabo' ? 'CABO SEPEI' : 'SARGENTO SEPEI';
    
    document.getElementById('final-score').textContent = score.toFixed(1);
    document.getElementById('results-correct').textContent = correct;
    document.getElementById('results-incorrect').textContent = incorrect;
    document.getElementById('results-blank').textContent = blank;
    
    // Animar círculo de puntuación
    const circle = document.getElementById('score-fill-circle');
    const circumference = 283; // 2 * π * 45
    const offset = circumference - (percentage / 100) * circumference;
    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 100);
    
    // Determinar si aprobado (>50%)
    const gradeElement = document.getElementById('results-grade');
    const passed = percentage >= 50;
    gradeElement.className = 'results-grade ' + (passed ? 'passed' : 'failed');
    gradeElement.querySelector('.grade-text').textContent = passed ? 'APROBADO' : 'SUSPENSO';
    
    // Cambiar color del círculo según resultado
    circle.style.stroke = passed ? 'var(--success-color)' : 'var(--danger-color)';
    
    showResultsScreen();
}

// ============================================
// REVISIÓN DE EXAMEN
// ============================================

function renderReviewList(filter) {
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = '';
    
    // Actualizar filtros activos
    document.querySelectorAll('.review-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    AppState.filteredQuestions.forEach((question, index) => {
        const userAnswer = AppState.userAnswers[index];
        let status, statusClass;
        
        if (userAnswer === null) {
            status = 'En blanco';
            statusClass = 'blank';
        } else if (userAnswer === question.correct) {
            status = 'Correcta';
            statusClass = 'correct';
        } else {
            status = 'Incorrecta';
            statusClass = 'incorrect';
        }
        
        // Filtrar según selección
        if (filter !== 'all' && filter !== statusClass) return;
        
        const letters = ['A', 'B', 'C', 'D'];
        
        const div = document.createElement('div');
        div.className = `review-item ${statusClass}`;
        div.innerHTML = `
            <div class="review-item-header">
                <span class="review-question-num">Pregunta ${index + 1}</span>
                <span class="review-status ${statusClass}">${status}</span>
            </div>
            <p class="review-question-text">${question.question}</p>
            <div class="review-answers">
                ${question.answers.map((answer, i) => {
                    let classes = 'review-answer';
                    if (i === question.correct) classes += ' correct-answer';
                    if (i === userAnswer && userAnswer !== question.correct) classes += ' user-answer wrong';
                    return `<div class="${classes}">
                        <strong>${letters[i]}.</strong> ${answer}
                        ${i === question.correct ? '<i class="fas fa-check" style="color: var(--success-color); margin-left: auto;"></i>' : ''}
                        ${i === userAnswer && userAnswer !== question.correct ? '<i class="fas fa-times" style="color: var(--danger-color); margin-left: auto;"></i>' : ''}
                    </div>`;
                }).join('')}
            </div>
            ${question.explanation ? `<div class="feedback-container" style="display: block; margin-top: 15px;">
                <div class="feedback-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Explicación</span>
                </div>
                <p>${question.explanation}</p>
            </div>` : ''}
        `;
        
        reviewList.appendChild(div);
    });
}

function filterReviewQuestions(filter) {
    renderReviewList(filter);
}

// ============================================
// MODAL DE SALIDA
// ============================================

function showExitConfirmation() {
    if (AppState.currentMode === 'exam') {
        document.getElementById('exit-modal').classList.add('active');
    } else {
        showModeScreen();
    }
}

function hideExitModal() {
    document.getElementById('exit-modal').classList.remove('active');
}

function confirmExit() {
    hideExitModal();
    stopExamTimer();
    showModeScreen();
}

// ============================================
// ESTADÍSTICAS Y PERSISTENCIA
// ============================================

function loadStats() {
    const saved = localStorage.getItem('sepei_stats');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Convertir arrays de answered a Sets
        if (parsed.cabo) {
            AppState.stats.cabo = {
                ...parsed.cabo,
                answered: new Set(parsed.cabo.answered || [])
            };
        }
        if (parsed.sargento) {
            AppState.stats.sargento = {
                ...parsed.sargento,
                answered: new Set(parsed.sargento.answered || [])
            };
        }
    }
}

function saveStats() {
    // Convertir Sets a arrays para JSON
    const toSave = {
        cabo: {
            ...AppState.stats.cabo,
            answered: [...AppState.stats.cabo.answered]
        },
        sargento: {
            ...AppState.stats.sargento,
            answered: [...AppState.stats.sargento.answered]
        }
    };
    localStorage.setItem('sepei_stats', JSON.stringify(toSave));
}

function updateHomeStats() {
    // Progreso Cabo
    const caboStats = AppState.stats.cabo;
    const caboTotal = questionsCabo.length;
    const caboProgress = (caboStats.answered.size / caboTotal) * 100;
    document.getElementById('cabo-progress').style.width = `${caboProgress}%`;
    document.getElementById('cabo-progress-text').textContent = `${Math.round(caboProgress)}%`;
    
    // Progreso Sargento
    const sargentoStats = AppState.stats.sargento;
    const sargentoTotal = questionsSargento.length;
    const sargentoProgress = (sargentoStats.answered.size / sargentoTotal) * 100;
    document.getElementById('sargento-progress').style.width = `${sargentoProgress}%`;
    document.getElementById('sargento-progress-text').textContent = `${Math.round(sargentoProgress)}%`;
    
    // Estadísticas generales
    const totalAnswered = caboStats.answered.size + sargentoStats.answered.size;
    document.getElementById('total-answered').textContent = totalAnswered;
    
    const totalCorrect = caboStats.correct + sargentoStats.correct;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    document.getElementById('total-correct').textContent = `${accuracy}%`;
    
    const totalExams = caboStats.examsCompleted + sargentoStats.examsCompleted;
    document.getElementById('exams-completed').textContent = totalExams;
}

// ============================================
// UTILIDADES
// ============================================

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function shuffleArrayWithIndex(array) {
    const indexed = array.map((value, originalIndex) => ({ value, originalIndex }));
    return shuffleArray(indexed);
}
