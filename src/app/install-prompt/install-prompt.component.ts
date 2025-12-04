import { Component, signal, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showPrompt() && !dismissed()) {
      <div class="install-prompt">
        <div class="install-prompt-content">
          <button class="close-btn" (click)="dismiss()" aria-label="Dismiss">
            ✕
          </button>
          <div class="install-prompt-icon">📱</div>
          <h3>Install Time Tracker</h3>
          <p>Add to your home screen for quick access and offline use!</p>
          <div class="install-prompt-actions">
            <button class="install-btn" (click)="install()">Install</button>
            <button class="later-btn" (click)="dismiss()">Maybe Later</button>
            <button class="never-btn" (click)="neverShow()">Never</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .install-prompt {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--card-bg);
        border-top: 2px solid var(--primary-color);
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
        padding: 1.5rem;
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .install-prompt-content {
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
        position: relative;
      }

      .close-btn {
        position: absolute;
        top: -0.5rem;
        right: -0.5rem;
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-color);
        opacity: 0.6;
        transition: opacity 0.2s;
        padding: 0.5rem;
        line-height: 1;
      }

      .close-btn:hover {
        opacity: 1;
      }

      .install-prompt-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-color);
        font-size: 1.5rem;
      }

      p {
        margin: 0 0 1.5rem 0;
        color: var(--text-color);
        opacity: 0.9;
      }

      .install-prompt-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      button {
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .install-btn {
        background: var(--primary-color);
        color: white;
      }

      .install-btn:hover {
        background: var(--primary-hover);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .later-btn {
        background: transparent;
        color: var(--text-color);
        border: 2px solid var(--border-color);
      }

      .later-btn:hover {
        background: var(--card-bg);
        filter: brightness(0.95);
      }

      .never-btn {
        background: transparent;
        color: var(--text-color);
        opacity: 0.6;
        border: none;
        padding: 0.5rem 1rem;
      }

      .never-btn:hover {
        opacity: 1;
        text-decoration: underline;
      }

      @media (max-width: 600px) {
        .install-prompt {
          padding: 1rem;
        }

        .install-prompt-actions {
          flex-direction: column;
        }

        button {
          width: 100%;
        }
      }
    `,
  ],
})
export class InstallPromptComponent {
  private ngZone = inject(NgZone);
  showPrompt = signal(false);
  dismissed = signal(false);
  private deferredPrompt: any = null;

  constructor() {
    // Check if permanently dismissed
    const neverShow = localStorage.getItem('installPromptNeverShow');
    if (neverShow) {
      this.dismissed.set(true);
      return;
    }

    // Check if already dismissed in this session
    const dismissedSession = sessionStorage.getItem('installPromptDismissed');
    if (dismissedSession) {
      this.dismissed.set(true);
    }

    // Check if matchMedia is available (might not be in tests)
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      this.deferredPrompt = e;
      // Run inside Angular's zone to trigger change detection
      this.ngZone.run(() => {
        if (!this.dismissed()) {
          this.showPrompt.set(true);
        }
      });
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.ngZone.run(() => {
        console.log('PWA was installed');
        this.showPrompt.set(false);
        this.deferredPrompt = null;
      });
    });
  }

  async install() {
    if (!this.deferredPrompt) {
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferred prompt
    this.deferredPrompt = null;
    this.showPrompt.set(false);
  }

  dismiss() {
    this.dismissed.set(true);
    this.showPrompt.set(false);
    // Remember dismissal for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  }

  neverShow() {
    this.dismissed.set(true);
    this.showPrompt.set(false);
    // Remember permanently
    localStorage.setItem('installPromptNeverShow', 'true');
  }
}
