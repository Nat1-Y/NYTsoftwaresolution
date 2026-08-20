/**
 * NYT assistant.
 *
 * The previous matcher returned the first FAQ whose keyword appeared anywhere
 * in the message. Because that entry listed 'do' and 'what', almost every
 * question fell into it. This one scores each intent and needs a real signal
 * before it commits, otherwise it says it does not know.
 */
import { $, $$, trapFocus } from './dom';

interface Intent {
  id: string;
  /** Strong signals — a match here is worth a lot. */
  keywords: string[];
  /** Multi-word phrases weigh more than single words. */
  phrases?: string[];
  answer: string;
}

const intents: Intent[] = [
  {
    id: 'pricing',
    keywords: ['price', 'cost', 'quote', 'rate', 'pricing', 'budget', 'fee', 'charge', 'expensive', 'afford'],
    phrases: ['how much', 'what does it cost'],
    answer:
      "Pricing depends on scope, so here is how it works rather than a number I would have to make up:\n\n💰 **Fixed-scope projects** — one agreed price, paid against milestones you sign off.\n📅 **Dedicated engineers** — a monthly rate per engineer working on your backlog.\n🔧 **Support retainer** — a monthly fee for keeping a live system healthy.\n\n**The first consultation and the written estimate are free.** Tell us what you need in the contact form and you will get a realistic figure with the assumptions spelled out.",
  },
  {
    id: 'timeline',
    keywords: ['timeline', 'deadline', 'duration', 'weeks', 'months', 'schedule'],
    phrases: ['how long', 'how fast', 'how quickly', 'when will', 'delivery time', 'turnaround'],
    answer:
      'It scales with the size of the build:\n\n⚡ **Focused website or app** — 2 to 4 weeks\n📦 **Medium system** (POS, booking, dashboards) — 1 to 3 months\n🏗️ **Large platform** (marketplace, hospital ERP) — 3 to 6 months\n\nYou get a dated timeline before any code is written, and milestone demos along the way so you can see progress rather than take our word for it.',
  },
  {
    id: 'services',
    keywords: ['service', 'build', 'develop', 'offer', 'create', 'make'],
    phrases: ['what can you', 'what do you do', 'do you build', 'can you build'],
    answer:
      "Here is what we build:\n\n🍽️ **Restaurant & café systems** — orders, kitchen displays, stock and daily sales\n🏥 **Clinic & hospital systems** — patient records, appointments, billing\n🛒 **Online stores & marketplaces** — single-seller or multi-vendor\n📱 **Mobile apps** — one codebase for iPhone and Android\n💼 **Business management platforms** — custom ERPs that replace the paperwork\n\nNot sure which you need? Describe the problem rather than the solution and we will work it out with you.",
  },
  {
    id: 'remote',
    keywords: ['remote', 'international', 'global', 'timezone', 'abroad', 'overseas', 'outsource', 'offshore'],
    phrases: ['outside ethiopia', 'work with us', 'hire your team'],
    answer:
      'Yes — remote work is a core part of what we do. 🌍\n\n✅ Fluent technical English\n✅ Meetings scheduled in **your** timezone\n✅ We work inside your repository and review process\n✅ Written weekly progress reports\n✅ Competitive rates against European and North American agencies\n\nWe are based in Addis Ababa (UTC+3), which overlaps comfortably with Europe, the Middle East and Africa, and covers mornings for the US East Coast.',
  },
  {
    id: 'portfolio',
    keywords: ['portfolio', 'case', 'example', 'sample', 'previous', 'past', 'clients', 'projects', 'built'],
    phrases: ['show me your work', 'what have you done', 'who have you worked'],
    answer:
      "Four systems currently running in production:\n\n🍖 **Fikrekun Spagna** — restaurant and butchery POS with offline-first ordering and live stock\n🏥 **Saron Orthopedic Center** — clinical records, appointments and billing\n🎡 **Bora Amusement Park** — QR ticketing handling 5,000+ daily gate validations\n🛒 **Merkato88** — a marketplace with 150+ local merchants\n\nEach case-study card on this page has a **live link** you can open right now — and the Fikrekun one comes with demo credentials so you can log in and click around.",
  },
  {
    id: 'ownership',
    keywords: ['own', 'ownership', 'source', 'license', 'licence', 'copyright', 'ip', 'handover', 'lock-in'],
    phrases: ['who owns', 'do i own', 'source code'],
    answer:
      'You own it. On final payment you receive:\n\n✅ The full source code and its repository history\n✅ The deployment configuration and infrastructure setup\n✅ Documentation and runbooks for handover\n\nNo vendor lock-in, and no licence you have to keep paying to use your own system. If you later want to bring it in-house or hand it to another team, nothing stops you.',
  },
  {
    id: 'offline',
    keywords: ['offline', 'internet', 'connection', 'network', 'power', 'outage', 'downtime'],
    phrases: ['no internet', 'internet goes down', 'without internet', 'when the power'],
    answer:
      'Yes — this is something we design for deliberately, because connectivity here cannot be assumed. 📶\n\nFor point-of-sale and field systems, every transaction is written to a **local database on the device** first, tagged with an idempotency key, and queued. When the connection returns, the queue syncs automatically and duplicates are impossible.\n\nIt is exactly how the Fikrekun Spagna POS keeps taking orders through an outage.',
  },
  {
    id: 'security',
    keywords: ['security', 'secure', 'encryption', 'privacy', 'gdpr', 'hipaa', 'compliance', 'sensitive', 'patient', 'confidential'],
    phrases: ['is it safe', 'data protection', 'keep data safe'],
    answer:
      'Security is designed in rather than bolted on:\n\n🔐 Data encrypted in transit and at rest\n👤 Access granted **per role**, not per user, and denied by default\n📋 Reads of sensitive records written to an append-only audit log\n🔑 Short-lived tokens and strict CORS on every API\n\nWhere a specific regulatory framework applies in your jurisdiction, we design to its requirements and tell you plainly what our work does and does not cover — we would rather set an accurate expectation than an impressive one.',
  },
  {
    id: 'support',
    keywords: ['support', 'maintenance', 'warranty', 'guarantee', 'bug', 'fix', 'broken', 'after'],
    phrases: ['what happens after', 'ongoing support', 'if something breaks'],
    answer:
      'We do not build it and disappear:\n\n✅ A **warranty period** after launch where defects are fixed at no cost\n✅ Optional monthly retainer for monitoring, backups and health checks\n✅ Over-the-air updates, so fixes reach you without downtime\n✅ New features added as your business changes\n\nMost of our clients stay on a retainer, but it is optional — the handover documentation is complete enough to take in-house.',
  },
  {
    id: 'flagship',
    keywords: ['cafe', 'flagship', 'restaurant', 'pos', 'kitchen', 'menu', 'hospitality'],
    phrases: ['cafe manager', 'restaurant software'],
    answer:
      '**NYT Cafe Manager** is our flagship product, built specifically for restaurants and cafés ☕\n\n✅ Orders go straight from the floor to the kitchen display\n✅ Daily sales and expenses tracked automatically\n✅ Keeps working when the internet drops\n✅ Multiple branches managed from one dashboard\n✅ Live profit and food-cost reporting\n\nIt is the same platform behind the Fikrekun Spagna case study on this page. Ask for a demo through the contact form.',
  },
  {
    id: 'takeover',
    keywords: ['existing', 'inherit', 'takeover', 'rescue', 'legacy', 'unfinished', 'abandoned'],
    phrases: ['someone else built', 'take over', 'finish a project', 'previous developer'],
    answer:
      'Often, yes. We start with a short **paid audit** of the existing codebase and infrastructure, then give you a straight assessment:\n\n• What is worth keeping\n• What needs replacing\n• What each path actually costs\n\nSometimes the honest answer is that a rewrite is cheaper than the rescue, and we will tell you that even though it is the less flattering pitch.',
  },
  {
    id: 'contact',
    keywords: ['contact', 'reach', 'email', 'call', 'meet', 'consult', 'talk', 'speak', 'discuss', 'start'],
    phrases: ['get in touch', 'how do i', 'book a call'],
    answer:
      'Easiest ways to reach us:\n\n📧 **Email** — nytsoftwaresolutionplc@gmail.com\n📝 **Contact form** — right at the bottom of this page\n📍 **Based in** — Addis Ababa, Ethiopia (UTC+3)\n💻 **Code** — github.com/Nat1-Y\n\nThe first consultation is free and there is no commitment attached to it.',
  },
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'greetings', 'salam', 'selam'],
    phrases: ['good morning', 'good afternoon', 'good evening'],
    answer:
      "Hello! 👋 Welcome to NYT Software Solutions.\n\nWe build software for businesses — restaurants, clinics, shops, marketplaces — and work as a remote engineering team for companies abroad.\n\nAsk me about **what we build**, **cost**, **timelines**, **who owns the code**, or **our past work**. What would you like to know?",
  },
  {
    id: 'thanks',
    keywords: ['thank', 'thanks', 'cheers', 'appreciated'],
    phrases: ['thank you', 'good job', 'well done'],
    answer:
      "You are very welcome. 😊\n\nIf anything else comes up, or you are ready to talk about a project, the contact form at the bottom of this page is the fastest route to a real person.\n\nHave a good one! 🌟",
  },
];

const FALLBACK =
  "That one is outside what I can answer reliably, and I would rather say so than guess. 🙂\n\nOur team can answer it properly:\n\n📧 **nytsoftwaresolutionplc@gmail.com**\n📝 Or the **contact form** at the bottom of this page\n\nYou can also ask me about pricing, timelines, code ownership, offline capability, security, or our past projects.";

/** Score an intent against the message. Requires a real signal to fire. */
function score(text: string, intent: Intent): number {
  let total = 0;

  for (const phrase of intent.phrases ?? []) {
    if (text.includes(phrase)) total += 5;
  }

  // Whole-word matching, so 'do' never matches inside 'download'.
  for (const keyword of intent.keywords) {
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (pattern.test(text)) total += 2;
  }

  return total;
}

function respond(message: string): string {
  const text = message.toLowerCase().trim();
  if (!text) return FALLBACK;

  let best: Intent | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    const value = score(text, intent);
    if (value > bestScore) {
      bestScore = value;
      best = intent;
    }
  }

  // Below the threshold we admit ignorance rather than answering at random.
  return best && bestScore >= 2 ? best.answer : FALLBACK;
}

/** Render **bold** and newlines without ever injecting raw user input. */
function renderRich(container: HTMLElement, text: string): void {
  text.split('\n').forEach((line, index, all) => {
    let cursor = 0;
    const pattern = /\*\*(.+?)\*\*/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > cursor) {
        container.appendChild(document.createTextNode(line.slice(cursor, match.index)));
      }
      const strong = document.createElement('strong');
      strong.textContent = match[1]!;
      container.appendChild(strong);
      cursor = match.index + match[0].length;
    }

    if (cursor < line.length) {
      container.appendChild(document.createTextNode(line.slice(cursor)));
    }
    if (index < all.length - 1) container.appendChild(document.createElement('br'));
  });
}

export function initChatbot(): void {
  const toggle = $<HTMLButtonElement>('#chatbot-toggle');
  const windowEl = $('#chatbot-window');
  const messages = $('#chatbot-messages');
  const input = $<HTMLInputElement>('#chatbot-input');
  const send = $<HTMLButtonElement>('#chatbot-send');
  if (!toggle || !windowEl || !messages || !input || !send) return;

  const minimize = $<HTMLButtonElement>('#chatbot-minimize');
  const notif = $('.chatbot-notif');
  const openIcon = $<HTMLElement>('.chatbot-open-icon');
  const closeIcon = $<HTMLElement>('.chatbot-close-icon');
  const suggestions = $('#chatbot-suggestions');

  let open = false;
  let greeted = false;
  let releaseTrap: (() => void) | null = null;

  const bubble = (text: string, role: 'bot' | 'user') => {
    const row = document.createElement('div');
    row.className = `chat-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = role === 'bot' ? 'NYT' : 'You';

    const body = document.createElement('div');
    body.className = 'msg-bubble';
    renderRich(body, text);

    // Name the speaker for screen readers, since the avatar is decorative.
    const speaker = document.createElement('span');
    speaker.className = 'sr-only';
    speaker.textContent = role === 'bot' ? 'NYT assistant said: ' : 'You said: ';
    body.prepend(speaker);

    row.append(avatar, body);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  };

  const typing = () => {
    const row = document.createElement('div');
    row.className = 'chat-message bot';
    row.innerHTML =
      '<div class="msg-avatar" aria-hidden="true">NYT</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    /*
     * Decorative. It previously carried aria-label, which is prohibited on a
     * generic element — and announcing "typing…" inside a live region only
     * adds noise before the real reply is announced a moment later.
     */
    row.setAttribute('aria-hidden', 'true');
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  };

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (suggestions) suggestions.hidden = true;
    bubble(trimmed, 'user');
    input.value = '';

    const indicator = typing();
    window.setTimeout(() => {
      indicator.remove();
      bubble(respond(trimmed), 'bot');
    }, 550 + Math.random() * 450);
  };

  const setOpen = (next: boolean) => {
    open = next;
    windowEl.classList.toggle('open', next);
    toggle.setAttribute('aria-expanded', String(next));
    toggle.setAttribute('aria-label', next ? 'Close chat assistant' : 'Open chat assistant');
    if (openIcon) openIcon.style.display = next ? 'none' : 'flex';
    if (closeIcon) closeIcon.style.display = next ? 'flex' : 'none';

    if (next) {
      notif?.classList.add('hidden');
      releaseTrap = trapFocus(windowEl);
      if (!greeted) {
        greeted = true;
        window.setTimeout(
          () =>
            bubble(
              "👋 Hi there — welcome to NYT Software Solutions.\n\nI can answer questions about:\n\n• What we build\n• Cost and timelines\n• Who owns the code\n• Whether it works offline\n• Our past projects\n\nWhat would you like to know?",
              'bot'
            ),
          350
        );
      }
      window.setTimeout(() => input.focus(), 400);
    } else {
      releaseTrap?.();
      releaseTrap = null;
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  minimize?.addEventListener('click', () => {
    setOpen(false);
    toggle.focus();
  });

  send.addEventListener('click', () => submit(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(input.value);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  });

  $$<HTMLButtonElement>('.suggest-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const question = button.dataset.question ?? button.textContent ?? '';
      if (!open) setOpen(true);
      window.setTimeout(() => submit(question), open ? 0 : 450);
    });
  });
}

/** Exported for the command palette, which can open the chat directly. */
export function openChatbot(): void {
  $<HTMLButtonElement>('#chatbot-toggle')?.click();
}
