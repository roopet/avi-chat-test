import bot from './assets/bot.svg'
import user from './assets/user.svg'

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')

let loadInterval

function loader(element) {
    element.textContent = ''

    loadInterval = setInterval(() => {
        // Update the text content of the loading indicator
        element.textContent += '.';

        // If the loading indicator has reached three dots, reset it
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0
    const texti = text[0]

    let interval = setInterval(() => {
        if (index < texti.length) {
            element.innerHTML += texti.charAt(index)
            index++
        } else {
            element.innerHTML += text[1]
            clearInterval(interval)
        }
    }, 20)
}

function typeTexti(element, text) {
    let index = 0
    element.innerHTML = text
/*
    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 20)
    */
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${isAi && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `
    )
}

const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(form)

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

    // to clear the textarea input 
    form.reset()

    // bot's chatstripe
    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, '<p></p>', uniqueId)

    // to focus scroll to the bottom 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div 
    const messageDiv = document.getElementById(uniqueId)

    // messageDiv.innerHTML = "..."
    loader(messageDiv)
    // 'https://codex-im0y.onrender.com/' https://avi-chat-test.onrender.com/ http://localhost:5000'
    const response = await fetch('https://avi-chat-test.onrender.com/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: data.get('prompt')
        })
    })

    clearInterval(loadInterval)
    messageDiv.innerHTML = ''

    if (response.ok) {
        const data = await response.json();
        const parsedData = data.bot.trim() // trims any trailing spaces/'\n' 
console.log(parsedData)

function addLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    console.log(urlRegex)
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const linkMatch = text.match(linkRegex);
    const link = linkMatch[0];
    return text.replace(urlRegex, `<a target="_blank" href="${link}">${link}</a>`);
//    return [text.replace(urlRegex, ''),'<a href="$1" target="_blank">$1</a>'];
  }
/*
  function convertLinksToClickable(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
  }
*/
  function makeLinksClickable(text) {
    const regex = /(?:^|\s)((?:https?:\/\/)[^\s]+)/g;
    const matches = [...text.matchAll(regex)];
    let modifiedText = text;
  
    for (const match of matches) {
      const [link] = match.slice(1);
      const formattedLink = link.endsWith('.')
        ? `<a target="_blank" href="${link.slice(0, -1)}">${link.slice(0, -1)}</a>.`
        : `<a target="_blank" href="${link}">${link}</a>`;
      modifiedText = modifiedText.replace(match[0], formattedLink);
    }
  
    return modifiedText;
  }

  function extractLink(text) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const linkMatch = text.match(linkRegex);
  
    if (linkMatch && linkMatch.length > 0) {
      const link = linkMatch[0];
      const textWithoutLink = text.replace(link, '');
      const linkElement = `<a target="_blank" href="${link}">${link}</a>`;
      return [textWithoutLink, linkElement];
    }
  
    return [text, null];
  }

  function extractLinks(text) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const linkMatch = text.match(linkRegex);
  
    if (linkMatch && linkMatch.length > 0) {
      const link = linkMatch[0];
      const textWithoutLink = text.replace(link, '');
      const linkElement = `<a target="_blank" href="${link}">${link}</a>`;
      return [textWithoutLink, linkElement];
    }
  
    return [text, null];
  }

        typeTexti(messageDiv, makeLinksClickable(parsedData))
        
    } else {
        const err = await response.text()

        messageDiv.innerHTML = "Something went wrong"
        alert(err)
    }
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleSubmit(e)
    }
})