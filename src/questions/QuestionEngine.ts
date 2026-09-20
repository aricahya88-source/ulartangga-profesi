import rawQuestions from '../data/questions.json';
import type { Competency } from '../game/Board';
import { Matching } from './Matching';
import { MultiSelect } from './MultiSelect';
import { SingleChoice } from './SingleChoice';
import { TrueFalse } from './TrueFalse';
import type { AnswerOutcome, AnswerWidget, Question } from './types';

const questions = rawQuestions as Question[];

function sameNumbers(a: number[], b: number[]): boolean {
  const aa = [...a].sort((x, y) => x - y);
  const bb = [...b].sort((x, y) => x - y);
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
}

export class QuestionEngine {
  private used = new Set<string>();

  constructor(private readonly overlay: HTMLElement, private readonly card: HTMLElement) {}

  reset() {
    this.used.clear();
  }

  get usedCount() { return this.used.size; }

  draw(competency: Competency): Question {
    const all = questions.filter((q) => q.competency === competency);
    let candidates = all.filter((q) => !this.used.has(q.id));
    if (!candidates.length) {
      all.forEach((q) => this.used.delete(q.id));
      candidates = [...all];
    }
    const question = candidates[Math.floor(Math.random() * candidates.length)];
    this.used.add(question.id);
    return question;
  }

  async ask(question: Question, eventLabel: string): Promise<AnswerOutcome> {
    this.card.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'question-head';
    header.innerHTML = `<div><span class="eyebrow">${eventLabel} · ${question.competency}</span><h2>${question.title}</h2></div><span class="type-pill">${this.typeLabel(question.type)}</span>`;

    const stimulus = document.createElement('div');
    stimulus.className = 'stimulus';
    stimulus.textContent = question.stimulus;

    const prompt = document.createElement('div');
    prompt.className = 'prompt';
    prompt.textContent = question.prompt;

    const widget = this.createWidget(question);
    const actions = document.createElement('div');
    actions.className = 'question-actions';
    const lockButton = document.createElement('button');
    lockButton.className = 'primary';
    lockButton.textContent = 'Kunci Jawaban';
    lockButton.disabled = true;
    actions.appendChild(lockButton);

    const result = document.createElement('div');
    result.className = 'answer-result hidden';

    this.card.append(header, stimulus, prompt, widget.element, actions, result);
    this.overlay.classList.remove('hidden');
    widget.onChange(() => { lockButton.disabled = !widget.canSubmit(); });

    const outcome = await new Promise<AnswerOutcome>((resolve) => {
      lockButton.addEventListener('click', () => {
        widget.lock();
        lockButton.remove();
        const evaluated = this.evaluate(question, widget.getValue());
        result.className = `answer-result ${evaluated.fullCorrect ? 'correct' : 'wrong'}`;
        result.innerHTML = `<strong>${evaluated.fullCorrect ? '✓ Jawaban tepat' : 'Jawaban belum sepenuhnya tepat'} · +${evaluated.points} poin</strong><p><b>Jawaban:</b> ${evaluated.answerText}</p><p><b>Pembahasan:</b> ${evaluated.explanation}</p>`;
        const continueButton = document.createElement('button');
        continueButton.className = 'primary';
        continueButton.textContent = 'Lanjutkan Permainan';
        actions.appendChild(continueButton);
        continueButton.addEventListener('click', () => {
          this.overlay.classList.add('hidden');
          resolve(evaluated);
        }, { once: true });
      }, { once: true });
    });
    return outcome;
  }

  private createWidget(question: Question): AnswerWidget {
    switch (question.type) {
      case 'mcq': return new SingleChoice(question);
      case 'tf': return new TrueFalse(question);
      case 'match': return new Matching(question);
      case 'multi': return new MultiSelect(question);
    }
  }

  private evaluate(question: Question, value: unknown): AnswerOutcome {
    if (question.type === 'mcq') {
      const correct = value === question.answer;
      return { fullCorrect: correct, points: correct ? 100 : 0, answerText: (question.options ?? [])[Number(question.answer)] ?? '', explanation: question.explanation };
    }
    if (question.type === 'tf') {
      const correct = value === question.answer;
      return { fullCorrect: correct, points: correct ? 100 : 0, answerText: question.answer ? 'Benar' : 'Salah', explanation: question.explanation };
    }
    if (question.type === 'multi') {
      const selected = value as number[];
      const correctIndices = question.answer as number[];
      const fullCorrect = sameNumbers(selected, correctIndices);
      const correctPicked = selected.filter((index) => correctIndices.includes(index)).length;
      const wrongPicked = selected.filter((index) => !correctIndices.includes(index)).length;
      const points = fullCorrect ? 150 : Math.max(0, Math.min(120, correctPicked * 40 - wrongPicked * 25));
      return {
        fullCorrect,
        points,
        answerText: correctIndices.map((index) => (question.options ?? [])[index]).join('; '),
        explanation: question.explanation
      };
    }
    const selected = value as string[];
    const pairs = question.pairs ?? [];
    const correctCount = selected.filter((item, index) => item === pairs[index]?.right).length;
    const fullCorrect = correctCount === pairs.length;
    return {
      fullCorrect,
      points: fullCorrect ? 150 : correctCount * 30,
      answerText: pairs.map((p) => `${p.left} → ${p.right}`).join('; '),
      explanation: question.explanation
    };
  }

  private typeLabel(type: Question['type']) {
    return ({ mcq: 'Pilihan Ganda', tf: 'Benar / Salah', match: 'Menjodohkan', multi: 'Jawaban Lebih dari 1' })[type];
  }
}
