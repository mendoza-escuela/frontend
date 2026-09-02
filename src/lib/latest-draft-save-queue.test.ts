import { describe, expect, it, vi } from "vitest";
import {
  DraftAuthoritativeStateChangedError,
  LatestDraftSaveQueue,
} from "./latest-draft-save-queue";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("LatestDraftSaveQueue", () => {
  it("mantiene un solo request y coalesce las ediciones al snapshot más nuevo", async () => {
    const first = deferred<{ revision: number }>();
    const second = deferred<{ revision: number }>();
    const persist = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const queue = new LatestDraftSaveQueue(7, persist);

    const completed = queue.enqueue({ answer: "inicial" });
    await Promise.resolve();
    expect(persist).toHaveBeenCalledWith({ answer: "inicial" }, 7);

    void queue.enqueue({ answer: "intermedia" });
    void queue.enqueue({ answer: "más nueva" });
    expect(persist).toHaveBeenCalledTimes(1);

    first.resolve({ revision: 8 });
    await Promise.resolve();
    await Promise.resolve();
    expect(persist).toHaveBeenNthCalledWith(2, { answer: "más nueva" }, 8);

    second.resolve({ revision: 9 });
    await expect(completed).resolves.toBe(9);
    expect(persist).toHaveBeenCalledTimes(2);
    expect(queue.currentRevision).toBe(9);
  });

  it("no publica como guardada una respuesta vieja si hay una edición pendiente", async () => {
    const first = deferred<{ revision: number; marker: string }>();
    const second = deferred<{ revision: number; marker: string }>();
    const states: Array<[string, string | undefined]> = [];
    const persist = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const queue = new LatestDraftSaveQueue<
      string,
      { revision: number; marker: string }
    >(0, persist, (state, result) => {
      states.push([state, result?.marker]);
    });

    const completed = queue.enqueue("vieja");
    await Promise.resolve();
    void queue.enqueue("nueva");
    first.resolve({ revision: 1, marker: "vieja" });
    await Promise.resolve();
    await Promise.resolve();
    expect(states).not.toContainEqual(["idle", "vieja"]);

    second.resolve({ revision: 2, marker: "nueva" });
    await completed;
    expect(states).toContainEqual(["idle", "nueva"]);
  });

  it("flush espera el request activo y la edición pendiente", async () => {
    const first = deferred<{ revision: number }>();
    const second = deferred<{ revision: number }>();
    const persist = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const queue = new LatestDraftSaveQueue(2, persist);

    void queue.enqueue("a");
    await Promise.resolve();
    const flushed = queue.flush("b");
    let finished = false;
    void flushed.then(() => {
      finished = true;
    });

    first.resolve({ revision: 3 });
    await Promise.resolve();
    await Promise.resolve();
    expect(finished).toBe(false);
    second.resolve({ revision: 4 });
    await expect(flushed).resolves.toBe(4);
  });

  it("detiene la cola en un conflicto y conserva el snapshot para recarga o reintento", async () => {
    const conflict = new Error("conflict");
    const persist = vi.fn().mockRejectedValue(conflict);
    const queue = new LatestDraftSaveQueue(3, persist);

    await expect(queue.enqueue("cambio")).rejects.toBe(conflict);
    expect(queue.currentRevision).toBe(3);
    expect(queue.hasPendingChanges).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("adopta la revisión escrita pero pausa ante un contrato autoritativo nuevo", async () => {
    const states: string[] = [];
    const persist = vi.fn().mockResolvedValue({
      revision: 6,
      authoritativeChanged: true,
    });
    const queue = new LatestDraftSaveQueue(5, persist, (state) => {
      states.push(state);
    });

    await expect(queue.enqueue("snapshot")).rejects.toBeInstanceOf(
      DraftAuthoritativeStateChangedError,
    );
    expect(queue.currentRevision).toBe(6);
    expect(queue.hasPendingChanges).toBe(false);
    expect(states).toContain("refresh-required");
  });
});
