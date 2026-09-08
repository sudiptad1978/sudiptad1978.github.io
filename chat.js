(function () {
  'use strict';

  const modal = document.getElementById('aiChatModal');
  const launchButton = document.getElementById('aiChatLaunch');
  const closeButton = document.getElementById('aiChatClose');
  const backdrop = modal?.querySelector('[data-chat-close]');
  const form = document.getElementById('aiChatForm');
  const input = document.getElementById('aiChatInput');
  const messagesElement = document.getElementById('aiChatMessages');
  const quickPrompts = [...document.querySelectorAll('[data-chat-prompt]')];
  const submitButton = document.getElementById('aiChatSubmit');
  const status = document.getElementById('aiChatStatus');
  if (!modal || !launchButton || !closeButton || !form || !input || !messagesElement || !submitButton) return;

  const conversation = [];
  let lastTrigger = launchButton;

  function appendTextWithLinks(element, text) {
    const urlPattern = /(https:\/\/(?:cal\.com|github\.com|www\.linkedin\.com)\/[^\s)]+)/g;
    let cursor = 0;
    for (const match of text.matchAll(urlPattern)) {
      element.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      const link = document.createElement('a');
      link.href = match[0];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = match[0];
      element.appendChild(link);
      cursor = match.index + match[0].length;
    }
    element.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function addMessage(role, text) {
    const item = document.createElement('div');
    item.className = `ai-chat-message ai-chat-message-${role}`;
    item.setAttribute('role', role === 'assistant' ? 'status' : 'listitem');
    const label = document.createElement('span');
    label.className = 'ai-chat-message-label';
    label.textContent = role === 'assistant' ? 'Assistant' : 'You';
    const content = document.createElement('p');
    content.className = 'ai-chat-message-content';
    appendTextWithLinks(content, text);
    item.append(label, content);
    messagesElement.appendChild(item);
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }

  function setOpen(open, trigger = launchButton) {
    lastTrigger = trigger;
    modal.hidden = !open;
    document.body.classList.toggle('ai-chat-open', open);
    launchButton.setAttribute('aria-expanded', String(open));
    if (open) window.setTimeout(() => input.focus(), 0);
    else lastTrigger?.focus();
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    input.disabled = busy;
    submitButton.classList.toggle('is-loading', busy);
    submitButton.textContent = busy ? 'Thinking…' : 'Send';
    status.textContent = busy ? 'The assistant is preparing a response.' : '';
  }

  async function submitMessage(text) {
    const message = text.trim();
    if (!message || submitButton.disabled) return;
    input.value = '';
    addMessage('user', message);
    conversation.push({ role: 'user', content: message });
    setBusy(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ messages: conversation, website: '' })
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || 'Assistant unavailable.');
      addMessage('assistant', data.reply);
      conversation.push({ role: 'assistant', content: data.reply });
    } catch (error) {
      addMessage('assistant', 'I am temporarily unavailable. You can use the Book a 1:1 Call button or contact Sudipta directly.');
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  launchButton.addEventListener('click', () => setOpen(true, launchButton));
  closeButton.addEventListener('click', () => setOpen(false));
  backdrop?.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitMessage(input.value);
  });
  quickPrompts.forEach((button) => button.addEventListener('click', () => submitMessage(button.dataset.chatPrompt || '')));
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  });
})();
