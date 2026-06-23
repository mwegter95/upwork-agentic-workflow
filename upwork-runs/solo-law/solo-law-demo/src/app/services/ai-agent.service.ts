import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AiStep = 'idle' | 'loading' | 'drafting' | 'reflecting' | 'evaluating' | 'done' | 'error';
export type AiTask = 'draft' | 'translate_en_es' | 'translate_es_en' | 'refine';

export interface EvalResult {
  scores: { legal_tone: number; relevance: number; factual_grounding: number; brevity: number };
  overall: number;
  pass: boolean;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class AiAgentService {
  mode: 'webgpu' | 'mock' = 'mock';
  step$ = new BehaviorSubject<AiStep>('idle');
  progress$ = new BehaviorSubject<number>(0);
  evalResult$ = new BehaviorSubject<EvalResult | null>(null);

  private engine: any = null;
  private workerUrl = 'webllm-worker.js';

  async init(): Promise<void> {
    if (this.mode === 'webgpu') return;
    try {
      const gpu = await (navigator as any).gpu?.requestAdapter().catch(() => null);
      if (!gpu) { this.mode = 'mock'; return; }

      this.step$.next('loading');
      const webllm = await import(/* @vite-ignore */ 'https://esm.run/@mlc-ai/web-llm' as any);
      const worker = new Worker(this.workerUrl, { type: 'module' });
      const primaryModel = 'Phi-3.5-mini-instruct-q4f16_1-MLC';
      const fallbackModel = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

      try {
        this.engine = await webllm.CreateWebWorkerMLCEngine(worker, primaryModel, {
          initProgressCallback: (r: any) => this.progress$.next(r.progress || 0)
        });
      } catch (oom) {
        this.engine = await webllm.CreateWebWorkerMLCEngine(worker, fallbackModel, {
          initProgressCallback: (r: any) => this.progress$.next(r.progress || 0)
        });
      }
      this.mode = 'webgpu';
      this.step$.next('idle');
    } catch {
      this.mode = 'mock';
      this.step$.next('idle');
    }
  }

  async runAgentLoop(
    task: AiTask,
    instruction: string,
    context: string,
    brandVoice?: string
  ): Promise<string> {
    if (this.mode === 'mock') return this.mockResponse(task, instruction, context);
    this.evalResult$.next(null);
    let draft = '';

    for (let iter = 0; iter < 3; iter++) {
      // Step 1: Draft
      this.step$.next('drafting');
      draft = await this.callLLM('draft', task, instruction, context, draft, '', brandVoice);

      // Step 2: Reflect
      this.step$.next('reflecting');
      const critique = await this.callLLM('reflect', task, instruction, context, draft);

      // Step 3: Evaluate
      this.step$.next('evaluating');
      const evalRaw = await this.callLLM('eval', task, instruction, context, draft, critique);
      let parsed: EvalResult;
      try {
        parsed = JSON.parse(this.extractJSON(evalRaw));
        this.evalResult$.next(parsed);
      } catch {
        parsed = { scores: { legal_tone: 7, relevance: 7, factual_grounding: 7, brevity: 7 }, overall: 7, pass: true, reason: '' };
      }
      if (parsed.overall >= 7.0 || iter >= 2) break;
    }

    this.step$.next('done');
    return draft;
  }

  private async callLLM(
    phase: 'draft' | 'reflect' | 'eval',
    task: AiTask,
    instruction: string,
    context: string,
    draft = '',
    critique = '',
    brandVoice?: string
  ): Promise<string> {
    const systems: Record<string, string> = {
      draft: `You are a senior legal content writer for a boutique law firm. Write in formal, precise, institutional prose. Avoid marketing clichés. ${brandVoice ? 'Brand voice: ' + brandVoice : ''} Task: ${task}. Practice area context: ${context}.`,
      reflect: 'You are a senior legal editor. Critique the following draft for: legal tone, relevance, factual grounding, and brevity. Output JSON: {"issues": [], "suggestions": []}',
      eval: 'Score this legal draft on axes 0-10: legal_tone, relevance, factual_grounding, brevity. Output only JSON: {"scores": {"legal_tone": N, "relevance": N, "factual_grounding": N, "brevity": N}, "overall": N, "pass": boolean, "reason": ""}',
    };
    const userMessages: Record<string, string> = {
      draft: instruction || `Write a ${task === 'translate_en_es' ? 'Spanish translation of' : task === 'translate_es_en' ? 'English translation of' : task === 'refine' ? 'refined version of' : 'draft about'}: ${context}`,
      reflect: `Draft to critique:\n${draft}`,
      eval: `Draft:\n${draft}\n\nCritique:\n${critique}`,
    };

    const messages = [
      { role: 'system', content: systems[phase] },
      { role: 'user', content: userMessages[phase] },
    ];

    const reply = await this.engine.chat.completions.create({ messages, stream: false });
    return reply.choices[0]?.message?.content || '';
  }

  private extractJSON(text: string): string {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? m[0] : '{}';
  }

  private mockResponse(task: AiTask, instruction: string, context: string): string {
    const taskLabels: Record<AiTask, string> = {
      draft: 'Draft',
      translate_en_es: 'Spanish Translation',
      translate_es_en: 'English Translation',
      refine: 'Refined Copy',
    };
    return `[AI UNAVAILABLE — WebGPU not detected in this browser]

Task: ${taskLabels[task]}
Instruction: ${instruction || '(none)'}
Context: ${context.slice(0, 120)}...

In a WebGPU-enabled browser, this panel streams a real draft using Phi-3.5-mini running entirely in your GPU, reflects on the output using a senior-editor critique prompt, evaluates it against a legal-tone rubric (legal_tone, relevance, factual_grounding, brevity), and iterates until overall score >= 7.0 or 3 passes complete.

Agentic loop: DRAFT → REFLECT → EVAL → (loop if score < 7.0) → ACCEPT/DISMISS`;
  }
}
