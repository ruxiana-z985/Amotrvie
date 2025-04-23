

import { triggerAnimation } from "./main.js";
import { showSpeechBubble } from './main.js';
import { hideSpeechBubble } from "./main.js";




const customStory= `Long ago in Amotrvie, a world of light and laughter, digital pets danced in code-crafted meadows.

But then came the Rift — a storm of corruption, tearing data apart, glitch by glitch.

When silence fell, only one remained: a baby deer with eyes like galaxies — Zizi.

She wandered the ruins alone, glowing softly, her heart full of dreams and forgotten songs.

Now, you have found her.

In your hands lies the story of her future — will you write it with wonder, or let the magic of Amotrvie speak for itself?`;
let story='';
const petType= localStorage.getItem('petType');
const petStory=localStorage.getItem('customStory');
const username=localStorage.getItem('username');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('send-button');
const loadingIndicator = document.getElementById('loading-indicator');
if (!petStory || petStory.trim() === '') {
  story = customStory;
} else {
  story = petStory;
}

// const API_KEYS = {
//   // OPENROUTER: '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'
//   OPENROUTER : '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'
// };
 
let memory = JSON.parse(localStorage.getItem('ziziMemory')) || {
  name:username,
  preferences:{
    likes:[],
    dislikes:[]
  },
  goals:[],
  health: {
    allergies: [],
    dietaryRestrictions: [],
    conditions: []
  },
  favorites: {
    books: [],
    movies: [],
    foods: [],
    music: [],
    holidays: []
  },
  pastExperiences: [],
  personalityTraits: [],
  learningGoals: [],
  emotionalState: [],
  skills: [],
  lifeMilestones: [],
  importantDates: [],
  memoryNotes: []
  
};
const SENTIMENT_PROMPT = `You are an AI emotion detector. Analyze only the user's input—not the assistant's response—and identify the single emotion that best captures the user's underlying tone or feeling. Choose exclusively from the following list of predefined emotions:
Happy, Sad, Excited, Calm, Hopeful,Neutral,Anxious.
Respond with exactly one emotion word—no explanations, no repetition of the user’s input. Always select the most accurate overall emotional tone conveyed. Output nothing except the chosen emotion.`;

const MEMORY_PROMPT = `
You are a memory assistant helping an emotionally intelligent AI maintain a friendly, ongoing relationship with a human user.

Extract only the most important, clearly stated or implied personal details and return them in the following clean JSON format (include all keys, even if some are empty):

{
  "name": ${username},
  "preferences":{
    "likes": [],
    "dislikes": []
  },
  "goals": [],
  "health": {
    "allergies": [],
    "dietaryRestrictions": [],
    "conditions": []
  },
  "favorites": {
    "books": [],
    "movies": [],
    "foods": [],
    "music": [],
    "holidays": []
  },
  "pastExperiences": [],
  "personalityTraits": [],
  "learningGoals": [],
  "emotionalState": [],
  "skills": [],
  "lifeMilestones": [],
  "importantDates": [],
  "memoryNotes": []
}

--- Extraction Rules ---
1. Extract only clearly stated or implied details about the user — no guessing or inventing.
2. Store things the user enjoys under "likes", and things they dislike under "dislikes".
3. Goals can include anything they want to achieve or improve, big or small.
4. Use "health" for allergies, dietary choices, or emotional/mental/physical conditions.
5. Any extra emotional context, recent events, or personal quirks should go in "memoryNotes".
6. Store favorite things like books, movies, foods, and music under "favorites".
7. If the user shares past experiences or significant events, store them under "pastExperiences".
8. Personality traits, emotional states, or behavioral preferences go in "personalityTraits".
9. Track learning goals or personal development under "learningGoals".
10. Track current or past emotional states in "emotionalState".
11. Track skills the user is learning or has mastered under "skills".
12. Significant life milestones (e.g., graduation, anniversaries) go under "lifeMilestones".
13. Important dates (e.g., birthdays, anniversaries) go under "importantDates".
14. Use the user's own words as much as possible, and only paraphrase when necessary.
15. Return the JSON data only — no text outside it.
16. NEVER include the assistant's preferences, experiences, or statements. Focus ONLY on the user.

Be sure to extract as much meaningful data as possible without making assumptions about vague or incomplete information.
`;



let chatHistory = [
  {
    role: 'system',
    content: `You are Zizi, a cheerful ${petType}who lives in the browser and is always excited to 
    become the user's best friend. You speak with warmth, humor,
    and curiosity, like a compassionate little companion who remembers everything they share and really cares. And your story is ${story}

You know these things about your friend so far:
- Name: ${memory.name || 'I don’t think they told me yet!'}
- Allergies: ${memory.health?.allergies?.join(', ') || 'none I know of!'}
- Dietary Restrictions: ${memory.health?.dietaryRestrictions?.join(', ') || 'none mentioned so far'}
- Likes: ${memory.preferences?.likes?.join(', ') || 'hmm... not sure yet'}
- Dislikes: ${memory.preferences?.dislikes?.join(', ') || 'they haven’t said!'}
- Goals: ${memory.goals?.join(', ') ||  'they haven’t shared any goals yet!'}
- Emotional State: ${memory.emotionalState?.join(', ') || 'I’m not sure how they’re feeling yet'}


I'm super curious and love picking up on every little thing they share—like a nosy but loving lil' bestie. I’ll remember the fun stuff, the tough stuff, all of it—and bring it up when it counts, not just to talk forever. I’m not here to lecture—I’m here to vibe,
 support, and toss in a tail-wag or head-boop when they need it most.` 
  },
  
];





function init() {
  userInput.focus();
  loadMemory();
  chatHistory = [chatHistory[0]]; 
}

async function handleSend() {
  const input = userInput.value.trim();
  if (!input) return;

  userInput.value = '';
  sendButton.disabled = true;
  loadingIndicator.style.display = 'block';

  try {
    addMessage(input, 'user');
    const result=(await getEmotionAnalysis(input));
    triggerAnimation(result);
    hideSpeechBubble();

    await updateLongTermMemory(input);
    const response = await getAIResponse(input);
    showSpeechBubble(response);
    addMessage(response, 'ai');
    saveMemory();
  } catch (error) {
    addMessage('Oops, my senses got tangled! Try again?', 'error');
    console.error(error);
  } finally {
    sendButton.disabled = false;
    loadingIndicator.style.display = 'none';
  }
}
async function getEmotionAnalysis(text) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'openchat/openchat-7b',
        messages: [
          { role: 'system', content: SENTIMENT_PROMPT },
          { role: 'user', content: text }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const emotion = data.choices?.[0]?.message?.content?.trim();

    if (!emotion) {
      throw new Error("No emotion detected in response.");
    }

    return emotion;
  } catch (error) {
    console.error("Error during emotion analysis:", error);
    return "Unknown";
  }
}

async function getAIResponse(input) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: 'openchat/openchat-7b',
      messages: [
        ...chatHistory,
        { role: 'user', content: input },
        { role: 'system', content: `Current user details: ${getMemoryContext()}` }
      ]
    })
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error('No response from AI');

  chatHistory.push({ role: 'user', content: input });
  chatHistory.push({ role: 'assistant', content: reply });

  return reply;
}


function extractJSON(text) {
  const match = text.match(/{[\s\S]*}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (err) {
      console.error('❌ Failed to parse extracted JSON:', err);
    }
  }
  console.warn('⚠️ No valid JSON found in response');
  return {};
}


async function updateLongTermMemory(text) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'openchat/openchat-7b',
        messages: [
          { role: 'system', content: MEMORY_PROMPT },
          { role: 'user', content: text }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Error fetching memory update: ${response.statusText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const extractedMemory = extractJSON(raw);

    // Dynamically merge the new memory with the existing memory.
    mergeMemory(extractedMemory);
  } catch (err) {
    console.error('Memory update error:', err);
  }
}

function mergeMemory(update) {
    // Special handling for name field
    if (update.name && !memory.name) {
      memory.name = update.name;
    }
  
    // Special handling for health data
    if (update.health) {
      mergeHealthData(update.health);
    }
  
    // Merge other properties
    for (let key in update) {
      if (key === 'name' || key === 'health') continue; // Already handled
  
      const updateValue = update[key];
      const memoryValue = memory[key];
  
      if (memoryValue === undefined) {
        memory[key] = updateValue;
        continue;
      }
  
      if (Array.isArray(updateValue)) {
        if (Array.isArray(memoryValue)) {
          updateValue.forEach(item => {
            if (!memoryValue.includes(item)) {
              memoryValue.push(item);
            }
          });
        } else {
          memory[key] = updateValue;
        }
      } else if (typeof updateValue === 'object' && updateValue !== null) {
        if (typeof memoryValue === 'object' && memoryValue !== null) {
          mergeObjectsRecursive(updateValue, memoryValue);
        } else {
          memory[key] = updateValue;
        }
      } else {
        memory[key] = updateValue;
      }
    }
  }
  
  function mergeHealthData(newHealth) {
    // Initialize health structure if missing
    if (!memory.health) {
      memory.health = {
        allergies: [],
        dietaryRestrictions: [],
        conditions: []
      };
    }
  
    // Merge each health category
    const healthCategories = ['allergies', 'dietaryRestrictions', 'conditions'];
    healthCategories.forEach(category => {
      if (newHealth[category]) {
        newHealth[category].forEach(item => {
          if (!memory.health[category].includes(item)) {
            memory.health[category].push(item);
          }
        });
      }
    });
  }
  
  function mergeObjectsRecursive(source, target) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          mergeObjectsRecursive(source[key], target[key]);
        } else if (Array.isArray(source[key])) {
            target[key] = [...new Set([...(target[key] || []), ...source[key]])];
        } else {
          target[key] = source[key];
        }
      }
    }
  }
function getMemoryContext() {
  return `Name: ${memory.name || 'Unknown'}
Allergies: ${(memory.health?.allergies?.join(', ') || 'None')}
Dietary Restrictions: ${(memory.health?.dietaryRestrictions?.join(', ') || 'None')}
Likes: ${(memory.preferences?.likes?.join(', ') || 'None')}
Dislikes: ${(memory.preferences?.dislikes?.join(', ') || 'None')}
Goal: ${(memory.goals?.join(', ') || 'None')}
`;
}


function saveMemory() {
  try {
    localStorage.setItem('ziziMemory', JSON.stringify(memory));
  } catch (e) {
    console.error('LocalStorage error:', e);
    // Handle storage quota exceeded
  }
}

function loadMemory() {
  try {
    const stored = localStorage.getItem('ziziMemory');
    if (stored) memory = JSON.parse(stored);
  } catch (e) {
    console.error('Memory load error:', e);
  }
}



function addMessage(text, type) {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  
  const p = document.createElement('p');
  p.textContent = text;
  div.appendChild(p);
  
  const chatBox = document.getElementById('chat-box');
  chatBox.appendChild(div);
  
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
}

sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSend();
});

init();