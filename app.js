// NeuroLingua - Neural Classroom Core Logic
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// State Management
let groqApiKey = localStorage.getItem('groq_api_key');
let currentLevel = 'basic';
let messages = [];
let skills = { fluency: 20, grammar: 15, vocabulary: 10 };
let glossary = [];
let grammarInsights = [];
let currentQuizData = null;
let correctionMode = localStorage.getItem('correction_mode') === 'true';

// DOM Elements
const apiModal = document.getElementById('api-modal');
const heroSection = document.getElementById('hero-section');
const appDashboard = document.getElementById('app-dashboard');
const apiKeyInput = document.getElementById('groq-api-key');
const saveApiBtn = document.getElementById('save-api-key');
const userStatus = document.getElementById('user-status');
const btnStart = document.getElementById('btn-start');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const setupPanel = document.getElementById('setup-panel');
const scenarioInput = document.getElementById('scenario-input');
const generateScenarioBtn = document.getElementById('generate-scenario');
const btnRestart = document.getElementById('btn-restart');
const levelBtns = document.querySelectorAll('.level-btn');
const glossaryList = document.getElementById('glossary-list');
const grammarList = document.getElementById('grammar-list');
const vocabCount = document.getElementById('vocab-count');
const quizContainer = document.getElementById('quiz-container');
const quizQuestionsDiv = document.getElementById('quiz-questions');
const submitQuizBtn = document.getElementById('submit-quiz-btn');
const quizResultsDiv = document.getElementById('quiz-results');
const correctionModeToggle = document.getElementById('correction-mode-toggle');

// Initialize App
function init() {
    if (groqApiKey) {
        showDashboard();
    } else {
        showLanding();
    }

    // Set initial state of correction mode toggle
    if (correctionModeToggle) {
        correctionModeToggle.checked = correctionMode;
        correctionModeToggle.addEventListener('change', () => {
            correctionMode = correctionModeToggle.checked;
            localStorage.setItem('correction_mode', correctionMode);
        });
    }
}

function showLanding() {
    heroSection.classList.remove('hidden');
    appDashboard.classList.add('hidden');
    userStatus.classList.add('hidden');
}

function showDashboard() {
    heroSection.classList.add('hidden');
    appDashboard.classList.remove('hidden');
    apiModal.classList.add('hidden');
    userStatus.classList.remove('hidden');
}

// Level Selection Logic
levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        levelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLevel = btn.dataset.level;
    });
}

const LEVELS = ['basic', 'intermediate', 'advanced'];

function advanceLevel() {
    const currentIndex = LEVELS.indexOf(currentLevel);
    if (currentIndex < LEVELS.length - 1) {
        currentLevel = LEVELS[currentIndex + 1];
        // Update UI to reflect new level
        levelBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.level === currentLevel) {
                btn.classList.add('active');
            }
        });
        alert(`¡Has avanzado al nivel ${currentLevel.toUpperCase()}!`);
    } else {
        alert('¡Has completado todos los niveles disponibles!');
    }
});

// API Key Management
saveApiBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key.startsWith('gsk_')) {
        localStorage.setItem('groq_api_key', key);
        groqApiKey = key;
        showDashboard();
    } else {
        alert('Ingresa una Groq API Key válida (gsk_...).');
    }
});

// Chat Logic
async function sendMessageToGroq(userMsg, isInitial = false) {
    if (!isInitial) appendMessage('user', userMsg);

    const loadingId = appendMessage('system', 'Neural Processing...');
    if (!isInitial) messages.push({ role: "user", content: userMsg });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const aiRaw = data.choices[0].message.content;
        removeMessage(loadingId);

        // Parse JSON if AI provides structural data, else treat as normal text
        processAIResponse(aiRaw);

    } catch (error) {
        removeMessage(loadingId);
        appendMessage('system', `Error: ${error.message}`);
    }
}

/**
 * Parses and processes the AI response for classroom integration
 */
function processAIResponse(raw) {
    // Attempt to extract JSON from the response if present (for structural data)
    let text = raw;
    let jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[1]);
            text = raw.replace(jsonMatch[0], "").trim();

            if (data.vocabulary) updateGlossary(data.vocabulary);
            if (data.grammar_tips) updateGrammarInsights(data.grammar_tips);
            if (data.scores) updateSkills(data.scores);
            if (data.quiz) renderQuiz(data.quiz);
        } catch (e) { console.error("JSON Parse Error", e); }
    }

    appendMessage('ai', text);
    messages.push({ role: "assistant", content: raw });
}

// Prompt Engineering
function getSystemPrompt() {
    let correctionPrompt = '';
    if (correctionMode) {
        correctionPrompt = `
    CORRECTION MODE ACTIVE: Provide detailed grammar, spelling, style, and vocabulary suggestions in English only. Focus on improving the user's expression.`;
    }

    const base = `You are a professional English tutor in a highly immersive simulation.
    Your goal is to TEACH while staying in character. 
    
    CRITICAL: You must provide your response in two parts:
    1. The conversation in character.
    2. A JSON block at the end with this structure. After 5 turns, you MUST include a quiz in the JSON block to test the user's understanding of the conversation.
    \`\`\`json
    {
      "vocabulary": [{"word": "string", "meaning": "string"}],
      "grammar_tips": ["string"],
      "scores": {"fluency": number, "grammar": number, "vocab": number},
      "quiz": {
        "title": "string",
        "questions": [
          {
            "id": number,
            "type": "multiple_choice" | "fill_in_the_blank" | "true_false",
            "question": "string",
            "options": ["string", "string", "string", "string"], // Only for multiple_choice
            "correct_answer": "string", // The correct answer or the word to fill in
            "explanation": "string" // Optional: explanation of the correct answer
          }
        ]
      }
    }
    \`\`\`
    
    SCORES: Each score is 0-1 (e.g. 0.05 increase). Provide current progress deltas based on user's last message.
    LEVEL: ${currentLevel.toUpperCase()}.
    BASIC: Use Spanish translations for hard words.
    INTERMEDIATE: Focus on idioms and natural phrasing.
    ADVANCED: Focus on formal/informal nuances.${correctionPrompt}`;

    return base;
}

generateScenarioBtn.addEventListener('click', () => {
    const scenario = scenarioInput.value.trim();
    if (!scenario) return alert('Describe un escenario.');

    // Transition UI
    setupPanel.classList.add('hidden');
    chatForm.classList.remove('hidden');
    chatMessages.innerHTML = '';

    messages = [
        { role: "system", content: `${getSystemPrompt()} Current Scenario: ${scenario}. Start the conversation as the person in that scenario.` }
    ];

    appendMessage('system', `Neural Connection Established: ${scenario}`);
    sendMessageToGroq("Proceed with the simulation.", true);
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg || !groqApiKey) return;
    chatInput.value = '';
    sendMessageToGroq(msg);
});

btnRestart.addEventListener('click', () => {
    if (confirm("¿Reiniciar sesión? Se perderá el rastro actual.")) {
        location.reload();
    }
});

// UI Helpers
function appendMessage(sender, text) {
    const id = Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`;

    const innerClass = sender === 'user'
        ? 'bg-purple-600 rounded-2xl rounded-tr-none'
        : sender === 'system'
            ? 'bg-zinc-800/50 text-gray-400 italic text-[10px] rounded-full px-4 py-1 border border-white/5'
            : 'bg-zinc-800 rounded-2xl rounded-tl-none border border-white/5 markdown-body';

    const content = sender === 'ai' ? marked.parse(text) : text;

    div.innerHTML = `
        <div class="max-w-[85%] ${innerClass} p-4 shadow-xl">
            <div class="text-sm leading-relaxed">${content}</div>
        </div>
    `;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function updateGlossary(words) {
    words.forEach(item => {
        if (!glossary.find(g => g.word === item.word)) {
            glossary.unshift(item);
            const div = document.createElement('div');
            div.className = "p-3 bg-white/5 rounded-xl border border-white/5 animate-in slide-in-from-right duration-500 hover:bg-white/10 transition-colors";
            div.innerHTML = `
                <div class="font-bold text-xs text-purple-400">${item.word}</div>
                <div class="text-[10px] text-gray-400">${item.meaning}</div>
            `;
            glossaryList.prepend(div);
        }
    });
    vocabCount.innerText = glossary.length;
}

function updateGrammarInsights(tips) {
    tips.forEach(tip => {
        const div = document.createElement('div');
        div.className = "p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[11px] animate-in slide-in-from-right duration-500";
        div.innerHTML = `
            <div class="flex gap-2">
                <i class="fa-solid fa-lightbulb text-blue-400 mt-1"></i>
                <p>${tip}</p>
            </div>
        `;
        grammarList.prepend(div);
    });
}

function updateSkills(deltas) {
    Object.keys(deltas).forEach(key => {
        const fullKey = key === 'vocab' ? 'vocabulary' : key;
        skills[fullKey] = Math.min(100, skills[fullKey] + (deltas[key] * 100));

        const bar = document.getElementById(`${fullKey}-bar`);
        const score = document.getElementById(`${fullKey}-score`);
        if (bar) bar.style.width = `${skills[fullKey]}%`;
        if (score) score.innerText = `${Math.round(skills[fullKey])}%`;
    });
}

function renderQuiz(quizData) {
    currentQuizData = quizData; // Store quiz data globally
    chatForm.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    quizQuestionsDiv.innerHTML = ''; // Clear previous questions

    quizData.questions.forEach(q => {
        const questionElement = document.createElement('div');
        questionElement.className = 'bg-white p-4 rounded-lg shadow-md';
        let optionsHtml = '';

        if (q.type === 'multiple_choice' && q.options) {
            optionsHtml = q.options.map((option, index) => `
                <label class="block mt-2">
                    <input type="radio" name="question-${q.id}" value="${option}" class="mr-2">
                    ${option}
                </label>
            `).join('');
        } else if (q.type === 'fill_in_the_blank') {
            optionsHtml = `
                <input type="text" name="question-${q.id}" class="mt-2 p-2 border rounded-md w-full" placeholder="Escribe tu respuesta aquí">
            `;
        } else if (q.type === 'true_false') {
            optionsHtml = `
                <label class="block mt-2">
                    <input type="radio" name="question-${q.id}" value="true" class="mr-2">
                    Verdadero
                </label>
                <label class="block mt-2">
                    <input type="radio" name="question-${q.id}" value="false" class="mr-2">
                    Falso
                </label>
            `;
        }

        questionElement.innerHTML = `
            <p class="font-semibold">${q.question}</p>
            <div class="mt-2">${optionsHtml}</div>
        `;
        quizQuestionsDiv.appendChild(questionElement);
    });
}

submitQuizBtn.addEventListener('click', submitQuiz);

function submitQuiz() {
    let score = 0;
    const totalQuestions = currentQuizData.questions.length;
    const quizResults = [];

    currentQuizData.questions.forEach(q => {
        let userAnswer = '';
        let isCorrect = false;

        if (q.type === 'multiple_choice' || q.type === 'true_false') {
            const selectedOption = document.querySelector(`input[name="question-${q.id}"]:checked`);
            if (selectedOption) {
                userAnswer = selectedOption.value;
                isCorrect = (userAnswer.toLowerCase() === q.correct_answer.toLowerCase());
            }
        } else if (q.type === 'fill_in_the_blank') {
            const inputField = document.querySelector(`input[name="question-${q.id}"]`);
            if (inputField) {
                userAnswer = inputField.value.trim();
                isCorrect = (userAnswer.toLowerCase() === q.correct_answer.toLowerCase());
            }
        }

        if (isCorrect) {
            score++;
        }
        quizResults.push({ question: q.question, userAnswer, correctAnswer: q.correct_answer, isCorrect, explanation: q.explanation });
    });

    quizQuestionsDiv.classList.add('hidden');
    submitQuizBtn.classList.add('hidden');
    quizResultsDiv.classList.remove('hidden');

    let resultsHtml = `<h4 class="text-lg font-bold mb-2">Resultados del Quiz:</h4>`;
    resultsHtml += `<p class="mb-4">Obtuviste ${score} de ${totalQuestions} correctas.</p>`;

    quizResults.forEach(result => {
        resultsHtml += `
            <div class="mb-3 p-3 rounded-md ${result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                <p><strong>Pregunta:</strong> ${result.question}</p>
                <p><strong>Tu respuesta:</strong> ${result.userAnswer || 'No respondida'}</p>
                <p><strong>Respuesta correcta:</strong> ${result.correctAnswer}</p>
                ${result.explanation ? `<p><strong>Explicación:</strong> ${result.explanation}</p>` : ''}
            </div>
        `;
    });

    quizResultsDiv.innerHTML = resultsHtml;

    if (score === totalQuestions) {
        alert('¡Felicidades! Has completado el quiz correctamente.');
        advanceLevel();
    } else {
        alert('Inténtalo de nuevo para desbloquear el siguiente nivel.');
    }

    // After quiz, show chat form again
    quizContainer.classList.add('hidden');
    chatForm.classList.remove('hidden');
    quizQuestionsDiv.innerHTML = ''; // Clear quiz questions
    quizResultsDiv.innerHTML = ''; // Clear quiz results
    submitQuizBtn.classList.remove('hidden'); // Show submit button again
}

init();
btnStart.addEventListener('click', () => apiModal.classList.remove('hidden'));
apiModal.addEventListener('click', (e) => { if (e.target === apiModal) apiModal.classList.add('hidden'); });
