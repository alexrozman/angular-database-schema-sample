import { AfterContentInit, AfterViewChecked, AfterViewInit, Component, ElementRef, viewChild } from '@angular/core';
import { OpenAIService } from '../openai.service';
import { LogService } from '../log.service';
import { HelpfulLabelComponent } from '../helpful-label/helpful-label.component';

@Component({
  selector: 'app-openai-response',
  standalone: true,
  imports: [HelpfulLabelComponent],
  templateUrl: './openai-response.component.html',
  styleUrl: './openai-response.component.scss'
})
export class OpenaiResponseComponent implements AfterViewChecked {
  protected scrollAnchor = viewChild.required<ElementRef<HTMLDivElement>>('scrollAnchor');

  constructor(
    private log: LogService,
    protected openai: OpenAIService,
  ) { }

  scrolled = false;

  ngAfterViewChecked(): void {
    if (!this.openai.lastResponse || this.openai.lastResponse.type == "none") {
      return;
    }

    if (this.scrolled) {
      // Only scroll into view once.
      return;
    }

    console.log('scroll')
    this.scrollAnchor().nativeElement.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    this.scrolled = true;
  }
}
