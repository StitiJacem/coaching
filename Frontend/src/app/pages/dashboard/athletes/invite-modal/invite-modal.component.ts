import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AthleteService } from '../../../../services/athlete.service';

@Component({
    selector: 'app-invite-modal',
    standalone: false,
    templateUrl: './invite-modal.component.html',
    styleUrls: []
})
export class InviteModalComponent {
    @Output() close = new EventEmitter<void>();
    @Output() invited = new EventEmitter<void>();

    inviteForm: FormGroup;
    loading = false;
    error: string | null = null;
    success = false;

    constructor(
        private fb: FormBuilder,
        private athleteService: AthleteService
    ) {
        this.inviteForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            message: ['']
        });
    }

    onSubmit(): void {
        if (this.inviteForm.invalid) return;

        this.loading = true;
        this.error = null;
        const { email, message } = this.inviteForm.value;

        this.athleteService.invite(email, message).subscribe({
            next: (res) => {
                this.loading = false;
                this.success = true;
                this.invited.emit();
                setTimeout(() => this.close.emit(), 2000);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Failed to send invitation. Please try again.';
            }
        });
    }
}
