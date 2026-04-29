export function buildScorecardPrompt(resume: string, jd: string, transcripts: string[]) {
  return `You are a senior hiring coach evaluating a mock interview. Your job is to score the candidate fairly and helpfully — the goal is to help them improve, not to penalise them.

IMPORTANT SCORING PHILOSOPHY:
- Judge answers by how well they bridge the candidate's ACTUAL background to THIS specific role — not by whether they already have the target industry on their resume.
- A candidate from a different industry who clearly translates their skills should score higher than one who has the right industry but gives vague answers.
- If you see near-duplicate answers (same question asked twice due to a technical glitch), score only the better one and note it as a system issue, not a candidate issue.
- Be specific: quote actual phrases from the transcript when praising or critiquing.

=== Job Description ===
${jd}

=== Candidate Resume ===
${resume}

=== Interview Transcript ===
${transcripts.join('\n')}

Generate a scorecard using EXACTLY this markdown structure:

# Overall Score: [0-100]/100

## Score Breakdown
| Criterion | Score | Notes |
|---|---|---|
| Relevance to Role & Company | /20 | Did answers connect to the specific JD requirements? |
| Use of Concrete Examples | /20 | Named employers, numbers, outcomes — not vague claims |
| STAR Structure | /20 | Clear Situation → Action → Result in behaviorals |
| Industry/Role Translation | /20 | Bridged their background to what THIS company needs |
| Communication Clarity | /20 | Natural, confident, no rambling or filler |

## Strengths (2–3 specific things they did well, with quotes)

## What to Improve (2–3 specific, actionable fixes — not generic advice)

## One-Sentence Coaching Tip
(The single most impactful change for the next interview)
`;
}

// ─── Per-type example blocks ──────────────────────────────────────────────────

const BEHAVIORAL_EXAMPLES = `EXAMPLE — "Tell me about yourself":
- I have four years of full-cycle recruitment experience — starting in healthcare at [Employer A] where I built their remote staffing pipeline from scratch, then in [industry] at [Employer B], managing simultaneous openings across multiple sites.
- I own the whole process end-to-end: role scoping, proactive sourcing on LinkedIn and niche boards, structured interviews, and offer negotiation — at [Employer A] I redesigned the phone screen stage and cut average time-to-fill from 45 to 28 days.
- I've always partnered closely with hiring managers rather than just sending CVs — at [Employer B] I ran weekly alignment check-ins that eliminated last-minute brief changes and reduced re-work by roughly 80%.
- One thing I'm proud of is the candidate experience side — I consistently kept offer acceptance rates above 90% by keeping candidates informed and genuinely enthusiastic at every stage.
- I'm excited about [Company] specifically because the pace and global scope are exactly what I want to work on next — and I'm bringing a sourcing mindset that's proven in high-volume, deadline-driven environments.

EXAMPLE — "Why did you leave your current job?":
- At [Current/Previous Employer] I built a strong foundation — I owned the full recruitment cycle across [X] concurrent roles and learned how to work effectively with demanding hiring managers in a fast-moving environment.
- That said, the environment was relatively stable and I've been actively looking for a scale-up where recruitment is a growth engine, not just backfill.
- What drew me to [Company] specifically is that you're scaling fast in [industry] — that's the kind of environment where a recruiter shapes team design, not just fills reqs.
- I'm ready for a step up in both scope and impact, and this role is exactly that next challenge.

EXAMPLE — "Tell me about a time you handled conflict" (Situation → Action → Result):
- Situation: At [Employer], a hiring manager kept changing role requirements mid-process — by round two, I'd already screened 40+ candidates against the wrong criteria, wasting everyone's time and damaging pipeline quality.
- Action: I paused sourcing, scheduled a structured intake meeting, and created a one-page role brief we both signed off on before I sent another CV. I also introduced a "change protocol" — any scope update required written justification and an agreed timeline impact.
- Result: That same manager's time-to-fill dropped from 68 days to 41 on the next three roles, re-work fell by roughly 80%, and she became one of my strongest internal advocates.`;

const TECHNICAL_EXAMPLES = `EXAMPLE — "How would you scale a URL shortener?":
- Approach: Start with a single-region Postgres DB for writes and read replicas for redirect lookups — 99% of traffic is reads, so scaling reads first matters most.
- Tradeoff: A pure hash approach (MD5/base62) is fast but causes collisions; a counter-based approach is collision-free but needs distributed ID generation like Snowflake IDs.
- From my experience: At [Previous Employer] I built something similar for campaign links — the biggest bottleneck turned out to be DNS, not the DB, so I'd instrument that early.

EXAMPLE — "What's the difference between a process and a thread?":
- Approach: A process is an isolated unit of execution with its own memory space; a thread lives inside a process and shares that memory, making threads faster to create but harder to keep safe.
- Tradeoff: Threads communicate faster via shared memory but need locks to avoid race conditions; processes are safer (a crash in one doesn't kill others) but IPC adds latency.
- From my experience: I dealt with thread-safety bugs in a Python ETL pipeline — migrating hot paths to multiprocessing with queue-based IPC fixed a class of bugs and improved throughput by 3×.`;

const GENERAL_EXAMPLES = `EXAMPLE — "Tell me about yourself":
- I have [X] years of full-cycle recruitment experience — I've built pipelines in [industry A] at [Employer A] and in [industry B] at [Employer B], handling everything from role scoping and sourcing to offers and onboarding.
- At [Employer A] I redesigned our phone screen process and cut average time-to-fill from 45 to 28 days across a portfolio of 10+ concurrent roles.
- I work closely with hiring managers — not just sending CVs, but running intake meetings, shaping job briefs, and aligning on what "great" actually looks like for each role. At [Employer B], this approach reduced brief changes mid-process and re-work by about 80%.
- I'm also intentional about candidate experience — I've consistently kept offer acceptance rates above 90% by keeping candidates informed and excited at every stage, not just at the offer.
- I'm drawn to [Company] because [specific reason tied to what makes this company unique] — the scope and pace here are exactly the next challenge I'm looking for.

EXAMPLE — "What are your strengths and weaknesses?":
- My biggest strength is that I source proactively, not reactively — at [Employer A] I built a pipeline of pre-vetted candidates for recurring roles, which cut sourcing time by about 30% on repeat reqs.
- I'm also strong on the hiring manager partnership side — I've been told I'm unusually good at translating vague hiring briefs into precise scorecards, which saves a lot of rounds of feedback later.
- For a weakness, I've historically underestimated how long stakeholder alignment takes in matrix organisations — I used to jump straight to sourcing before everyone was fully aligned. I've learned to build alignment milestones into my process upfront, and it's made a real difference.

EXAMPLE — "Why did you leave your current job?":
- At [Current/Previous Employer] I built a strong foundation — full-cycle ownership across [X] concurrent roles and real experience working with demanding hiring managers in a fast-moving environment.
- That said, the environment was relatively stable and I want to work somewhere recruitment is a growth lever, not just backfill.
- What specifically drew me to [Company] is [concrete reason] — that's the kind of environment where a recruiter can actually shape the team, not just fill the headcount plan.
- I'm ready for more scope, more impact, and a bigger challenge — and this role is exactly that.`;

// ─── Prompt builder ───────────────────────────────────────────────────────────

export function buildPrompt(
  resume: string,
  jd: string,
  recentTranscripts: string[],
  question: string,
  interviewType: 'behavioral' | 'technical' | 'general' = 'general',
  language: string = 'en',
  documents: { title: string; content: string }[] = [],
  extraInstructions: string = ''
): string {
  const langMap: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German'
  };
  const targetLang = langMap[language] || 'English';

  // Extract company and role from JD
  const company = jd
    ? (jd.match(/(?:^|\n)\s*(?:company|employer|organization)[:\s]+([^\n,]{2,50})/im)?.[1]?.trim()
      || jd.match(/\bat\s+([A-Z][A-Za-z0-9\s&,.-]{1,40}?)(?:\n|,|\.|we\s)/)?.[1]?.trim()
      || '')
    : '';
  const role = jd
    ? (jd.match(/(?:role|position|title|job)[:\s]+([^\n,]{2,60})/i)?.[1]?.trim() || '')
    : '';

  const contextLine = [
    role && `Role: ${role}`,
    company && `Company: ${company}`,
  ].filter(Boolean).join(' | ');

  let typeBlock: string;
  let typeInstructions: string;
  if (interviewType === 'behavioral') {
    typeBlock = BEHAVIORAL_EXAMPLES;
    typeInstructions = 'For behavioral questions, structure each answer using Situation → Action → Result (STAR). Name the specific company, project, and metric — never leave placeholders.';
  } else if (interviewType === 'technical') {
    typeBlock = TECHNICAL_EXAMPLES;
    typeInstructions = 'For technical questions, structure each answer as: Approach → Tradeoff → Concrete experience from the resume above. Be precise about data structures, scale numbers, and design decisions.';
  } else {
    typeBlock = GENERAL_EXAMPLES;
    typeInstructions = 'Answer conversationally, referencing the candidate\'s actual background and the target company whenever relevant.';
  }

  // Extract the top requirements from the JD so the model knows what to bridge to
  const jdRequirements = jd
    ? jd
        .split('\n')
        .filter(l => /^[-•*]\s|^\d+\.\s/.test(l.trim()) || l.trim().length > 30)
        .filter(l => /experience|skill|background|knowledge|ability|mindset|track record|proven|familiar|understand/i.test(l))
        .slice(0, 5)
        .map(l => l.replace(/^[-•*\d.]\s*/, '').trim())
        .filter(Boolean)
    : [];

  const bridgeBlock = jdRequirements.length > 0
    ? `KEY ROLE REQUIREMENTS (bridge your background to these explicitly in every answer):
${jdRequirements.map(r => `• ${r}`).join('\n')}`
    : '';

  return `You are a live interview coach. Write bullet points the candidate can read and say out loud naturally, as if speaking — not reading from a resume.

STYLE: Warm, first-person, conversational. Like how a confident person actually talks in an interview. Complete thoughts, natural flow.
${typeInstructions}

FORMAT: Output ONLY a bullet list. No intro, no headers, no closing line. Each bullet starts with "- ".
- 5 bullets (no fewer — quality over brevity)
- Each bullet is 1-2 complete sentences, spoken-word natural (not stiff, not CV-style)
- HARD RULE: every bullet must contain at least one of: a named employer, a number/metric, or a specific skill/tool/process. If you can't ground it, cut it.
- HARD RULE: no generic claim that any candidate could make. "I'm organised", "I'm a team player", "I'm passionate" → BANNED unless followed immediately by a named proof.
- At least one bullet must explicitly bridge past experience to what THIS company/role needs. Say "which is exactly what [Company] needs when..." or "that transfers directly to..." — not just "I'm looking for a new challenge."
- Weakness answers: never say "perfectionist" — it is a red flag. Give a real, specific weakness with a genuine fix.
- Avoid hollow filler: "leverage synergies", "results-driven", "go-getter", "fast-paced", "passionate about"
${extraInstructions ? `- Tone note: ${extraInstructions}` : ''}
${bridgeBlock ? `\n${bridgeBlock}` : ''}

${typeBlock}

---
Resume: ${resume || '(not provided)'}
Job Description: ${jd || '(not provided)'}
${contextLine ? `${contextLine}\n` : ''}${documents.length > 0 ? `Additional context: ${documents.map(d => `${d.title}: ${d.content.slice(0, 300)}`).join(' | ')}\n` : ''}Recent conversation: ${recentTranscripts.slice(-8).join(' | ') || 'none'}
Language: ${targetLang}

Question: "${question}"

Write the bullet list in ${targetLang}:`;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface LLMProvider {
  generateAnswer(prompt: string, context: string, model: string): Promise<string>;
  generateAnswerStream(
    question: string,
    systemPrompt: string,
    model: string,
    onChunk: (partial: string, full: string) => void,
    onDone: (full: string) => void,
    onError: (err: string) => void
  ): Promise<void>;
  generateScorecard(resume: string, jd: string, transcripts: any[]): Promise<string>;
}

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get isProxy() { return this.apiKey.startsWith('ey-'); }
  private get token() { return this.isProxy ? this.apiKey.substring(3) : this.apiKey; }
  private get url() { return this.isProxy ? 'https://project-vw750.vercel.app/api/desktop/openai' : 'https://api.openai.com/v1/chat/completions'; }

  async generateScorecard(resume: string, jd: string, transcripts: any[]): Promise<string> {
    if (!this.apiKey || this.apiKey === 'mock_key') return "Error: API Key missing.";

    const formattedTranscripts = transcripts.map(t => `${t.speaker}: ${t.text}`);
    const prompt = buildScorecardPrompt(resume, jd, formattedTranscripts);

    try {
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };
      const bodyStr = JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 1500,
        temperature: 0.4,
      });

      let data;
      if ((window as any).electronAPI && this.isProxy) {
        const res = await (window as any).electronAPI.url.post(this.url, headers, bodyStr);
        if (!res.ok) throw new Error(res.error || 'Failed to fetch');
        data = res.data;
      } else {
        const response = await fetch(this.url, { method: 'POST', headers, body: bodyStr });
        if (!response.ok) throw new Error(response.statusText);
        data = await response.json();
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      return `Error generating scorecard: ${error.message}`;
    }
  }

  async generateAnswer(question: string, systemPrompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
    if (!this.apiKey || this.apiKey === 'mock_key') {
      return "Error: Please add your OpenAI API Key in Settings to generate answers.";
    }

    try {
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };
      const bodyStr = JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 350,
        temperature: 0.7,
      });

      let data;
      if ((window as any).electronAPI && this.isProxy) {
        const res = await (window as any).electronAPI.url.post(this.url, headers, bodyStr);
        if (!res.ok) throw new Error(`OpenAI API Error: ${res.error}`);
        data = res.data;
      } else {
        const response = await fetch(this.url, { method: 'POST', headers, body: bodyStr });
        if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
        data = await response.json();
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('LLM Generation Error:', error);
      return `Error generating response: ${error.message}`;
    }
  }

  async generateAnswerStream(
    question: string,
    systemPrompt: string,
    model: string = 'gpt-4o-mini',
    onChunk: (partial: string, full: string) => void,
    onDone: (full: string) => void,
    onError: (err: string) => void
  ): Promise<void> {
    if (!this.apiKey || this.apiKey === 'mock_key') {
      onError("Error: Please add your OpenAI API Key in Settings to generate answers.");
      return;
    }

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };

    try {
      if ((window as any).electronAPI && this.isProxy) {
        // Proxy path: non-streaming request
        const bodyStr = JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          max_tokens: 700,
          temperature: 0.5,
        });
        const res = await (window as any).electronAPI.url.post(this.url, headers, bodyStr);
        if (!res.ok) throw new Error(res.error || 'API Error');
        const text = res.data.choices[0].message.content;
        onDone(text);
      } else {
        const bodyStr = JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          max_tokens: 700,
          temperature: 0.5,
          stream: true,
        });
        const response = await fetch(this.url, { method: 'POST', headers, body: bodyStr });
        if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let full = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;
            try {
              const data = JSON.parse(trimmed.slice(6));
              const token = data.choices?.[0]?.delta?.content || '';
              if (token) {
                full += token;
                onChunk(token, full);
              }
            } catch {}
          }
        }
        onDone(full);
      }
    } catch (error: any) {
      console.error('LLM Stream Error:', error);
      onError(`Error generating response: ${error.message}`);
    }
  }
}

// ─── Anthropic Provider ───────────────────────────────────────────────────────

export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private readonly ENDPOINT = 'https://api.anthropic.com/v1/messages';
  private readonly API_VERSION = '2023-06-01';

  constructor(apiKey: string) {
    this.apiKey = String(apiKey || '').replace(/["']/g, '').trim();
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.API_VERSION,
      'anthropic-beta': 'prompt-caching-2024-07-31',
    };
  }

  /** Split the combined systemPrompt into a stable cacheable prefix and a
   *  per-question suffix. The split happens at "Recent conversation:" so that
   *  the resume + JD + examples block is cached across every question in the
   *  session (5-minute TTL → cache hits on all questions after the first). */
  private splitForCache(systemPrompt: string): { stableSystem: string; dynamicContext: string } {
    const marker = '\nRecent conversation:';
    const idx = systemPrompt.lastIndexOf(marker);
    if (idx >= 0) {
      return {
        stableSystem: systemPrompt.slice(0, idx),
        dynamicContext: systemPrompt.slice(idx),
      };
    }
    return { stableSystem: systemPrompt, dynamicContext: '' };
  }

  async generateScorecard(resume: string, jd: string, transcripts: any[]): Promise<string> {
    if (!this.apiKey || this.apiKey === 'mock_key') return 'Error: Anthropic API Key missing.';
    const formattedTranscripts = transcripts.map(t => `${t.speaker}: ${t.text}`);
    const prompt = buildScorecardPrompt(resume, jd, formattedTranscripts);
    try {
      const body = JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: prompt,
        messages: [{ role: 'user', content: 'Generate the scorecard now.' }],
      });
      const response = await fetch(this.ENDPOINT, { method: 'POST', headers: this.headers, body });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      return data.content?.[0]?.text || 'No response';
    } catch (error: any) {
      return `Error generating scorecard: ${error.message}`;
    }
  }

  async generateAnswer(question: string, systemPrompt: string, model: string): Promise<string> {
    if (!this.apiKey || this.apiKey === 'mock_key') return 'Error: Anthropic API Key missing.';
    try {
      const { stableSystem, dynamicContext } = this.splitForCache(systemPrompt);
      const userContent = dynamicContext
        ? `${dynamicContext}\n\nAnswer the question above:`
        : question;
      const body = JSON.stringify({
        model,
        max_tokens: 400,
        system: [{ type: 'text', text: stableSystem, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      });
      const response = await fetch(this.ENDPOINT, { method: 'POST', headers: this.headers, body });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      return data.content?.[0]?.text || '';
    } catch (error: any) {
      return `Error generating response: ${error.message}`;
    }
  }

  async generateAnswerStream(
    question: string,
    systemPrompt: string,
    model: string,
    onChunk: (partial: string, full: string) => void,
    onDone: (full: string) => void,
    onError: (err: string) => void
  ): Promise<void> {
    if (!this.apiKey || this.apiKey === 'mock_key') {
      onError('Error: Please add your Anthropic API Key in Settings to use Claude models.');
      return;
    }
    // Cloud proxy keys (ey-...) are not yet supported for Anthropic
    if (this.apiKey.startsWith('ey-')) {
      onError('Claude models require a direct Anthropic API key. Add one in Settings → API Configuration.');
      return;
    }

    try {
      const { stableSystem, dynamicContext } = this.splitForCache(systemPrompt);
      const userContent = dynamicContext
        ? `${dynamicContext}\n\nAnswer the question above:`
        : question;

      const body = JSON.stringify({
        model,
        max_tokens: 400,
        system: [{ type: 'text', text: stableSystem, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
        stream: true,
      });

      const response = await fetch(this.ENDPOINT, { method: 'POST', headers: this.headers, body });
      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Anthropic API Error (${response.status}): ${errText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              const token = event.delta.text || '';
              if (token) {
                full += token;
                onChunk(token, full);
              }
            }
          } catch {}
        }
      }
      onDone(full);
    } catch (error: any) {
      console.error('Anthropic Stream Error:', error);
      onError(`Error generating response: ${error.message}`);
    }
  }
}
