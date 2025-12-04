import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import type { Setup } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class SetupService {
  private readonly storage = inject(StorageService);

  private readonly _setup = signal<Setup | undefined>(undefined);

  readonly setup = this._setup.asReadonly();
  readonly theme = computed(() => this._setup()?.theme);

  async loadSetup(): Promise<Setup | undefined> {
    const setup = await this.storage.loadSetup();
    this._setup.set(setup);
    return setup;
  }

  async saveSetup(setup: Setup): Promise<void> {
    await this.storage.saveSetup(setup);
    this._setup.set(setup);
  }
}
