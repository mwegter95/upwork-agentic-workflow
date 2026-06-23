import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AiAgentService, AiTask, AiStep } from '../services/ai-agent.service';

@Component({
  selector: 'app-ai-assist',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TranslateDirective, CommonModule],
  template: `
    <div class="border border-accent/20 p-6 h-full flex flex-col gap-4"
         style="background: #0a0a0a;">
      <div class="flex items-center justify-between">
        <p class="text-xs uppercase tracking-widest text-accent">{{ 'cms.ai_assist' | translate }}</p>
        <span class="text-xs text-text-secondary font-mono">
          {{ ai.mode === 'webgpu' ? 'GPU' : 'Mock' }}
        </span>
      </div>

      <!-- Load model button (webgpu not loaded yet) -->
      @if (ai.mode === 'mock' && !modelLoadAttempted()) {
        <button (click)="loadModel()" class="btn-outline text-xs w-full">
          {{ 'cms.ai_load_model' | translate }}
        </button>
        <p class="text-xs text-text-secondary text-center">
          Or use Mock mode — shows what the agentic loop would do.
        </p>
      }

      <!-- Task selector -->
      <div>
        <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">Task</label>
        <select [(ngModel)]="selectedTask" class="sl-input text-xs">
          <option value="draft">{{ 'cms.ai_task_draft' | translate }}</option>
          <option value="translate_en_es">{{ 'cms.ai_task_translate_en_es' | translate }}</option>
          <option value="translate_es_en">{{ 'cms.ai_task_translate_es_en' | translate }}</option>
          <option value="refine">{{ 'cms.ai_task_refine' | translate }}</option>
        </select>
      </div>

      <!-- Instruction -->
      <div>
        <label class="block text-xs uppercase tracking-widest text-text-secondary mb-2">{{ 'cms.ai_instruction' | translate }}</label>
        <textarea [(ngModel)]="instruction" rows="3"
                  class="sl-input resize-none text-sm"
                  placeholder="E.g. Write a concise 150-word overview of our IP litigation services..."></textarea>
      </div>

      <!-- Generate -->
      <button (click)="generate()" [disabled]="isRunning()" class="btn-gold w-full text-xs">
        @if (isRunning()) { {{ stepLabel() }} }
        @else { {{ 'cms.ai_generate' | translate }} }
      </button>

      <!-- Step progress -->
      @if (isRunning()) {
        <div class="flex gap-2 items-center">
          @for (s of steps; track s.key; let last = $last) {
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 rounded-full" [style.background]="stepDotColor(s.key)"></div>
              <span class="text-xs text-text-secondary">{{ s.label }}</span>
            </div>
            @if (!last) { <span class="text-xs" style="color:rgba(255,255,255,0.2)">→</span> }
          }
        </div>
      }

      <!-- Result output -->
      @if (result()) {
        <div class="flex-1 overflow-auto">
          <p class="text-xs uppercase tracking-widest text-text-secondary mb-2">Result</p>
          <div class="p-4 border border-white/10 text-sm text-text-primary font-sans leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto"
               style="background: var(--bg-surface);">{{ result() }}</div>

          <!-- Eval scores -->
          @if (ai.evalResult$.value) {
            <div class="mt-3 grid grid-cols-2 gap-2">
              @for (score of evalScores(); track score.key) {
                <div class="flex justify-between text-xs py-1 border-b border-white/5">
                  <span class="text-text-secondary">{{ score.key }}</span>
                  <span [class.text-green-400]="score.val >= 7"
                        [class.text-yellow-400]="score.val >= 5 && score.val < 7"
                        [class.text-red-400]="score.val < 5">
                    {{ score.val }}/10
                  </span>
                </div>
              }
              <div class="col-span-2 flex justify-between text-xs py-1">
                <span class="text-accent uppercase tracking-widest">Overall</span>
                <span class="text-accent font-mono">{{ ai.evalResult$.value?.overall?.toFixed(1) }}</span>
              </div>
            </div>
          }

          <div class="flex gap-3 mt-4">
            <button (click)="accept()" class="btn-gold flex-1 text-xs">{{ 'cms.ai_accept' | translate }}</button>
            <button (click)="dismiss()" class="btn-ghost flex-1 text-xs">{{ 'cms.ai_dismiss' | translate }}</button>
          </div>
        </div>
      }
    </div>
  `
})
export class AiAssistComponent implements OnInit {
  @Input() context = '';
  @Output() accepted = new EventEmitter<string>();

  ai = inject(AiAgentService);
  selectedTask: AiTask = 'draft';
  instruction = '';
  result = signal('');
  modelLoadAttempted = signal(false);

  currentStep = signal<AiStep>('idle');
  isRunning = signal(false);

  steps = [
    { key: 'drafting', label: 'Draft' },
    { key: 'reflecting', label: 'Reflect' },
    { key: 'evaluating', label: 'Eval' },
  ];

  doneSteps: string[] = [];

  ngOnInit() {
    this.ai.step$.subscribe(s => {
      this.currentStep.set(s);
      if (s === 'drafting') this.doneSteps = [];
      if (s === 'reflecting') this.doneSteps = ['drafting'];
      if (s === 'evaluating') this.doneSteps = ['drafting', 'reflecting'];
      if (s === 'done') {
        this.doneSteps = ['drafting', 'reflecting', 'evaluating'];
        this.isRunning.set(false);
      }
    });
  }

  stepLabel(): string {
    const labels: Record<string, string> = {
      loading: 'Loading model...',
      drafting: 'Drafting...',
      reflecting: 'Reflecting...',
      evaluating: 'Evaluating...',
    };
    return labels[this.currentStep()] || 'Running...';
  }

  isStepDone(key: string) { return this.doneSteps.includes(key); }

  stepDotColor(key: string): string {
    if (this.isStepDone(key)) return '#22c55e';
    if (this.currentStep() === key) return '#C9A96E';
    return 'rgba(255,255,255,0.2)';
  }

  evalScores(): {key: string; val: number}[] {
    const s = this.ai.evalResult$.value?.scores;
    if (!s) return [];
    return Object.entries(s).map(([key, val]) => ({ key, val: val as number }));
  }

  async loadModel() {
    this.modelLoadAttempted.set(true);
    await this.ai.init();
  }

  async generate() {
    this.isRunning.set(true);
    this.result.set('');
    this.doneSteps = [];
    const out = await this.ai.runAgentLoop(this.selectedTask, this.instruction, this.context);
    this.result.set(out);
    this.isRunning.set(false);
  }

  accept() { this.accepted.emit(this.result()); this.result.set(''); }
  dismiss() { this.result.set(''); }
}
