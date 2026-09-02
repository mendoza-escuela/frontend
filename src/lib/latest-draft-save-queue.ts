export type DraftSaveQueueState =
  "idle" | "unsaved" | "saving" | "refresh-required" | "error";

type RevisionedSaveResult = {
  revision: number;
  authoritativeChanged?: boolean;
};

export class DraftAuthoritativeStateChangedError extends Error {
  constructor() {
    super(
      "El cuestionario o su aplicabilidad cambiaron mientras se guardaba. Revisá la versión actualizada antes de continuar.",
    );
    this.name = "DraftAuthoritativeStateChangedError";
  }
}

type PendingSnapshot<TSnapshot> = {
  generation: number;
  snapshot: TSnapshot;
};

/**
 * Serializa guardados de borrador y conserva solamente el snapshot pendiente
 * más nuevo. Una edición recibida durante un request se guarda después con la
 * revisión devuelta por ese request; nunca se despachan dos escrituras a la vez.
 */
export class LatestDraftSaveQueue<
  TSnapshot,
  TResult extends RevisionedSaveResult,
> {
  private revision: number;
  private generation = 0;
  private pending: PendingSnapshot<TSnapshot> | null = null;
  private draining: Promise<number> | null = null;
  private readonly persist: (
    snapshot: TSnapshot,
    expectedRevision: number,
  ) => Promise<TResult>;
  private readonly onStateChange: (
    state: DraftSaveQueueState,
    result?: TResult,
  ) => void;

  constructor(
    initialRevision: number,
    persist: (
      snapshot: TSnapshot,
      expectedRevision: number,
    ) => Promise<TResult>,
    onStateChange: (
      state: DraftSaveQueueState,
      result?: TResult,
    ) => void = () => undefined,
  ) {
    this.revision = initialRevision;
    this.persist = persist;
    this.onStateChange = onStateChange;
  }

  get currentRevision() {
    return this.revision;
  }

  get hasPendingChanges() {
    return this.pending !== null || this.draining !== null;
  }

  enqueue(snapshot: TSnapshot) {
    this.pending = { generation: ++this.generation, snapshot };
    this.onStateChange("unsaved");
    return this.drain();
  }

  flush(snapshot?: TSnapshot) {
    if (snapshot !== undefined) return this.enqueue(snapshot);
    return this.drain();
  }

  private drain(): Promise<number> {
    if (this.draining) {
      return this.draining.then(() =>
        this.pending ? this.drain() : this.revision,
      );
    }
    if (!this.pending) return Promise.resolve(this.revision);

    const draining = Promise.resolve().then(() => this.persistPending());
    this.draining = draining;
    return draining.finally(() => {
      if (this.draining === draining) this.draining = null;
    });
  }

  private async persistPending() {
    while (this.pending) {
      const entry = this.pending;
      this.pending = null;
      const expectedRevision = this.revision;
      this.onStateChange("saving");

      let result: TResult;
      try {
        result = await this.persist(entry.snapshot, expectedRevision);
        if (result.revision !== expectedRevision + 1) {
          throw new Error(
            "El servidor devolvió una revisión de borrador inesperada.",
          );
        }
      } catch (error) {
        // Si no llegó una edición posterior, el snapshot fallido continúa
        // pendiente para un reintento manual. Los conflictos no se reintentan
        // automáticamente porque requieren recargar la fuente autoritativa.
        if (!this.pending) this.pending = entry;
        this.onStateChange("error");
        throw error;
      }

      this.revision = result.revision;
      if (result.authoritativeChanged) {
        this.onStateChange("refresh-required", result);
        throw new DraftAuthoritativeStateChangedError();
      }
      // Un resultado anterior sólo actualiza la revisión interna necesaria
      // para el siguiente PUT. No se anuncia como guardado si ya existe una
      // edición local más nueva.
      if (entry.generation === this.generation) {
        this.onStateChange("idle", result);
      }
    }

    this.onStateChange("idle");
    return this.revision;
  }
}
