import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ClaimQuestion {
  id: string;
  question: string;
  answer?: string;
}

export interface AnswerData {
  questionId: string;
  answer: string;
}

@Component({
  selector: 'app-owner-answer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-answer-modal.component.html'
})
export class OwnerAnswerModalComponent {
  @Input() isOpen = false;
  @Input() questions: ClaimQuestion[] = [];
  @Input() finderName = 'Penemu';
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<AnswerData[]>();

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    const answers: AnswerData[] = this.questions.map(q => ({
      questionId: q.id,
      answer: q.answer || ''
    }));

    // Validate all answers filled
    const hasEmpty = answers.some(a => !a.answer.trim());
    if (hasEmpty) {
      alert('Jawab semua pertanyaan');
      return;
    }

    this.submit.emit(answers);
  }
}
