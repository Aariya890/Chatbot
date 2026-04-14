const input = document.getElementById("user-input")
const chatBox = document.getElementById("chatbox")
const historyBox = document.getElementById("history")

let chats = JSON.parse(localStorage.getItem("chats")) || []
let activeChatIndex = JSON.parse(localStorage.getItem("activeChatIndex")) ?? -1
let currentChat = []

if (chats.length > 0 && activeChatIndex >= 0) {
    currentChat = chats[activeChatIndex].messages
    loadChat(activeChatIndex)
}

input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage()
})

function saveChats() {
    localStorage.setItem("chats", JSON.stringify(chats))
    localStorage.setItem("activeChatIndex", activeChatIndex)
}

function createAvatar(sender) {
    const avatar = document.createElement("div")
    avatar.className = "avatar"

    const image = document.createElement("img")
    image.src = sender === "user"
        ? "/static/images/user.png"
        : "/static/images/technical-support.png"

    avatar.appendChild(image)
    return avatar
}

function addMessages(sender, text) {
    const div = document.createElement("div")
    div.className = "message " + sender

    const avatar = createAvatar(sender)

    const bubble = document.createElement("div")
    bubble.className = "bubble"
    bubble.innerHTML = marked.parse(text)

    div.appendChild(avatar)
    div.appendChild(bubble)
    chatBox.appendChild(div)

    chatBox.scrollTop = chatBox.scrollHeight
}

function addStreamingMessage(text) {
    const div = document.createElement("div")
    div.className = "message bot"

    const avatar = createAvatar("bot")

    const bubble = document.createElement("div")
    bubble.className = "bubble"

    div.appendChild(avatar)
    div.appendChild(bubble)
    chatBox.appendChild(div)

    let i = 0
    const interval = setInterval(() => {
        bubble.innerHTML = marked.parse(text.slice(0, i))
        i++
        if (i > text.length) clearInterval(interval)
        chatBox.scrollTop = chatBox.scrollHeight
    }, 6)
}

function showTyping() {
    const div = document.createElement("div")
    div.className = "message bot typing"

    const avatar = createAvatar("bot")

    const bubble = document.createElement("div")
    bubble.className = "bubble"
    bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`

    div.appendChild(avatar)
    div.appendChild(bubble)
    chatBox.appendChild(div)

    chatBox.scrollTop = chatBox.scrollHeight
    return div
}

async function sendMessage() {
    const msg = input.value.trim()
    if (!msg) return

    if (activeChatIndex === -1) {
        currentChat = []
        chats.push({ title: msg.substring(0, 25), messages: currentChat })
        activeChatIndex = chats.length - 1
        renderHistory()
        saveChats()
    }

    addMessages("user", msg)
    currentChat.push({ role: "user", content: msg })
    saveChats()

    input.value = ""
    input.disabled = true

    const typingDiv = showTyping()

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg })
        })

        const data = await res.json()

        typingDiv.remove()
        addStreamingMessage(data.reply)

        currentChat.push({ role: "bot", content: data.reply })
        saveChats()
    } catch {
        typingDiv.remove()
        addMessages("bot", "Something went wrong.")
    }

    input.disabled = false
    input.focus()
}

function newChat() {
    currentChat = []
    activeChatIndex = -1
    chatBox.innerHTML = ""
    input.focus()
}

function renderHistory() {
    historyBox.innerHTML = ""

    chats.forEach((chat, i) => {
        const item = document.createElement("div")
        item.className = "history-item"

        if (i === activeChatIndex) {
            item.classList.add("active-chat")
        }

        const title = document.createElement("span")
        title.innerText = chat.title

        const actions = document.createElement("div")
        actions.className = "actions"

        const rename = document.createElement("i")
        rename.className = "fa-solid fa-pen"
        rename.onclick = e => {
            e.stopPropagation()
            const newName = prompt("Rename chat:", chat.title)
            if (newName) {
                chats[i].title = newName
                saveChats()
                renderHistory()
            }
        }

        const del = document.createElement("i")
        del.className = "fa-solid fa-trash"
        del.onclick = e => {
            e.stopPropagation()
            chats.splice(i, 1)

            if (i === activeChatIndex) {
                currentChat = []
                activeChatIndex = -1
                chatBox.innerHTML = ""
            }

            saveChats()
            renderHistory()
        }

        actions.appendChild(rename)
        actions.appendChild(del)

        item.appendChild(title)
        item.appendChild(actions)

        item.onclick = () => loadChat(i)

        historyBox.appendChild(item)
    })
}

function loadChat(index) {
    activeChatIndex = index
    currentChat = chats[index].messages

    chatBox.innerHTML = ""

    currentChat.forEach(msg => {
        addMessages(msg.role === "user" ? "user" : "bot", msg.content)
    })

    renderHistory()
    saveChats()
}

function toggleTheme() {
    document.body.classList.toggle("light")

    localStorage.setItem(
        "theme",
        document.body.classList.contains("light") ? "light" : "dark"
    )
}

function initTheme() {
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "light") {
        document.body.classList.add("light")
    } else {
        document.body.classList.remove("light")
    }
}

renderHistory()
input.focus()
initTheme()